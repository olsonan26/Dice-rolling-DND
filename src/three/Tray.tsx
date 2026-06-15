import { RigidBody, CuboidCollider } from "@react-three/rapier";

/**
 * A luxe felted dice tray.
 * Visual: a low, rounded box with felt floor and a gold-rimmed border.
 * Physics: 1 floor + 4 walls + a low ceiling so dice can't escape.
 */
export const TRAY = {
  width: 9.2,
  depth: 6.4,
  wall: 0.42,
  wallHeight: 1.2,
  floorThickness: 0.4,
} as const;

export function Tray() {
  const { width, depth, wall, wallHeight, floorThickness } = TRAY;
  const hw = width / 2;
  const hd = depth / 2;
  const wallY = wallHeight / 2;

  return (
    <group>
      {/* Felt floor (visual + collider) */}
      <RigidBody type="fixed" friction={0.7} restitution={0.18}>
        <CuboidCollider args={[hw, floorThickness / 2, hd]} position={[0, -floorThickness / 2, 0]} />
        <mesh receiveShadow position={[0, -floorThickness / 2, 0]}>
          <boxGeometry args={[width, floorThickness, depth]} />
          <meshPhysicalMaterial
            color="#3a0f4a"
            roughness={0.95}
            metalness={0.0}
            sheen={1}
            sheenColor="#7a2dff"
            sheenRoughness={0.65}
            clearcoat={0.1}
            clearcoatRoughness={0.8}
          />
        </mesh>
        {/* Inlay gold trim */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(hw, hd) - 0.6, Math.min(hw, hd) - 0.55, 96]} />
          <meshStandardMaterial color="#f5b022" metalness={0.95} roughness={0.18} />
        </mesh>
      </RigidBody>

      {/* Walls */}
      {([
        // [x, y, z, halfX, halfY, halfZ]
        [0, wallY, hd + wall / 2, hw + wall, wallY, wall / 2], // back (+z)
        [0, wallY, -hd - wall / 2, hw + wall, wallY, wall / 2], // front (-z)
        [hw + wall / 2, wallY, 0, wall / 2, wallY, hd + wall], // right (+x)
        [-hw - wall / 2, wallY, 0, wall / 2, wallY, hd + wall], // left (-x)
      ] as const).map((p, i) => (
        <RigidBody key={i} type="fixed" friction={0.5} restitution={0.35}>
          <CuboidCollider args={[p[3], p[4], p[5]]} position={[p[0], p[1], p[2]]} />
          <mesh position={[p[0], p[1], p[2]]} castShadow receiveShadow>
            <boxGeometry args={[p[3] * 2, p[4] * 2, p[5] * 2]} />
            <meshPhysicalMaterial
              color="#2c1147"
              roughness={0.32}
              metalness={0.55}
              clearcoat={0.6}
              clearcoatRoughness={0.18}
              reflectivity={0.55}
              emissive="#150828"
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* Gold edge cap on the inside top */}
          <mesh position={[p[0], p[1] * 2 + 0.005, p[2]]}>
            <boxGeometry args={[p[3] * 2, 0.02, p[5] * 2]} />
            <meshStandardMaterial color="#f5b022" metalness={0.95} roughness={0.2} />
          </mesh>
        </RigidBody>
      ))}

      {/* Invisible ceiling so the dice can't escape upward on big throws */}
      <RigidBody type="fixed">
        <CuboidCollider args={[hw + wall, 0.05, hd + wall]} position={[0, 5.5, 0]} />
      </RigidBody>
    </group>
  );
}
