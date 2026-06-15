import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useDiceStore } from "../store/useDiceStore";
import { Die } from "./Die";
import { Tray, TRAY } from "./Tray";
import { secureRandomRange } from "../lib/random";
import { playReveal, playWhoosh } from "../lib/audio";

/** Sample a position above the tray for spawning a die. */
function spawnPoint(i: number, n: number): THREE.Vector3 {
  // Spread dice along a line on the +z side (back), pour them toward the front.
  const span = Math.min(TRAY.width - 1.5, Math.max(2, n * 1.0));
  const x = n === 1 ? 0 : (i / (n - 1) - 0.5) * span + secureRandomRange(-0.15, 0.15);
  const y = 3.2 + secureRandomRange(0, 0.8);
  const z = TRAY.depth / 2 - 0.5 - secureRandomRange(0, 0.4);
  return new THREE.Vector3(x, y, z);
}

function DiceFieldInner() {
  const dice = useDiceStore(s => s.dice);
  const phase = useDiceStore(s => s.phase);
  const markSettling = useDiceStore(s => s.markSettling);
  const finalizeRoll = useDiceStore(s => s.finalizeRoll);
  const reveal = useRef(false);
  useEffect(() => {
    console.log("[DiceFieldInner] mounted");
  }, []);

  // Map of dieId → value (or null while in-flight)
  const settledMapRef = useRef<Map<string, number>>(new Map());

  // Reset when a new roll starts
  useEffect(() => {
    if (phase === "throwing") {
      settledMapRef.current = new Map(dice.map(d => [d.id, NaN]));
      reveal.current = false;
      playWhoosh();
    }
    if (phase === "idle") {
      settledMapRef.current = new Map();
    }
  }, [phase, dice]);

  const handleSettled = (id: string, value: number) => {
    settledMapRef.current.set(id, value);
    markSettling();
    // If all settled, finalize.
    const allSettled =
      dice.length > 0 && dice.every(d => Number.isFinite(settledMapRef.current.get(d.id)));
    if (allSettled && !reveal.current) {
      reveal.current = true;
      const values = dice.map(d => settledMapRef.current.get(d.id) as number);
      playReveal();
      finalizeRoll(values);
    }
  };

  const spawns = useMemo(() => dice.map((_, i) => spawnPoint(i, dice.length)), [dice]);

  return (
    <>
      <Tray />
      {dice.map((d, i) => (
        <Die
          key={d.id}
          id={d.id}
          kind={d.kind}
          variant={d.d100Role}
          spawn={spawns[i]}
          index={i}
          onSettled={handleSettled}
          paletteIndex={d.d100Role === "ones" ? 1 : 0}
        />
      ))}
    </>
  );
}

export function DiceScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 11, 9.2], fov: 38, near: 0.1, far: 100 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      }}
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["#0a0612"]} />
      <fog attach="fog" args={["#0a0612", 18, 42]} />

      {/* Cinematic lighting (manual — no external HDR dependency) */}
      <hemisphereLight intensity={0.55} color="#c9b8ff" groundColor="#1c0a30" />
      <ambientLight intensity={0.18} color="#b59aff" />
      <directionalLight
        position={[6, 12, 6]}
        intensity={2.4}
        color="#fff1d1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-8, 8, -4]} intensity={0.5} color="#a86bff" />
      <pointLight position={[-4, 5, 5]} intensity={0.65} color="#c89cff" />
      <pointLight position={[5, 4, -5]} intensity={0.55} color="#f5b022" />
      <spotLight
        position={[0, 10, 4]}
        angle={0.6}
        penumbra={0.7}
        intensity={1.4}
        color="#fff8e0"
        target-position={[0, 0, 0]}
      />

      <ContactShadows
        position={[0, -0.001, 0]}
        opacity={0.45}
        scale={20}
        blur={2.6}
        far={8}
        resolution={1024}
      />

      <Physics gravity={[0, -22, 0]} timeStep="vary">
        <DiceFieldInner />
      </Physics>
    </Canvas>
  );
}
