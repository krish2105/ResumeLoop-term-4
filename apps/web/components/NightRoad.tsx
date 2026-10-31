"use client";
// The ember road. A pure view of the planner: one star per course task, in road order.
// The DOM panel beside the canvas is the accessible source of truth (keyboard and screen readers).
import {Canvas, useFrame} from '@react-three/fiber';
import {AdaptiveDpr, Billboard, Line, PerformanceMonitor, Sparkles, Stars, Text} from '@react-three/drei';
import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {PALETTE, Ribbon, roadPoints, Star} from './scene/primitives';

export {PALETTE};
export type RoadState = 'completed' | 'next' | 'planned' | 'locked' | 'does-not-fit' | 'abstained';
export type RoadNode = {id: string; title: string; state: RoadState; prerequisites: string[]; minutes: number | null};

const SIZE: Record<RoadState, number> = {next: 0.34, planned: 0.2, completed: 0.17, locked: 0.11, 'does-not-fit': 0.13, abstained: 0.11};
const GLOW: Record<RoadState, number> = {next: 3.4, planned: 1.9, completed: 2.1, locked: 0.7, 'does-not-fit': 0.9, abstained: 0.7};
const LIFT = new THREE.Vector3(0, 0.42, 0);

function CameraRig({target, reducedMotion}: {target: THREE.Vector3; reducedMotion: boolean}) {
  const look = useRef(new THREE.Vector3());
  useFrame(({camera, size}, delta) => {
    const narrow = size.width < 560;
    const goal = target.clone().add(new THREE.Vector3(narrow ? 0.6 : 2.4, narrow ? 2.4 : 2.1, narrow ? 9.5 : 7.4));
    const ahead = target.clone().add(new THREE.Vector3(narrow ? 0 : -0.8, 0.1, -5.5));
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.4);
    camera.position.lerp(goal, k);
    look.current.lerp(ahead, k);
    camera.lookAt(look.current);
  });
  return null;
}

export default function NightRoad({nodes, selected, onSelect, theme, reducedMotion}: {
  nodes: RoadNode[]; selected: string | null; onSelect: (id: string) => void; theme: 'light' | 'dark'; reducedMotion: boolean;
}) {
  const colors = PALETTE[theme];
  const [hover, setHover] = useState<string | null>(null);
  const [dpr, setDpr] = useState(1.5);
  const points = useMemo(() => roadPoints(Math.max(nodes.length, 2)), [nodes.length]);
  const road = useMemo(() => [points[0].clone().add(new THREE.Vector3(0, 0, 7)), ...points, points[points.length - 1].clone().add(new THREE.Vector3(0, 0, -10))], [points]);
  const index = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
  const focusId = selected ?? nodes.find(n => n.state === 'next')?.id ?? nodes.find(n => n.state !== 'completed')?.id ?? nodes[nodes.length - 1]?.id;
  const focus = focusId ? nodes[index.get(focusId) ?? 0] : undefined;
  const at = (id: string) => points[index.get(id) ?? 0].clone().add(LIFT);
  const target = focus ? at(focus.id) : points[0];
  const done = nodes.filter(n => n.state === 'completed').length;
  // Road segment 0..1 over [lead-in, nodes..., tail]; light it up to the next star.
  const upTo = Math.min(1, (done + 1) / (road.length - 1));
  const labelled = [...new Set([focusId, hover].filter(Boolean) as string[])];
  const color = (s: RoadState) => s === 'next' ? colors.next : s === 'completed' ? colors.completed : s === 'planned' ? colors.planned : colors.locked;
  return <Canvas camera={{position: [3, 3, 9], fov: 46}} dpr={dpr} gl={{antialias: true, powerPreference: 'high-performance'}} aria-hidden="true"
    onPointerMissed={() => setHover(null)}>
    <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))} />
    <AdaptiveDpr pixelated={false} />
    <color attach="background" args={[colors.sky]} />
    <fog attach="fog" args={[colors.fog, 10, theme === 'dark' ? 46 : 40]} />
    {theme === 'dark' && <Stars radius={90} depth={50} count={reducedMotion ? 1800 : 3600} factor={2.6} saturation={0} fade speed={reducedMotion ? 0 : 0.35} />}
    {!reducedMotion && <Sparkles count={theme === 'dark' ? 70 : 40} scale={[14, 4, 40]} position={[0, 1, -14]} size={theme === 'dark' ? 2.4 : 1.6} speed={0.25} opacity={theme === 'dark' ? 0.55 : 0.35} color={colors.dust} />}
    <Ribbon points={road} colors={colors} upTo={upTo} />
    {focus && focus.prerequisites.filter(p => index.has(p)).map(p => <Line key={p} points={[at(p), at(focus.id)]} color={colors.edge} lineWidth={1.4} transparent opacity={0.6} dashed dashSize={0.18} gapSize={0.14} />)}
    {nodes.map((n, i) => <group key={n.id} position={points[i].clone().add(LIFT)}>
      <Star color={color(n.state)} radius={SIZE[n.state] * (n.id === selected ? 1.25 : 1)} intensity={GLOW[n.state]} glow={colors.glow}
        pulse={n.state === 'next' ? 0.12 : n.state === 'locked' ? 0 : 0.04} reducedMotion={reducedMotion}
        onClick={() => onSelect(n.id)} onHover={h => setHover(cur => (h ? n.id : cur === n.id ? null : cur))} />
      {n.id === focusId && <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[SIZE[n.state] * 2.1, SIZE[n.state] * 2.25, 64]} />
        <meshBasicMaterial color={colors.next} transparent opacity={0.75} side={THREE.DoubleSide} toneMapped={!colors.glow} /></mesh>}
      {labelled.includes(n.id) && <Billboard position={[0, SIZE[n.state] + 0.42, 0]}>
        <Text fontSize={0.2} color={colors.label} outlineWidth={0.014} outlineColor={colors.labelOutline} anchorX="center" anchorY="bottom" maxWidth={3.2} textAlign="center" lineHeight={1.15}>
          {(n.state === 'next' ? 'Next · ' : '') + n.title}
        </Text></Billboard>}
    </group>)}
    <CameraRig target={target} reducedMotion={reducedMotion} />
    {colors.glow && <EffectComposer multisampling={0}><Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.72} levels={6} /></EffectComposer>}
  </Canvas>;
}
