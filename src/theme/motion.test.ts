import { effectiveMotion, parseMotion, persistMotion, readStoredMotion } from "./theme";
import { MOTION_KEY } from "./colors";

describe("motion preference", () => {
  const memory = new Map<string, string>();
  const store = {
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    clear() {
      memory.clear();
    },
    key() {
      return null;
    },
    get length() {
      return memory.size;
    },
  } satisfies Storage;

  const original = globalThis.localStorage;
  const originalDesc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  beforeEach(() => {
    memory.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: store,
    });
  });

  afterEach(() => {
    if (originalDesc) Object.defineProperty(globalThis, "localStorage", originalDesc);
    else if (original)
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    else Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("defaults to static", () => {
    expect(parseMotion(null)).toBe("static");
    expect(parseMotion("nope")).toBe("static");
    expect(readStoredMotion()).toBe("static");
  });

  it("persists the animated choice and reads it back", () => {
    persistMotion("animated");
    expect(store.getItem(MOTION_KEY)).toBe("animated");
    expect(readStoredMotion()).toBe("animated");
    persistMotion("static");
    expect(readStoredMotion()).toBe("static");
  });

  it("is forced static when reduced motion is requested", () => {
    expect(effectiveMotion("animated", true)).toBe("static");
    expect(effectiveMotion("animated", false)).toBe("animated");
    expect(effectiveMotion("static", true)).toBe("static");
  });
});
