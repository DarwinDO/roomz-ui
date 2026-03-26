import type { Variants } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function createPublicMotion(shouldReduceMotion: boolean) {
  const reveal = (distance = 28, delay = 0): Variants =>
    shouldReduceMotion
      ? {
          hidden: { opacity: 1, y: 0 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.01, delay: 0 },
          },
        }
      : {
          hidden: { opacity: 0, y: distance },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.68, delay, ease: EASE_OUT },
          },
        };

  const revealScale = (distance = 18, scale = 0.98, delay = 0): Variants =>
    shouldReduceMotion
      ? {
          hidden: { opacity: 1, y: 0, scale: 1 },
          show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.01, delay: 0 },
          },
        }
      : {
          hidden: { opacity: 0, y: distance, scale },
          show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.72, delay, ease: EASE_OUT },
          },
        };

  const stagger = (staggerChildren = 0.08, delayChildren = 0.05): Variants => ({
    hidden: {},
    show: {
      transition: shouldReduceMotion
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren, delayChildren },
    },
  });

  const hoverLift = shouldReduceMotion
    ? undefined
    : {
        y: -8,
        scale: 1.01,
        transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.86 },
      };

  const hoverSoft = shouldReduceMotion
    ? undefined
    : {
        y: -4,
        scale: 1.005,
        transition: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
      };

  const tap = shouldReduceMotion
    ? undefined
    : {
        scale: 0.985,
        transition: { duration: 0.16, ease: EASE_OUT },
      };

  return {
    viewport: { once: true, amount: 0.18 },
    reveal,
    revealScale,
    stagger,
    hoverLift,
    hoverSoft,
    tap,
  };
}
