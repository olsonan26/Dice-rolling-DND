import * as THREE from "three";

/**
 * Build a quaternion that orients an object so:
 *  - Its local +Z axis aligns with `normal` (text faces outward)
 *  - Its local +Y axis aligns with `up` (within the face plane)
 */
export function orientToFace(normal: THREE.Vector3, up: THREE.Vector3): THREE.Quaternion {
  const z = normal.clone().normalize();
  const yPref = up.clone().normalize();
  const x = new THREE.Vector3().crossVectors(yPref, z).normalize();
  // Re-orthogonalize y
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

export function quaternionToEuler(q: THREE.Quaternion): [number, number, number] {
  const e = new THREE.Euler().setFromQuaternion(q, "XYZ");
  return [e.x, e.y, e.z];
}
