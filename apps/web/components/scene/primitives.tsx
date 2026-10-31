"use client";
// Shared 3D building blocks for the ember road and story mode.
import {useFrame} from '@react-three/fiber';
import {Billboard, Text} from '@react-three/drei';
import {useMemo, useRef} from 'react';
import * as THREE from 'three';

export type SceneColors = {
  sky: string; fog: string; road: string; travelled: string; completed: string; next: string; planned: string; locked: string;
  edge: string; label: string; labelOutline: string; dust: string; glow: boolean;
};

export const PALETTE: Record<'light' | 'dark', SceneColors> = {
  dark: {sky: '#0D0A0B', fog: '#110D0E', road: '#4A3430', travelled: '#FF8E6B', completed: '#7BD3A8', next: '#FF8E6B', planned: '#F1EAE5',
    locked: '#6E6266', edge: '#FF8E6B', label: '#F1EAE5', labelOutline: '#0D0A0B', dust: '#FFB59A', glow: true},
  light: {sky: '#F3EADF', fog: '#F3EADF', road: '#D9C6B4', travelled: '#B5401F', completed: '#1D7A4F', next: '#B5401F', planned: '#22160F',
    locked: '#B9ACA0', edge: '#B5401F', label: '#22160F', labelOutline: '#F3EADF', dust: '#B5401F', glow: false},
};

let haloTexture: THREE.Texture | null = null;
/** Radial falloff texture for additive star halos (created once, shared). */
export function getHalo(): THREE.Texture {
  if (haloTexture) return haloTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,.55)');
  g.addColorStop(0.45, 'rgba(255,255,255,.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  haloTexture = new THREE.CanvasTexture(canvas);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  return haloTexture;
}

/** A star: bright emissive core (blooms in dark mode) plus a soft additive halo sprite. */
export function Star({color, radius, intensity, glow, pulse, reducedMotion, onClick, onHover}: {
  color: string; radius: number; intensity: number; glow: boolean; pulse: number; reducedMotion: boolean;
  onClick?: () => void; onHover?: (h: boolean) => void;
}) {
  const halo = useRef<THREE.Sprite>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({clock}) => {
    if (!halo.current) return;
    const s = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 1.6 + seed) * pulse;
    halo.current.scale.setScalar(radius * (glow ? 7 : 4.2) * s);
  });
  const core = new THREE.Color(color).multiplyScalar(glow ? intensity : 1);
  return <group>
    <mesh onClick={onClick ? e => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onHover ? e => { e.stopPropagation(); onHover(true); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={onHover ? () => { onHover(false); document.body.style.cursor = ''; } : undefined}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial color={core} toneMapped={!glow} />
    </mesh>
    <sprite ref={halo} scale={radius * 6}>
      <spriteMaterial map={getHalo()} color={color} transparent opacity={glow ? 0.55 : 0.35} depthWrite={false}
        blending={glow ? THREE.AdditiveBlending : THREE.NormalBlending} toneMapped={false} />
    </sprite>
  </group>;
}

/** Road ribbon: a wide soft band plus a thin bright core; `upTo` lights the travelled part. */
export function Ribbon({points, colors, upTo}: {points: THREE.Vector3[]; colors: SceneColors; upTo: number}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'centripetal'), [points]);
  const travelled = useMemo(() => {
    const n = Math.max(2, Math.round(upTo * 120));
    const pts = curve.getSpacedPoints(120).slice(0, n + 1);
    return pts.length > 1 ? new THREE.CatmullRomCurve3(pts) : null;
  }, [curve, upTo]);
  const lit = new THREE.Color(colors.travelled).multiplyScalar(colors.glow ? 2.2 : 1);
  return <group>
    <mesh><tubeGeometry args={[curve, 400, 0.22, 16, false]} /><meshBasicMaterial color={colors.road} transparent opacity={colors.glow ? 0.28 : 0.55} depthWrite={false} /></mesh>
    <mesh><tubeGeometry args={[curve, 400, 0.035, 8, false]} /><meshBasicMaterial color={colors.road} transparent opacity={0.9} /></mesh>
    {travelled && upTo > 0.001 && <mesh><tubeGeometry args={[travelled, 300, 0.05, 10, false]} /><meshBasicMaterial color={lit} toneMapped={!colors.glow} /></mesh>}
  </group>;
}

/** Points along a calm S-curve receding into the distance, with even spacing. */
export function roadPoints(n: number, spacing = 3.4): THREE.Vector3[] {
  return Array.from({length: n}, (_, i) => new THREE.Vector3(Math.sin(i * 0.55) * 3.2, Math.sin(i * 0.31) * 0.55, -i * spacing));
}

/** Text that keeps a constant on-screen size (about `px` pixels tall) at any camera distance,
 *  always drawn on top. Fixes labels that were huge up close and tiny far away. */
export function ScreenLabel({text, px = 13, color, outline, anchorX = 'left', maxEms = 18}: {
  text: string; px?: number; color: string; outline: string; anchorX?: 'left' | 'center'; maxEms?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  useFrame(({camera, size}) => {
    if (!ref.current) return;
    ref.current.getWorldPosition(world);
    const d = camera.position.distanceTo(world);
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    ref.current.scale.setScalar(px * (2 * d * Math.tan(fov / 2)) / size.height);
  });
  return <Billboard>
    <group ref={ref}>
      <Text fontSize={1} color={color} outlineWidth={0.09} outlineColor={outline} anchorX={anchorX} anchorY="middle" maxWidth={maxEms}
        textAlign={anchorX} lineHeight={1.2} renderOrder={10} material-depthTest={false} material-depthWrite={false}>{text}</Text>
    </group>
  </Billboard>;
}
