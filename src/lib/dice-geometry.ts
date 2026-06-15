import * as THREE from "three";
import type { DieKind } from "../types";

/* ───────── Polyhedron primitive ───────── */

export interface PolyDef {
  /** Local-space vertex coordinates */
  vertices: [number, number, number][];
  /** Each face = ordered list of vertex indices (CCW seen from outside) */
  faces: number[][];
  /** Numeric label rendered on each face; matches `faces` index */
  labels: number[];
  /**
   * The label string shown on each face. Defaults to `String(labels[i])`,
   * but for d100 we override to "00".."90".
   */
  labelText?: string[];
}

export interface FaceData {
  faceIndex: number;
  normal: THREE.Vector3; // unit, local
  center: THREE.Vector3; // local
  up: THREE.Vector3; // tangent vector in face plane used as text "up"
  label: number;
  text: string;
}

export interface DiePreset {
  kind: DieKind;
  sides: number; // numeric sides (d100 uses 2 d10s, so caller handles it)
  scale: number; // visual scale of one die (radius-ish)
  textScale: number; // size of face text relative to scale
  geometry: THREE.BufferGeometry;
  faces: FaceData[];
}

/* Build a BufferGeometry from a polyhedron definition.
 * Each face is triangulated as a fan around its first vertex.
 * Vertex normals are *not* smoothed — we want flat faceted shading.
 */
export function buildGeometry(def: PolyDef): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const face of def.faces) {
    const v0 = new THREE.Vector3(...def.vertices[face[0]]);
    for (let i = 1; i < face.length - 1; i++) {
      const v1 = new THREE.Vector3(...def.vertices[face[i]]);
      const v2 = new THREE.Vector3(...def.vertices[face[i + 1]]);
      const e1 = new THREE.Vector3().subVectors(v1, v0);
      const e2 = new THREE.Vector3().subVectors(v2, v0);
      const n = new THREE.Vector3().crossVectors(e1, e2).normalize();
      positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geom;
}

/** Compute per-face metadata used for text placement & result detection. */
export function computeFaceData(def: PolyDef): FaceData[] {
  const out: FaceData[] = [];
  for (let i = 0; i < def.faces.length; i++) {
    const face = def.faces[i];
    const verts = face.map(idx => new THREE.Vector3(...def.vertices[idx]));
    // normal
    const e1 = new THREE.Vector3().subVectors(verts[1], verts[0]);
    const e2 = new THREE.Vector3().subVectors(verts[2], verts[0]);
    const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
    // center (centroid)
    const center = new THREE.Vector3();
    for (const v of verts) center.add(v);
    center.divideScalar(verts.length);
    // Choose an "up" direction in the face plane.
    // Strategy: project world-up-like axis onto the face. Fall back to first edge.
    const candidates = [
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
    ];
    let up = new THREE.Vector3();
    for (const c of candidates) {
      const proj = c.clone().sub(normal.clone().multiplyScalar(c.dot(normal)));
      if (proj.lengthSq() > 1e-4) {
        up = proj.normalize();
        break;
      }
    }
    out.push({
      faceIndex: i,
      normal,
      center,
      up,
      label: def.labels[i],
      text: def.labelText?.[i] ?? String(def.labels[i]),
    });
  }
  return out;
}

/* ───────── Polyhedron definitions ───────── */

/** Tetrahedron — D4 */
function makeD4(): PolyDef {
  const a = 1;
  // Standard regular tetrahedron vertices on a cube
  const vs: [number, number, number][] = [
    [a, a, a],
    [-a, -a, a],
    [-a, a, -a],
    [a, -a, -a],
  ];
  // 4 faces, CCW outward
  const fs = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2],
  ];
  return { vertices: vs, faces: fs, labels: [1, 2, 3, 4] };
}

/** Cube — D6 */
function makeD6(): PolyDef {
  const a = 1;
  const vs: [number, number, number][] = [
    [-a, -a, -a],
    [a, -a, -a],
    [a, a, -a],
    [-a, a, -a],
    [-a, -a, a],
    [a, -a, a],
    [a, a, a],
    [-a, a, a],
  ];
  // 6 faces, CCW from outside
  // We assign labels so opposite faces sum to 7.
  // Face order: -Z(1), +Z(6), -Y(2), +Y(5), -X(3), +X(4)
  const fs = [
    [0, 3, 2, 1], // -Z face → 1
    [4, 5, 6, 7], // +Z face → 6
    [0, 1, 5, 4], // -Y → 2
    [2, 3, 7, 6], // +Y → 5
    [0, 4, 7, 3], // -X → 3
    [1, 2, 6, 5], // +X → 4
  ];
  return { vertices: vs, faces: fs, labels: [1, 6, 2, 5, 3, 4] };
}

/** Octahedron — D8 */
function makeD8(): PolyDef {
  const a = 1;
  const vs: [number, number, number][] = [
    [a, 0, 0],
    [-a, 0, 0],
    [0, a, 0],
    [0, -a, 0],
    [0, 0, a],
    [0, 0, -a],
  ];
  // 8 triangular faces, CCW from outside, around the 8 octants
  const fs = [
    [0, 2, 4], // +X +Y +Z
    [2, 1, 4], // -X +Y +Z
    [1, 3, 4], // -X -Y +Z
    [3, 0, 4], // +X -Y +Z
    [2, 0, 5], // +X +Y -Z
    [1, 2, 5], // -X +Y -Z
    [3, 1, 5], // -X -Y -Z
    [0, 3, 5], // +X -Y -Z
  ];
  // Pair antipodal faces (faces 0..3 are top, 4..7 are bottom; index k pairs with k+4)
  // Opposite faces sum to 9. Top: 1,2,3,4 ; Bottom: 8,7,6,5 to make sums of 9.
  return { vertices: vs, faces: fs, labels: [1, 2, 3, 4, 8, 7, 6, 5] };
}

/** Pentagonal Trapezohedron — D10 */
function makeD10(): PolyDef {
  const h = 0.45; // ring height
  const H = 1.1; // apex height
  const r = 1.0; // ring radius
  const ringTop: [number, number, number][] = [];
  const ringBot: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const aTop = (Math.PI * 2 * i) / 5;
    const aBot = aTop + Math.PI / 5;
    ringTop.push([Math.cos(aTop) * r, h, Math.sin(aTop) * r]);
    ringBot.push([Math.cos(aBot) * r, -h, Math.sin(aBot) * r]);
  }
  const TOP = 0;
  const BOT = 1;
  const vs: [number, number, number][] = [
    [0, H, 0],
    [0, -H, 0],
    ...ringTop, // indices 2..6
    ...ringBot, // indices 7..11
  ];
  const rt = (i: number) => 2 + (i % 5);
  const rb = (i: number) => 7 + (i % 5);

  // 10 kite faces, alternating up-kites & down-kites
  const fs: number[][] = [];
  for (let k = 0; k < 5; k++) {
    // Up-kite: topApex, topRing[k], botRing[k], topRing[k+1] — CCW outward
    fs.push([TOP, rt(k), rb(k), rt(k + 1)]);
  }
  for (let k = 0; k < 5; k++) {
    // Down-kite: botApex, botRing[k+1], topRing[k+1], botRing[k] — CCW outward
    fs.push([BOT, rb(k + 1), rt(k + 1), rb(k)]);
  }
  // Labels — opposite faces sum to 11. Up-kite k is antipodal to down-kite (k+? mod 5).
  // We'll just hand-assign: up-kites get 1..5, down-kites get 10..6.
  const labels = [1, 3, 5, 7, 9, 10, 8, 6, 4, 2];
  return { vertices: vs, faces: fs, labels };
}

/** Pentagonal Trapezohedron — D100 (tens d10; labels are 00..90) */
function makeD100Tens(): PolyDef {
  const base = makeD10();
  const labelText = base.labels.map(v => {
    const tens = (v - 1) * 10;
    return tens === 0 ? "00" : String(tens);
  });
  // numeric label for value: 0..90 in steps of 10. Convert label index 1..10 → (i-1)*10
  const labels = base.labels.map(v => (v - 1) * 10);
  return { ...base, labels, labelText };
}

/** Pentagonal Trapezohedron — D100 (ones d10; labels 0..9) */
function makeD100Ones(): PolyDef {
  const base = makeD10();
  const labels = base.labels.map(v => v % 10); // 1..10 → 1..9,0
  const labelText = labels.map(v => String(v));
  return { ...base, labels, labelText };
}

/** Dodecahedron — D12 */
function makeD12(): PolyDef {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = 1;
  const b = 1 / phi;
  const c = phi;
  // 20 vertices
  const vs: [number, number, number][] = [
    // 8 cube vertices (±1, ±1, ±1)
    [a, a, a],
    [a, a, -a],
    [a, -a, a],
    [a, -a, -a],
    [-a, a, a],
    [-a, a, -a],
    [-a, -a, a],
    [-a, -a, -a],
    // 4 vertices (0, ±1/phi, ±phi)
    [0, b, c],
    [0, b, -c],
    [0, -b, c],
    [0, -b, -c],
    // 4 vertices (±1/phi, ±phi, 0)
    [b, c, 0],
    [b, -c, 0],
    [-b, c, 0],
    [-b, -c, 0],
    // 4 vertices (±phi, 0, ±1/phi)
    [c, 0, b],
    [c, 0, -b],
    [-c, 0, b],
    [-c, 0, -b],
  ];
  // 12 pentagonal faces — known face list for this vertex set
  const fs = [
    [8, 0, 12, 14, 4],
    [8, 10, 2, 16, 0],
    [8, 4, 18, 6, 10],
    [9, 1, 12, 14, 5],
    [9, 5, 19, 7, 11],
    [9, 11, 3, 17, 1],
    [10, 6, 15, 13, 2],
    [11, 7, 15, 13, 3],
    [12, 0, 16, 17, 1],
    [13, 15, 6, 18, 19],
    [14, 4, 18, 19, 5],
    [16, 2, 13, 3, 17],
  ];
  // Validate face winding lazily — flip any face whose normal points inward
  return { vertices: vs, faces: orientFaces(vs, fs), labels: assignAntipodal(vs, fs, 12) };
}

/** Icosahedron — D20 */
function makeD20(): PolyDef {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = 1;
  const b = phi;
  const vs: [number, number, number][] = [
    [0, a, b],
    [0, a, -b],
    [0, -a, b],
    [0, -a, -b],
    [a, b, 0],
    [a, -b, 0],
    [-a, b, 0],
    [-a, -b, 0],
    [b, 0, a],
    [b, 0, -a],
    [-b, 0, a],
    [-b, 0, -a],
  ];
  // 20 triangular faces
  const fs = [
    [0, 2, 8],
    [0, 8, 4],
    [0, 4, 6],
    [0, 6, 10],
    [0, 10, 2],
    [3, 1, 9],
    [3, 9, 5],
    [3, 5, 7],
    [3, 7, 11],
    [3, 11, 1],
    [2, 10, 7],
    [10, 6, 11],
    [6, 4, 1],
    [4, 8, 9],
    [8, 2, 5],
    [5, 9, 8],
    [9, 1, 4],
    [1, 11, 6],
    [11, 7, 10],
    [7, 5, 2],
  ];
  return { vertices: vs, faces: orientFaces(vs, fs), labels: assignAntipodal(vs, fs, 20) };
}

/** Ensure each face is wound CCW seen from outside (normal points away from origin). */
function orientFaces(vs: [number, number, number][], fs: number[][]): number[][] {
  return fs.map(f => {
    const v0 = new THREE.Vector3(...vs[f[0]]);
    const v1 = new THREE.Vector3(...vs[f[1]]);
    const v2 = new THREE.Vector3(...vs[f[2]]);
    const e1 = new THREE.Vector3().subVectors(v1, v0);
    const e2 = new THREE.Vector3().subVectors(v2, v0);
    const n = new THREE.Vector3().crossVectors(e1, e2);
    if (n.dot(v0) < 0) return [...f].reverse();
    return f;
  });
}

/**
 * Assign labels so that antipodal faces sum to N+1.
 * Used for D12 (12 faces, sum 13) and D20 (20 faces, sum 21).
 */
function assignAntipodal(vs: [number, number, number][], fs: number[][], N: number): number[] {
  const centers = fs.map(f => {
    const c = new THREE.Vector3();
    for (const i of f) c.add(new THREE.Vector3(...vs[i]));
    return c.divideScalar(f.length);
  });
  const labels = new Array(N).fill(0);
  // Greedy pairing: find antipodal pair for each unlabeled face.
  let next = 1;
  for (let i = 0; i < N; i++) {
    if (labels[i] !== 0) continue;
    // Find the face whose center is closest to -centers[i].
    let best = -1;
    let bestDist = Infinity;
    const target = centers[i].clone().multiplyScalar(-1);
    for (let j = 0; j < N; j++) {
      if (j === i || labels[j] !== 0) continue;
      const d = target.distanceToSquared(centers[j]);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
    if (best === -1) {
      labels[i] = next++;
      continue;
    }
    labels[i] = next;
    labels[best] = N + 1 - next;
    next++;
  }
  return labels;
}

/* ───────── Per-die-kind presets ───────── */

interface BasePreset {
  poly: PolyDef;
  scale: number;
  textScale: number; // multiplier of `scale`
}

const PRESETS: Record<DieKind, BasePreset> = {
  d4: { poly: makeD4(), scale: 0.65, textScale: 0.55 },
  d6: { poly: makeD6(), scale: 0.62, textScale: 0.7 },
  d8: { poly: makeD8(), scale: 0.75, textScale: 0.55 },
  d10: { poly: makeD10(), scale: 0.72, textScale: 0.5 },
  d12: { poly: makeD12(), scale: 0.72, textScale: 0.42 },
  d20: { poly: makeD20(), scale: 0.78, textScale: 0.42 },
  d100: { poly: makeD100Tens(), scale: 0.72, textScale: 0.4 }, // d100 caller manages two dice
};

const cache = new Map<string, DiePreset>();

export function getDiePreset(kind: DieKind, variant?: "tens" | "ones"): DiePreset {
  const key = `${kind}:${variant ?? "default"}`;
  if (cache.has(key)) return cache.get(key)!;

  let poly: PolyDef;
  let scale: number;
  let textScale: number;
  if (kind === "d100" && variant === "ones") {
    poly = makeD100Ones();
    scale = 0.72;
    textScale = 0.45;
  } else if (kind === "d100") {
    poly = makeD100Tens();
    scale = 0.72;
    textScale = 0.4;
  } else {
    const p = PRESETS[kind];
    poly = p.poly;
    scale = p.scale;
    textScale = p.textScale;
  }

  // Build scaled geometry
  const scaledVs: [number, number, number][] = poly.vertices.map(([x, y, z]) => [
    x * scale,
    y * scale,
    z * scale,
  ]);
  const scaledPoly: PolyDef = { ...poly, vertices: scaledVs };
  const geometry = buildGeometry(scaledPoly);
  const faces = computeFaceData(scaledPoly);

  // sides count (kind d100 uses 10 face values per die)
  const sides =
    kind === "d4" ? 4 : kind === "d6" ? 6 : kind === "d8" ? 8 : kind === "d12" ? 12 : kind === "d20" ? 20 : 10;

  const preset: DiePreset = {
    kind,
    sides,
    scale,
    textScale,
    geometry,
    faces,
  };
  cache.set(key, preset);
  return preset;
}

/* ───────── Result detection ───────── */

/**
 * Given a die kind and its world quaternion, find which face is most "up"
 * (or "down" for d4) and return its numeric label.
 */
export function readDieResult(
  kind: DieKind,
  quaternion: THREE.Quaternion,
  variant?: "tens" | "ones",
): number {
  const preset = getDiePreset(kind, variant);
  const target = kind === "d4" ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0);
  let bestDot = -Infinity;
  let bestLabel = preset.faces[0].label;
  for (const f of preset.faces) {
    const n = f.normal.clone().applyQuaternion(quaternion);
    const d = n.dot(target);
    if (d > bestDot) {
      bestDot = d;
      bestLabel = f.label;
    }
  }
  return bestLabel;
}
