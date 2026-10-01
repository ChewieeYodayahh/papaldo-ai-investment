import { useEffect, useRef, useState } from "react";

import { runDemo } from "@/app/features/tutorials/tutorial-store";

/**
 * Runs one of the app's own Tutorial Mode "Show me" demos (sample values a
 * component registers for itself) as soon as the component has mounted.
 * The component then shows that state exactly as a user would see it.
 */
export const WithDemo: React.FC<{ step: string; children: React.ReactNode }> = ({ step, children }) => {
  useEffect(() => {
    runDemo(step);
  }, [step]);
  return <>{children}</>;
};

/** Sets a React-controlled input the way typing does. */
export function typeInto(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Performs a real interaction on the component once it has drawn -- typing a
 * quantity, pressing a button -- so the video shows the app's own response.
 * `delayMs` lets the first state settle before acting.
 */
export const WithAction: React.FC<{ run: (root: HTMLElement) => void; delayMs?: number; children: React.ReactNode }> = ({
  run,
  delayMs = 60,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (ref.current) run(ref.current);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [run, delayMs]);
  return <div ref={ref}>{children}</div>;
};

/** Clears browser storage a component reads on mount, before it mounts, so every frame starts the same. */
export const FreshStorage: React.FC<{ keys: string[]; children: React.ReactNode }> = ({ keys, children }) => {
  useState(() => {
    for (const key of keys) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // No storage: nothing to clear.
      }
    }
    return null;
  });
  return <>{children}</>;
};
