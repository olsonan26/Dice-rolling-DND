import { AnimatePresence, motion } from "framer-motion";
import { useDiceStore } from "../store/useDiceStore";

function ago(ts: number) {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryPanel() {
  const history = useDiceStore(s => s.history);
  const clear = useDiceStore(s => s.clearHistory);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-lg text-ink-50">History</h3>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all roll history?")) clear();
            }}
            className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-200/45 hover:text-ink-100"
          >
            Clear
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/8 p-6 text-center text-sm text-ink-200/45">
          Your rolls will appear here.
        </div>
      ) : (
        <ul className="scrollbar-fancy flex-1 space-y-1.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {history.slice(0, 100).map(r => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={[
                  "flex items-center gap-3 rounded-lg border border-white/5 bg-white/3 px-3 py-2",
                  r.isCritSuccess ? "ring-1 ring-gold-300/45" : "",
                  r.isCritFail ? "ring-1 ring-crimson-500/45" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-200/50">
                    {r.count}× {r.kind}
                    {r.modifier !== 0
                      ? ` ${r.modifier > 0 ? "+" : ""}${r.modifier}`
                      : ""}
                  </div>
                  <div className="truncate font-mono text-[11px] text-ink-100/70">
                    {r.values.join(" · ")}
                  </div>
                </div>
                <div
                  className={[
                    "font-display text-2xl leading-none tabular-nums",
                    r.isCritSuccess ? "text-gold-300" : r.isCritFail ? "text-crimson-500" : "text-ink-50",
                  ].join(" ")}
                >
                  {r.total}
                </div>
                <div className="hidden w-14 shrink-0 text-right font-mono text-[10px] uppercase tracking-wide text-ink-200/40 sm:block">
                  {ago(r.timestamp)}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
