"use client";
// Story mode: the design-thinking process as a constellation road. Each stop is a cluster of
// stars whose size reflects how much real evidence that stage has (fictional items count zero).
import {Canvas, useFrame} from '@react-three/fiber';
import {Billboard, Line, Stars, Text} from '@react-three/drei';
import {useMemo, useRef} from 'react';
import * as THREE from 'three';
import {PALETTE} from './NightRoad';

export type Stop = {key: string; title: string; evidence: number};

const POS = (i: number) => new THREE.Vector3(Math.sin(i * 1.1) * 5, Math.cos(i * 0.8) * 1.2, -i * 9);

function Cluster({stop, index, active, colors, reducedMotion}: {stop: Stop; index: number; active: boolean; colors: typeof PALETTE.dark; reducedMotion: boolean}) {
  const group = useRef<THREE.Group>(null);
  const count = Math.min(24, 3 + stop.evidence);
  const offsets = useMemo(() => Array.from({length: count}, (_, k) => new THREE.Vector3(Math.cos(k * 2.4) * (0.6 + (k % 5) * 0.25), Math.sin(k * 1.7) * 0.8, Math.sin(k * 2.4) * (0.6 + (k % 3) * 0.3))), [count]);
  useFrame((_, dt) => { if (group.current && !reducedMotion) group.current.rotation.y += dt * (active ? 0.35 : 0.08); });
  const color = stop.evidence > 0 ? (active ? colors.next : colors.completed) : colors.locked;
  return <group position={POS(index)}>
    <group ref={group}>{offsets.map((o, k) => <mesh key={k} position={o}><icosahedronGeometry args={[k === 0 ? 0.42 : 0.09 + (k % 4) * 0.03, 1]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.4 : 0.6} /></mesh>)}</group>
    <Billboard position={[0, 2.2, 0]}><Text fontSize={active ? 0.5 : 0.36} color={colors.label} outlineWidth={0.03} outlineColor={colors.bg} anchorX="center">{`${index + 1}. ${stop.title}`}</Text></Billboard>
  </group>;
}

function Rig({index, reducedMotion}: {index: number; reducedMotion: boolean}) {
  const look = useRef(new THREE.Vector3());
  useFrame(({camera}, dt) => {
    const t = POS(index);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 1.8);
    camera.position.lerp(t.clone().add(new THREE.Vector3(3, 2.6, 12)), k);
    look.current.lerp(t.clone().add(new THREE.Vector3(0, 0.8, 0)), k);
    camera.lookAt(look.current);
  });
  return null;
}

export default function StoryScene({stops, index, theme, reducedMotion}: {stops: Stop[]; index: number; theme: 'light' | 'dark'; reducedMotion: boolean}) {
  const colors = PALETTE[theme];
  const path = useMemo(() => new THREE.CatmullRomCurve3(stops.map((_, i) => POS(i))).getPoints(200), [stops]);
  return <Canvas camera={{position: [3, 3, 12], fov: 50}} dpr={[1, 2]} aria-hidden="true">
    <color attach="background" args={[colors.bg]} />
    <fog attach="fog" args={[colors.fog, 10, 48]} />
    <ambientLight intensity={theme === 'dark' ? 0.5 : 1.1} />
    {theme === 'dark' && <Stars radius={90} depth={60} count={reducedMotion ? 1500 : 4000} factor={3.5} fade speed={reducedMotion ? 0 : 0.4} />}
    <Line points={path} color={colors.road} lineWidth={3} transparent opacity={0.9} />
    {stops.map((s, i) => <Cluster key={s.key} stop={s} index={i} active={i === index} colors={colors} reducedMotion={reducedMotion} />)}
    <Rig index={index} reducedMotion={reducedMotion} />
  </Canvas>;
}
