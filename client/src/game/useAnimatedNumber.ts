import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tweens the displayed value from its previous value to `value` (ease-out),
// used for the score count-up/down animation. Bypassed entirely (jumps
// straight to the target) when the user prefers reduced motion.
export function useAnimatedNumber(value: number, durationMs = 450): number {
  const reduced = prefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    let rafId: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs, reduced]);

  return reduced ? value : display;
}
