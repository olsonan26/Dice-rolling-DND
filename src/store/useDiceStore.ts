import { create } from "zustand";
import type { DieKind, RollResult, RolledDie } from "../types";
import { getRolls, saveRoll, clearRolls, setPref, getPref } from "../lib/history-db";
import { secureRandomId } from "../lib/random";

export type RollPhase = "idle" | "throwing" | "settling" | "revealed";

export interface DiceState {
  // Selection
  selectedDie: DieKind;
  count: number; // 1..12
  modifier: number; // -10..+10

  // Roll
  phase: RollPhase;
  dice: RolledDie[]; // active dice in scene
  lastResult: RollResult | null;

  // History
  history: RollResult[];
  historyLoaded: boolean;

  // Preferences
  muted: boolean;
  showHelp: boolean;

  // Actions
  setDie: (k: DieKind) => void;
  setCount: (n: number) => void;
  setModifier: (m: number) => void;
  startThrow: () => void;
  markSettling: () => void;
  finalizeRoll: (faceValues: number[]) => Promise<void>;
  reset: () => void;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  setMuted: (m: boolean) => void;
  setShowHelp: (b: boolean) => void;
}

export const useDiceStore = create<DiceState>((set, get) => ({
  selectedDie: "d20",
  count: 1,
  modifier: 0,
  phase: "idle",
  dice: [],
  lastResult: null,
  history: [],
  historyLoaded: false,
  muted: false,
  showHelp: false,

  setDie(k) {
    set({ selectedDie: k });
  },
  setCount(n) {
    set({ count: Math.max(1, Math.min(12, Math.round(n))) });
  },
  setModifier(m) {
    set({ modifier: Math.max(-20, Math.min(20, Math.round(m))) });
  },

  startThrow() {
    const { selectedDie, count } = get();
    const dice: RolledDie[] = [];
    if (selectedDie === "d100") {
      for (let i = 0; i < count; i++) {
        dice.push({ id: secureRandomId(8), kind: "d100", d100Role: "tens", value: null });
        dice.push({ id: secureRandomId(8), kind: "d100", d100Role: "ones", value: null });
      }
    } else {
      for (let i = 0; i < count; i++) {
        dice.push({ id: secureRandomId(8), kind: selectedDie, value: null });
      }
    }
    set({ dice, phase: "throwing", lastResult: null });
  },

  markSettling() {
    if (get().phase === "throwing") set({ phase: "settling" });
  },

  async finalizeRoll(faceValues) {
    const { dice, selectedDie, count, modifier } = get();
    if (dice.length === 0 || faceValues.length !== dice.length) return;

    let values: number[];
    let total: number;

    if (selectedDie === "d100") {
      // Pair each (tens, ones) — order in `dice` is t,o,t,o,...
      values = [];
      for (let i = 0; i < count; i++) {
        const tens = faceValues[i * 2];
        const ones = faceValues[i * 2 + 1];
        let v = tens + ones;
        if (v === 0) v = 100; // 00+0 = 100 per d100 convention
        values.push(v);
      }
      total = values.reduce((s, v) => s + v, 0) + modifier;
    } else {
      values = [...faceValues];
      total = values.reduce((s, v) => s + v, 0) + modifier;
    }

    const sides = sidesFor(selectedDie);
    const naturalMax = selectedDie === "d100" ? 100 : sides;
    const isCritSuccess = count === 1 && values[0] === naturalMax;
    const isCritFail = count === 1 && selectedDie === "d20" && values[0] === 1;

    const result: RollResult = {
      id: secureRandomId(12),
      kind: selectedDie,
      count,
      values,
      total,
      modifier,
      isCritSuccess,
      isCritFail,
      timestamp: Date.now(),
    };
    set({ phase: "revealed", lastResult: result, history: [result, ...get().history].slice(0, 500) });
    try {
      await saveRoll(result);
    } catch {
      /* ignore — IndexedDB may be unavailable in private mode */
    }
  },

  reset() {
    set({ phase: "idle", dice: [] });
  },

  async clearHistory() {
    await clearRolls();
    set({ history: [] });
  },

  async loadHistory() {
    if (get().historyLoaded) return;
    try {
      const rows = await getRolls(500);
      const muted = (await getPref<boolean>("muted")) ?? false;
      set({ history: rows, historyLoaded: true, muted });
    } catch {
      set({ historyLoaded: true });
    }
  },

  setMuted(m) {
    set({ muted: m });
    setPref("muted", m).catch(() => {});
  },
  setShowHelp(b) {
    set({ showHelp: b });
  },
}));

function sidesFor(k: DieKind): number {
  return k === "d4" ? 4 : k === "d6" ? 6 : k === "d8" ? 8 : k === "d10" ? 10 : k === "d12" ? 12 : k === "d20" ? 20 : 100;
}
