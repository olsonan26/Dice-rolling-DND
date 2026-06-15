import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DiceScene } from "./three/DiceScene";
import { DicePicker } from "./components/DicePicker";
import { Controls } from "./components/Controls";
import { ResultBanner } from "./components/ResultBanner";
import { CritEffects } from "./components/CritEffects";
import { HistoryPanel } from "./components/HistoryPanel";
import { StatsPanel } from "./components/StatsPanel";
import { useDiceStore } from "./store/useDiceStore";
import { setMuted as audioSetMuted, primeAudio } from "./lib/audio";

function App() {
  const phase = useDiceStore(s => s.phase);
  const muted = useDiceStore(s => s.muted);
  const setMuted = useDiceStore(s => s.setMuted);
  const startThrow = useDiceStore(s => s.startThrow);
  const loadHistory = useDiceStore(s => s.loadHistory);
  const reset = useDiceStore(s => s.reset);
  const [tab, setTab] = useState<"history" | "stats">("history");

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  useEffect(() => {
    audioSetMuted(muted);
  }, [muted]);

  // Spacebar = roll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        if (phase === "idle" || phase === "revealed") {
          primeAudio();
          startThrow();
        }
      }
      if (e.code === "Escape" && phase === "revealed") {
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startThrow, reset]);

  return (
    <div className="relative grid h-full grid-rows-[auto_1fr] overflow-hidden text-ink-50">
      <Header muted={muted} setMuted={setMuted} />

      <main className="grid h-full min-h-0 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[340px_1fr_340px]">
        {/* Left sidebar */}
        <aside className="glass scrollbar-fancy order-2 flex max-h-[calc(100vh-7rem)] flex-col gap-5 overflow-y-auto rounded-2xl p-4 lg:order-1">
          <section>
            <SectionLabel>Choose Your Die</SectionLabel>
            <DicePicker />
          </section>
          <section>
            <SectionLabel>Roll</SectionLabel>
            <Controls />
          </section>
          <Provenance />
        </aside>

        {/* Center scene */}
        <section className="relative order-1 min-h-[60vh] overflow-hidden rounded-2xl border border-white/5 lg:order-2 lg:min-h-0">
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <DiceScene />
            </Suspense>
          </div>
          <ResultBanner />
          <CritEffects />
          <SceneOverlay />
        </section>

        {/* Right sidebar */}
        <aside className="glass order-3 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-white/4 p-1">
            <TabButton active={tab === "history"} onClick={() => setTab("history")}>
              History
            </TabButton>
            <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
              Stats
            </TabButton>
          </div>
          <div className="flex-1 min-h-0">
            {tab === "history" ? <HistoryPanel /> : <StatsPanel />}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Header({ muted, setMuted }: { muted: boolean; setMuted: (m: boolean) => void }) {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline gap-3"
      >
        <span className="font-display text-2xl tracking-tight text-ink-50">Dice Tray</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.32em] text-ink-200/45 sm:inline">
          A luxury 3D dice roller
        </span>
      </motion.div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMuted(!muted)}
          className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-200/70 hover:bg-white/8"
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇 Sound off" : "🔊 Sound on"}
        </button>
      </div>
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-ink-200/45">
      {children}
    </h2>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition",
        active ? "bg-velvet-400/40 text-ink-50" : "text-ink-200/55 hover:text-ink-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Provenance() {
  return (
    <p className="mt-auto font-mono text-[10px] leading-relaxed text-ink-200/35">
      Outcomes use <span className="text-gold-300/80">crypto.getRandomValues()</span> with rejection
      sampling — zero modulo bias. Physics simulated with Rapier. History stored locally in your
      browser (IndexedDB).
    </p>
  );
}

function SceneOverlay() {
  const phase = useDiceStore(s => s.phase);
  if (phase !== "idle") return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
    >
      <p className="font-display text-base italic text-ink-200/60">
        Choose a die. Tap <span className="text-gold-300">Roll</span>. Let fate decide.
      </p>
    </motion.div>
  );
}

export default App;
