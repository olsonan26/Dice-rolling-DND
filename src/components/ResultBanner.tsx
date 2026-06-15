import { AnimatePresence, motion } from "framer-motion";
import { useDiceStore } from "../store/useDiceStore";

export function ResultBanner() {
  const result = useDiceStore(s => s.lastResult);
  const phase = useDiceStore(s => s.phase);
  const show = phase === "revealed" && result;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={result!.id}
          initial={{ opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2"
        >
          <div
            className={[
              "glass-strong relative flex items-center gap-5 rounded-2xl px-6 py-3",
              result!.isCritSuccess
                ? "ring-1 ring-gold-300/60 shadow-[0_0_80px_-10px_rgba(251,211,74,0.55)]"
                : result!.isCritFail
                  ? "ring-1 ring-crimson-500/60 shadow-[0_0_80px_-10px_rgba(214,46,63,0.45)]"
                  : "",
            ].join(" ")}
          >
            <div className="text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-200/55">
                {result!.count}× {result!.kind}
                {result!.modifier !== 0
                  ? ` ${result!.modifier > 0 ? "+" : ""}${result!.modifier}`
                  : ""}
              </div>
              <div className="font-display text-base text-ink-100/85">
                {result!.values.length > 1
                  ? result!.values.join(" + ") +
                    (result!.modifier !== 0
                      ? ` ${result!.modifier > 0 ? "+" : "-"} ${Math.abs(result!.modifier)}`
                      : "")
                  : result!.modifier !== 0
                    ? `${result!.values[0]} ${result!.modifier > 0 ? "+" : "-"} ${Math.abs(result!.modifier)}`
                    : "Total"}
              </div>
            </div>
            <div
              className={[
                "font-display text-6xl leading-none tabular-nums",
                result!.isCritSuccess
                  ? "text-gold-300"
                  : result!.isCritFail
                    ? "text-crimson-500"
                    : "text-ink-50",
              ].join(" ")}
            >
              {result!.total}
            </div>
            {result!.isCritSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -right-2 -top-2 rounded-full bg-gold-300/95 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-velvet-900"
              >
                Crit!
              </motion.span>
            )}
            {result!.isCritFail && (
              <span className="absolute -right-2 -top-2 rounded-full bg-crimson-500/95 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-50">
                Fumble
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
