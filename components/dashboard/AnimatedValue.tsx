"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AnimatedValueProps {
  value: string;
  className?: string;
}

/**
 * Renders a value that smoothly transitions when it changes:
 * old value slides down + fades out, new value slides in from above.
 * On first mount it renders instantly (no animation).
 */
export function AnimatedValue({ value, className }: AnimatedValueProps) {
  const isFirstRender = useRef(true);
  const [displayKey, setDisplayKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (value !== prevValue.current) {
      prevValue.current = value;
      setDisplayKey((k) => k + 1);
    }
  }, [value]);

  return (
    <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${value}-${displayKey}`}
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
