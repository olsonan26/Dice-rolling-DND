import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useDiceStore } from "../store/useDiceStore";
import { playCritFail, playCritSuccess } from "../lib/audio";
import { secureRandomRange } from "../lib/random";

export function CritEffects() {
  const result = useDiceStore(s => s.lastResult);
  const phase = useDiceStore(s => s.phase);
  const showCrit = phase === "revealed" && result?.isCritSuccess;
  const showFail = phase === "revealed" && result?.isCritFail;

  useEffect(() => {
    if (showCrit) playCritSuccess();
    if (showFail) playCritFail();
  }, [showCrit, showFail]);

  return (
    <>
      <AnimatePresence>{showCrit && <ConfettiBurst key={result!.id} />}</AnimatePresence>
      <AnimatePresence>
        {showFail && (
          <motion.div
            key={`fail-${result!.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 60%, rgba(214,46,63,0.28) 0%, rgba(214,46,63,0) 70%)",
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCrit && (
          <motion.div
            key={`glow-${result!.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 60%, rgba(251,211,74,0.18) 0%, rgba(251,211,74,0) 70%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ConfettiBurst() {
  const particles = useMemo(() => {
    const count = 90;
    return Array.from({ length: count }, () => ({
      x: secureRandomRange(-0.5, 0.5),
      y: secureRandomRange(-0.15, 0.05),
      dx: secureRandomRange(-220, 220),
      dy: secureRandomRange(-360, -80),
      r: secureRandomRange(0, 720),
      delay: secureRandomRange(0, 0.18),
      hue: ["#fbd34a", "#fff4d1", "#a86bff", "#9c5cff", "#f5b022"][Math.floor(secureRandomRange(0, 5))],
      size: secureRandomRange(5, 11),
      duration: secureRandomRange(1.4, 2.4),
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{
            x: `calc(50% + ${p.x * 240}px)`,
            y: `calc(50% + ${p.y * 200}px)`,
            opacity: 1,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            x: `calc(50% + ${p.x * 240 + p.dx}px)`,
            y: `calc(50% + ${p.y * 200 + p.dy + 400}px)`,
            rotate: p.r,
            opacity: 0,
            scale: 1.05,
          }}
          transition={{ delay: p.delay, duration: p.duration, ease: [0.2, 0.7, 0.4, 1] }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 1.4,
            background: p.hue,
            borderRadius: 2,
            boxShadow: `0 0 8px ${p.hue}88`,
          }}
        />
      ))}
    </div>
  );
}
