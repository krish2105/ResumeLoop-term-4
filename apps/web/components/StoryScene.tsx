"use client";
// Story mode: the design-thinking process as constellations along the ember road. Each stop's
// satellite stars are its real evidence items (fictional examples never count).
import {Canvas, useFrame} from '@react-three/fiber';
import {AdaptiveDpr, Billboard, Sparkles, Stars, Text} from '@react-three/drei';
import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {useMemo, useRef} from 'react';
import * as THREE from 'three';
import {PALETTE, Ribbon, Star, type SceneColors} from './scene/primitives';

export type Stop = {key: string; title: string; evidence: number};

const POS = (i: number) => new THREE.Vector3(Math.sin(i * 0.9) * 4.2, Math.sin(i * 0.5) * 0.6, -i * 8);

function Constellation({stop, index, active, colors, reducedMotion}: {stop: Stop; index: number; active: boolean; colors: SceneColors; reducedMotion: boolean}) {
  const ring = useRef<THREE.Group>(null);
  const n = Math.min(18, stop.evidence);
  const sats = useMemo(() => Array.from({length: n}, (_, k) => {
    const a = (k / Math.max(n, 1)) * Math.PI * 2;
    const r = 1 + (k % 3) * 0.35;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.25, Math.sin(a) * r);
  }), [n]);
  useFrame((_, dt) => { if (ring.current && !reducedMotion) ring.current.rotation.y += dt * (active ? 0.25 : 0.06); });
  const core = stop.evidence > 0 ? (active ? colors.next : colors.completed) : colors.locked;
  return <group position={POS(index)}>
    <Star color={core} radius={active ? 0.42 : 0.28} intensity={active ? 3.2 : 1.6} glow={colors.glow} pulse={active ? 0.1 : 0.03} reducedMotion={reducedMotion} />
    <group ref={ring}>{sats.map((p, k) => <group key={k} position={p}><Star color={colors.planned} radius={0.06} intensity={1.6} glow={colors.glow} pulse={0} reducedMotion /></group>)}</group>
    <Billboard position={[0, active ? 1.5 : 1.15, 0]}>
      <Text fontSize={active ? 0.42 : 0.28} color={colors.label} outlineWidth={0.02} outlineColor={colors.labelOutline} anchorX="center" anchorY="bottom">{stop.title}</Text>
    </Billboard>
  </group>;
}

function Rig({index, reducedMotion}: {index: number; reducedMotion: boolean}) {
  const look = useRef(new THREE.Vector3());
  useFrame(({camera, size}, dt) => {
    const t = POS(index);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 1.8);
    const narrow = size.width < 560;
    camera.position.lerp(t.clone().add(new THREE.Vector3(narrow ? 0.5 : 2.6, 1.8, narrow ? 10.5 : 8.5)), k);
    look.current.lerp(t.clone().add(new THREE.Vector3(0, 0.3, -1.5)), k);
    camera.lookAt(look.current);
  });
  return null;
}

export default function StoryScene({stops, index, theme, reducedMotion}: {stops: Stop[]; index: number; theme: 'light' | 'dark'; reducedMotion: boolean}) {
  const colors = PALETTE[theme];
  const path = useMemo(() => [POS(0).add(new THREE.Vector3(0, 0, 6)), ...stops.map((_, i) => POS(i)), POS(stops.length - 1).add(new THREE.Vector3(0, 0, -8))], [stops]);
  const upTo = (index + 1) / (path.length - 1);
  return <Canvas camera={{position: [3, 3, 12], fov: 48}} dpr={[1, 1.75]} aria-hidden="true">
    <AdaptiveDpr pixelated={false} />
    <color attach="background" args={[colors.sky]} />
    <fog attach="fog" args={[colors.fog, 12, 52]} />
    {theme === 'dark' && <Stars radius={100} depth={60} count={reducedMotion ? 1800 : 4000} factor={2.8} fade speed={reducedMotion ? 0 : 0.3} />}
    {!reducedMotion && <Sparkles count={60} scale={[16, 5, 50]} position={[0, 1, -20]} size={2} speed={0.2} opacity={0.45} color={colors.dust} />}
    <Ribbon points={path} colors={colors} upTo={upTo} />
    {stops.map((s, i) => <Constellation key={s.key} stop={s} index={i} active={i === index} colors={colors} reducedMotion={reducedMotion} />)}
    <Rig index={index} reducedMotion={reducedMotion} />
    {colors.glow && <EffectComposer multisampling={0}><Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} radius={0.7} levels={6} /></EffectComposer>}
  </Canvas>;
}
