"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

function isTypingTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

export function GlobalShortcuts() {
  const router = useRouter();
  const [gMode, setGMode] = React.useState(false);

  React.useEffect(() => {
    if (!gMode) return;
    const t = window.setTimeout(() => setGMode(false), 800);
    return () => window.clearTimeout(t);
  }, [gMode]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      // Create
      if (!gMode && key === "c") {
        e.preventDefault();
        router.push("/tasks/new");
        return;
      }

      // Go-to prefix (Linear-ish)
      if (!gMode && key === "g") {
        e.preventDefault();
        setGMode(true);
        return;
      }

      if (gMode) {
        e.preventDefault();
        setGMode(false);

        if (key === "b") return router.push("/board");
        if (key === "t") return router.push("/tasks");
        if (key === "m") return router.push("/mail");
        if (key === "g") return router.push("/g-tasks");
        if (key === "r") return router.push("/runs");
        if (key === "s") return router.push("/sessions");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, gMode]);

  // This component is intentionally invisible.
  return null;
}
