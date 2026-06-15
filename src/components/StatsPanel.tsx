import { useMemo } from "react";
import { useDiceStore } from "../store/useDiceStore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function StatsPanel() {
  const history = useDiceStore(s => s.history);
  const selectedDie = useDiceStore(s => s.selectedDie);

  const filtered = useMemo(
    () => history.filter(r => r.kind === selectedDie),
    [history, selectedDie],
  );

  const dist = useMemo(() => {
    const sides =
      selectedDie === "d4"
        ? 4
        : selectedDie === "d6"
          ? 6
          : selectedDie === "d8"
            ? 8
            : selectedDie === "d10"
              ? 10
              : selectedDie === "d12"
                ? 12
                : selectedDie === "d20"
                  ? 20
                  : 100;
    const map = new Map<number, number>();
    for (let i = 1; i <= sides; i++) map.set(i, 0);
    for (const r of filtered) {
      for (const v of r.values) {
        if (selectedDie === "d100") {
          // Bucket d100 in tens for a readable chart
          const bucket = Math.min(10, Math.floor((v - 1) / 10) + 1);
          map.set(bucket * 10, (map.get(bucket * 10) ?? 0) + 1);
        } else {
          map.set(v, (map.get(v) ?? 0) + 1);
        }
      }
    }
    if (selectedDie === "d100") {
      return Array.from({ length: 10 }, (_, i) => {
        const v = (i + 1) * 10;
        return { face: `${v - 9}-${v}`, count: map.get(v) ?? 0 };
      });
    }
    return Array.from(map.entries()).map(([k, v]) => ({ face: String(k), count: v }));
  }, [filtered, selectedDie]);

  const stats = useMemo(() => {
    const all = filtered.flatMap(r => r.values);
    if (all.length === 0) return null;
    const sum = all.reduce((s, v) => s + v, 0);
    const avg = sum / all.length;
    const max = Math.max(...all);
    const min = Math.min(...all);
    const crits = filtered.filter(r => r.isCritSuccess).length;
    const fumbles = filtered.filter(r => r.isCritFail).length;
    return { rolls: all.length, avg, max, min, crits, fumbles };
  }, [filtered]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg text-ink-50">
          Statistics <span className="text-ink-200/40">· {selectedDie}</span>
        </h3>
      </div>

      {!stats ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/8 p-6 text-center text-sm text-ink-200/45">
          Roll a few {selectedDie}s to see your distribution.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Rolls" value={String(stats.rolls)} />
            <Stat label="Avg" value={stats.avg.toFixed(1)} />
            <Stat label="Range" value={`${stats.min}–${stats.max}`} />
          </div>
          {(stats.crits > 0 || stats.fumbles > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {stats.crits > 0 && <Stat label="Crits" value={String(stats.crits)} accent="gold" />}
              {stats.fumbles > 0 && <Stat label="Fumbles" value={String(stats.fumbles)} accent="crimson" />}
            </div>
          )}
          <div className="flex-1 rounded-xl border border-white/5 bg-black/15 p-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={140}>
              <BarChart data={dist} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="face"
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fontSize: 10, fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "#150828",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#fbd34a" }}
                  itemStyle={{ color: "#f5f0e6" }}
                />
                <Bar dataKey="count" fill="#9c5cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "gold" | "crimson" }) {
  const color =
    accent === "gold" ? "text-gold-300" : accent === "crimson" ? "text-crimson-500" : "text-ink-50";
  return (
    <div className="glass rounded-lg px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-200/50">{label}</div>
      <div className={`font-display text-2xl tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
