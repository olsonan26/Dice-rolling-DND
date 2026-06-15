import { motion } from "framer-motion";
import { useDiceStore } from "../store/useDiceStore";
import type { DieKind } from "../types";
import { playClick } from "../lib/audio";

const DICE: { kind: DieKind; label: string; sides: number }[] = [
  { kind: "d4", label: "d4", sides: 4 },
  { kind: "d6", label: "d6", sides: 6 },
  { kind: "d8", label: "d8", sides: 8 },
  { kind: "d10", label: "d10", sides: 10 },
  { kind: "d12", label: "d12", sides: 12 },
  { kind: "d20", label: "d20", sides: 20 },
  { kind: "d100", label: "d100", sides: 100 },
];

function Glyph({ kind }: { kind: DieKind }) {
  // Tiny SVG silhouette of each polyhedron
  const stroke = "currentColor";
  const w = 28;
  switch (kind) {
    case "d4":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 4 L4 28 L28 28 Z" stroke={stroke} strokeLinejoin="round" strokeWidth="1.6" />
          <path d="M16 4 L16 28 M4 28 L28 28 M16 16 L4 28 M16 16 L28 28" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
    case "d6":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L28 9 L28 23 L16 29 L4 23 L4 9 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M4 9 L16 15 L28 9 M16 15 L16 29" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
    case "d8":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 2 L29 16 L16 30 L3 16 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M3 16 L16 12 L29 16 M16 12 L16 2 M16 12 L16 30" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
    case "d10":
    case "d100":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 2 L28 11 L23 28 L9 28 L4 11 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M16 30 L4 11 L16 17 L28 11 M16 17 L16 30 M9 28 L16 17 L23 28" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
    case "d12":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L26 8 L29 18 L22 28 L10 28 L3 18 L6 8 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M16 3 L16 14 M3 18 L12 16 L10 28 M29 18 L20 16 L22 28 M12 16 L16 14 L20 16" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
    case "d20":
      return (
        <svg width={w} height={w} viewBox="0 0 32 32" fill="none">
          <path d="M16 2 L29 11 L24 28 L8 28 L3 11 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M16 2 L16 18 M3 11 L16 18 L29 11 M8 28 L16 18 L24 28" stroke={stroke} strokeWidth="0.9" opacity="0.55" />
        </svg>
      );
  }
}

export function DicePicker() {
  const selected = useDiceStore(s => s.selectedDie);
  const setDie = useDiceStore(s => s.setDie);
  const phase = useDiceStore(s => s.phase);
  const disabled = phase === "throwing" || phase === "settling";

  return (
    <div className="grid grid-cols-4 gap-2">
      {DICE.map(d => {
        const active = d.kind === selected;
        return (
          <motion.button
            key={d.kind}
            whileTap={{ scale: 0.97 }}
            whileHover={!disabled ? { y: -2 } : undefined}
            disabled={disabled}
            onClick={() => {
              setDie(d.kind);
              playClick();
            }}
            className={[
              "group relative flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition",
              "border",
              active
                ? "border-gold-300/70 bg-gradient-to-br from-velvet-300/25 to-gold-300/10 text-gold-100 shadow-[0_0_30px_-12px_rgba(251,211,74,0.6)]"
                : "border-white/8 bg-white/3 text-ink-100 hover:bg-white/5 hover:border-white/20",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <span className={active ? "text-gold-300" : "text-ink-200/80"}>
              <Glyph kind={d.kind} />
            </span>
            <span className="font-display text-lg leading-none tracking-tight">{d.label}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-200/45">
              1–{d.sides}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
