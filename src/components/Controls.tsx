import { motion } from "framer-motion";
import { useDiceStore } from "../store/useDiceStore";
import { playClick, primeAudio } from "../lib/audio";

export function Controls() {
  const count = useDiceStore(s => s.count);
  const setCount = useDiceStore(s => s.setCount);
  const modifier = useDiceStore(s => s.modifier);
  const setModifier = useDiceStore(s => s.setModifier);
  const selectedDie = useDiceStore(s => s.selectedDie);
  const phase = useDiceStore(s => s.phase);
  const startThrow = useDiceStore(s => s.startThrow);
  const dieIsD100 = selectedDie === "d100";
  const rolling = phase === "throwing" || phase === "settling";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Quantity"
          value={count}
          onChange={setCount}
          min={1}
          max={dieIsD100 ? 4 : 12}
          disabled={rolling}
          unit={count === 1 ? "die" : "dice"}
        />
        <Stepper
          label="Modifier"
          value={modifier}
          onChange={setModifier}
          min={-20}
          max={20}
          disabled={rolling}
          format={v => (v >= 0 ? `+${v}` : String(v))}
        />
      </div>

      <motion.button
        whileTap={!rolling ? { scale: 0.985 } : undefined}
        whileHover={!rolling ? { scale: 1.01 } : undefined}
        disabled={rolling}
        onClick={() => {
          primeAudio();
          playClick();
          startThrow();
        }}
        className={[
          "group relative w-full overflow-hidden rounded-2xl border border-gold-300/30 px-6 py-4",
          "bg-gradient-to-br from-velvet-400 via-velvet-300 to-velvet-500 text-ink-50",
          "shadow-[0_18px_50px_-12px_rgba(120,40,255,0.55),inset_0_1px_0_rgba(255,255,255,0.18)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition",
        ].join(" ")}
      >
        <span className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-20%,rgba(251,211,74,0.45),transparent_55%)] opacity-90" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-300/80 to-transparent" />
        <span className="relative flex items-center justify-center gap-2">
          <span className="font-display text-2xl tracking-wide">
            {rolling ? "Rolling…" : "Roll"}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-100/80">
            {count}× {selectedDie}
            {modifier !== 0 ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}
          </span>
        </span>
      </motion.button>
      <p className="text-center text-[11px] uppercase tracking-[0.28em] text-ink-200/40">
        Press <kbd className="rounded border border-white/15 bg-white/5 px-1 font-mono text-[10px]">Space</kbd> to roll
      </p>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
  unit,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  unit?: string;
  format?: (v: number) => string;
}) {
  const display = format ? format(value) : String(value);
  return (
    <div className="glass rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-ink-200/55">{label}</div>
        {unit && <div className="font-mono text-[10px] text-ink-200/40">{unit}</div>}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <button
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= min}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/4 text-lg leading-none text-ink-100 hover:bg-white/8 disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="font-display text-3xl tabular-nums text-ink-50">{display}</div>
        <button
          onClick={() => onChange(value + 1)}
          disabled={disabled || value >= max}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/4 text-lg leading-none text-ink-100 hover:bg-white/8 disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
