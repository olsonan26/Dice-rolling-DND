import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RigidBody, type RapierRigidBody, ConvexHullCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { getDiePreset, readDieResult } from "../lib/dice-geometry";
import { orientToFace } from "./orient";
import { playImpact } from "../lib/audio";
import { secureRandomRange } from "../lib/random";
import type { DieKind } from "../types";

interface Props {
  id: string;
  kind: DieKind;
  variant?: "tens" | "ones";
  spawn: THREE.Vector3;
  /** Index in the batch — used to stagger impulses */
  index: number;
  /** Called when this die has come to rest. Idempotent. */
  onSettled: (id: string, value: number) => void;
  paletteIndex: number;
}

const PALETTES = [
  // Royal velvet + gold
  { body: "#3a1d6e", trim: "#fbd34a", emissive: "#a86bff", text: "#fff6d6" },
  // Obsidian + crimson
  { body: "#16161b", trim: "#d62e3f", emissive: "#ff4d6a", text: "#ffe7ec" },
  // Emerald + brass
  { body: "#0e3a2b", trim: "#e2b85a", emissive: "#69e0a5", text: "#fff5d4" },
  // Sapphire + silver
  { body: "#0e2a55", trim: "#dadfee", emissive: "#74a8ff", text: "#f0f5ff" },
  // Ember bronze
  { body: "#3a1a08", trim: "#f5a23a", emissive: "#ff8a3a", text: "#ffeacb" },
];

const UP = new THREE.Vector3(0, 1, 0);
const REST_VEL = 0.18;
const REST_ANG = 0.35;
const REST_FRAMES = 18;

export function Die({ id, kind, variant, spawn, index, onSettled, paletteIndex }: Props) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const settledFramesRef = useRef(0);
  const reportedRef = useRef(false);
  const lastImpactSoundRef = useRef(0);

  const preset = useMemo(() => getDiePreset(kind, variant), [kind, variant]);
  const palette = PALETTES[paletteIndex % PALETTES.length];

  // Random initial rotation, impulse and torque (crypto-secure).
  const initial = useMemo(() => {
    const rot = new THREE.Euler(
      secureRandomRange(0, Math.PI * 2),
      secureRandomRange(0, Math.PI * 2),
      secureRandomRange(0, Math.PI * 2),
    );
    const q = new THREE.Quaternion().setFromEuler(rot);
    // Throw toward the tray center
    const toCenter = new THREE.Vector3(-spawn.x, 0, -spawn.z).normalize();
    const impulse = new THREE.Vector3(
      toCenter.x * secureRandomRange(2.2, 3.6),
      secureRandomRange(-0.5, 1.0),
      toCenter.z * secureRandomRange(2.2, 3.6),
    );
    const torque = new THREE.Vector3(
      secureRandomRange(-2.5, 2.5),
      secureRandomRange(-2.5, 2.5),
      secureRandomRange(-2.5, 2.5),
    );
    return { quat: [q.x, q.y, q.z, q.w] as [number, number, number, number], impulse, torque };
  }, [spawn.x, spawn.z]);

  // Kick on mount
  useEffect(() => {
    const t = setTimeout(() => {
      const body = bodyRef.current;
      if (!body) return;
      body.applyImpulse({ x: initial.impulse.x, y: initial.impulse.y, z: initial.impulse.z }, true);
      body.applyTorqueImpulse(
        { x: initial.torque.x, y: initial.torque.y, z: initial.torque.z },
        true,
      );
    }, 30 + index * 25);
    return () => clearTimeout(t);
  }, [initial, index]);

  // Settle detection
  useFrame(() => {
    if (reportedRef.current) return;
    const body = bodyRef.current;
    if (!body) return;
    const lv = body.linvel();
    const av = body.angvel();
    const speed = Math.hypot(lv.x, lv.y, lv.z);
    const aspeed = Math.hypot(av.x, av.y, av.z);
    if (speed < REST_VEL && aspeed < REST_ANG) {
      settledFramesRef.current += 1;
    } else {
      settledFramesRef.current = 0;
    }
    if (settledFramesRef.current >= REST_FRAMES) {
      const r = body.rotation();
      const q = new THREE.Quaternion(r.x, r.y, r.z, r.w);
      const value = readDieResult(kind, q, variant);
      reportedRef.current = true;
      onSettled(id, value);
    }
  });

  // Build face text elements
  const faceElems = useMemo(() => {
    return preset.faces.map(f => {
      const q = orientToFace(f.normal, f.up);
      const offset = f.normal.clone().multiplyScalar(0.005);
      const pos = f.center.clone().add(offset);
      // Use "·" under 6 / 9 to disambiguate (real dice convention)
      const showDot = (f.text === "6" || f.text === "9") && (kind === "d6" || kind === "d8");
      return (
        <group key={f.faceIndex} position={pos.toArray()} quaternion={[q.x, q.y, q.z, q.w]}>
          <Text
            fontSize={preset.scale * preset.textScale}
            color={palette.text}
            anchorX="center"
            anchorY="middle"
            font="/fonts/cormorant.ttf"
            outlineWidth={0.012}
            outlineColor="#000"
            outlineOpacity={0.45}
            material-toneMapped={false}
          >
            {f.text}
            {showDot ? "\u0323" : ""}
          </Text>
        </group>
      );
    });
  }, [preset, palette.text, kind]);

  // Hull vertices for collider (extract from BufferGeometry positions)
  const hullPoints = useMemo(() => {
    const pos = preset.geometry.attributes.position as THREE.BufferAttribute;
    const arr = new Float32Array(pos.array.length);
    arr.set(pos.array as ArrayLike<number>);
    return arr;
  }, [preset]);

  const onCollision = (e: { totalForceMagnitude?: number }) => {
    const now = performance.now();
    if (now - lastImpactSoundRef.current < 60) return;
    const force = Math.min(1, Math.max(0.1, (e.totalForceMagnitude ?? 1) / 8));
    lastImpactSoundRef.current = now;
    playImpact(force * 0.7);
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawn.x, spawn.y, spawn.z]}
      rotation={[
        new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(initial.quat[0], initial.quat[1], initial.quat[2], initial.quat[3]),
        ).x,
        new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(initial.quat[0], initial.quat[1], initial.quat[2], initial.quat[3]),
        ).y,
        new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(initial.quat[0], initial.quat[1], initial.quat[2], initial.quat[3]),
        ).z,
      ]}
      colliders={false}
      restitution={0.35}
      friction={0.5}
      linearDamping={0.18}
      angularDamping={0.22}
      mass={1.0}
      ccd
      onContactForce={onCollision}
    >
      <ConvexHullCollider args={[hullPoints]} />
      <mesh geometry={preset.geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={palette.body}
          metalness={0.55}
          roughness={0.28}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          reflectivity={0.6}
          emissive={palette.emissive}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Subtle gold rim — a slightly larger wireframe over the same geometry */}
      <mesh geometry={preset.geometry} scale={1.002}>
        <meshBasicMaterial color={palette.trim} wireframe transparent opacity={0.18} />
      </mesh>
      {faceElems}
    </RigidBody>
  );
}

const _UP = UP; // keep import alive
export { _UP as UP_AXIS };
