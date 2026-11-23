import { afterEach } from "vitest";
import { EINSTELLUNGEN_KEY } from "@/lib/einstellungen";

afterEach(async () => {
  if (typeof window === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
  window.location.hash = "";
  window.localStorage.removeItem(EINSTELLUNGEN_KEY);
});

if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (typeof window.ResizeObserver !== "function") {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
}
