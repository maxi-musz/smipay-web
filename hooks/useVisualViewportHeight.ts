"use client";

import { useState, useEffect } from "react";

/**
 * Returns the current visual viewport height in pixels.
 * Updates when the keyboard opens/closes on iOS (and other mobile browsers),
 * so the chat layout can use this height and avoid a persistent gap after the keyboard is dismissed.
 */
export function useVisualViewportHeight(): number {
  const [height, setHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.visualViewport?.height ?? window.innerHeight;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;
    const update = () => {
      const h = window.visualViewport?.height;
      if (h != null) setHeight(h);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
