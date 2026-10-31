"use client";
// The 3D night road. Purely a view: every star mirrors a planner item, and the accessible
// DOM list beside the canvas is the source of truth for keyboard and screen-reader users.
import {Canvas, useFrame} from '@react-three/fiber';
import {Billboard, Line, Stars, Text} from '@react-three/drei';
import {useMemo, useRef, useState} from 'react';
import * as THREE from 'three';

export type RoadState = 'completed' | 'next' | 'planned' | 'locked' | 'does-not-fit' | 'abstained';
export type RoadNode = {id: string; title: string; state: RoadState; prerequisites: string[]; minutes: number | null};

export const PALETTE = {
  dark: {bg: '#050816', fog: '#070b1f', road: '#3d3f9a', completed: '#34d3a6', next: '#a78bfa', planned: '#f1f5ff', locked: '#3c4459', edge: '#6d6ff0', label: '#e9ecff'},
  light: {bg: '#f6efe3', fog: '#f1e7d6', road: '#b9aee6', completed: '#0b7f62', next: '#5b49d6', planned: '#2a2f45', locked: '#c2b8a8', edge: '#8c80dc', label: '#1d2033'},
};

const SIZE: Record<RoadState, number> = {next: 0.42, planned: 0.27, completed: 0.24, locked: 0.17, 'does-not-fit': 0.2, abstained: 0.17};

export function roadPoints(n: number): THREE.Vector3[] {
  return Array.from({length: n}, (_, i) => new THREE.Vector3(Math.sin(i * 0.72) * 2.7, Math.cos(i * 0.43) * 0.7, -i * 3.3));
}

function CameraRig({target, reducedMotion}: {target: THREE.Vector3; reducedMotion: boolean}) {
  const look = useRef(new THREE.Vector3());
  useFrame(({camera}, delta) => {
    const goal = target.clone().add(new THREE.Vector3(1.8, 3.2, 8.5));
    const ahead = target.clone().add(new THREE.Vector3(0, -0.4, -7));
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.2);
    camera.position.lerp(goal, k);
    look.current.lerp(ahead, k);
    camera.lookAt(look.current);
  });
  return null;
}

function Star({node, position, colors, selected, reducedMotion, onSelect}: {
  node: RoadNode; position: THREE.Vector3; colors: typeof PALETTE.dark; selected: boolean; reducedMotion: boolean; onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const color = node.state === 'next' ? colors.next : node.state === 'completed' ? colors.completed
    : node.state === 'planned' ? colors.planned : colors.locked;
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({clock}) => {
    if (!ref.current) return;
    const pulse = reducedMotion || node.state === 'locked' ? 1 : 1 + Math.sin(clock.elapsedTime * 2 + seed) * (node.state === 'next' ? 0.12 : 0.05);
    ref.current.scale.setScalar(pulse * (hover || selected ? 1.25 : 1));
  });
  return <group position={position}>
    <mesh ref={ref} onClick={e => { e.stopPropagation(); onSelect(node.id); }}
      onPointerOver={e => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}>
      <icosahedronGeometry args={[SIZE[node.state], 2]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={node.state === 'locked' ? 0.15 : 1.1} roughness={0.35} />
    </mesh>
    {(node.state === 'next' || selected) && <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[SIZE[node.state] * 1.9, 0.018, 8, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>}
    <Billboard position={[0, SIZE[node.state] + 0.5, 0]} visible={node.state === 'next' || selected || hover}>
      <Text fontSize={0.3} color={colors.label} outlineWidth={0.02} outlineColor={colors.bg} anchorX="center" anchorY="bottom" maxWidth={6} textAlign="center">
        {(node.state === 'next' ? 'Next: ' : '') + node.title}
      </Text>
    </Billboard>
  </group>;
}

export default function NightRoad({nodes, selected, onSelect, theme, reducedMotion}: {
  nodes: RoadNode[]; selected: string | null; onSelect: (id: string) => void; theme: 'light' | 'dark'; reducedMotion: boolean;
}) {
  const colors = PALETTE[theme];
  const points = useMemo(() => roadPoints(Math.max(nodes.length, 2)), [nodes.length]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    points[0].clone().add(new THREE.Vector3(0, 0, 6)), ...points, points[points.length - 1].clone().add(new THREE.Vector3(0, 0, -8))]), [points]);
  const byId = useMemo(() => new Map(nodes.map((n, i) => [n.id, points[i]])), [nodes, points]);
  const focus = selected ?? nodes.find(n => n.state === 'next')?.id ?? nodes.find(n => n.state !== 'completed')?.id ?? nodes[nodes.length - 1]?.id;
  const target = (focus && byId.get(focus)) || points[0];
  const edges = nodes.flatMap(n => n.prerequisites.map(p => [byId.get(p), byId.get(n.id)]).filter(([a, b]) => a && b)) as [THREE.Vector3, THREE.Vector3][];
  return <Canvas camera={{position: [2, 3, 8], fov: 50}} dpr={[1, 2]} gl={{antialias: true}} aria-hidden="true">
    <color attach="background" args={[colors.bg]} />
    <fog attach="fog" args={[colors.fog, 7, 34]} />
    <ambientLight intensity={theme === 'dark' ? 0.5 : 1.1} />
    <pointLight position={[target.x, target.y + 3, target.z + 2]} intensity={theme === 'dark' ? 30 : 12} color={colors.next} />
    {theme === 'dark' && <Stars radius={70} depth={45} count={reducedMotion ? 1400 : 3200} factor={3.2} saturation={0} fade speed={reducedMotion ? 0 : 0.5} />}
    <mesh>
      <tubeGeometry args={[curve, 320, 0.07, 10, false]} />
      <meshBasicMaterial color={colors.road} transparent opacity={0.85} />
    </mesh>
    {edges.map(([a, b], i) => <Line key={i} points={[a, b]} color={colors.edge} lineWidth={1.2} transparent opacity={0.45} dashed dashSize={0.25} gapSize={0.18} />)}
    {nodes.map((n, i) => <Star key={n.id} node={n} position={points[i]} colors={colors} selected={selected === n.id} reducedMotion={reducedMotion} onSelect={onSelect} />)}
    <CameraRig target={target} reducedMotion={reducedMotion} />
  </Canvas>;
}
