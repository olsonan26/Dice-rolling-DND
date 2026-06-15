export type DieKind = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface RollResult {
  id: string; // ulid-like
  kind: DieKind;
  count: number;
  values: number[]; // individual face results
  total: number;
  modifier: number;
  isCritSuccess: boolean; // natural max on a d20-style roll
  isCritFail: boolean; // natural 1 on a d20
  timestamp: number;
}

export interface RolledDie {
  id: string;
  kind: DieKind;
  /** For d100 we use two d10s; this lets us label them tens/ones. */
  d100Role?: "tens" | "ones";
  /** Final face value (1..N). Set after settle. */
  value: number | null;
}
