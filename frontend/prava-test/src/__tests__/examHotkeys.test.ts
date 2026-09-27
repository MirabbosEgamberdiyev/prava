import { describe, expect, it } from "vitest";
import { resolveExamHotkey } from "../hooks/useExamHotkeys";

describe("resolveExamHotkey", () => {
  it("maps digits 1-5 to option indexes", () => {
    expect(resolveExamHotkey({ key: "1" })).toEqual({ type: "select", index: 0 });
    expect(resolveExamHotkey({ key: "5" })).toEqual({ type: "select", index: 4 });
  });

  it("maps A-D (by physical code, any layout) to options 1-4", () => {
    expect(resolveExamHotkey({ key: "a", code: "KeyA" })).toEqual({ type: "select", index: 0 });
    expect(resolveExamHotkey({ key: "в", code: "KeyD" })).toEqual({ type: "select", index: 3 });
    expect(resolveExamHotkey({ key: "e", code: "KeyE" })).toBeNull();
  });

  it("ignores options beyond the current question's option count", () => {
    expect(resolveExamHotkey({ key: "4" }, { optionCount: 3 })).toBeNull();
    expect(resolveExamHotkey({ key: "3" }, { optionCount: 3 })).toEqual({ type: "select", index: 2 });
  });

  it("never hijacks F-keys (F1 help, F5 reload)", () => {
    expect(resolveExamHotkey({ key: "F1", code: "F1" })).toBeNull();
    expect(resolveExamHotkey({ key: "F5", code: "F5" })).toBeNull();
  });

  it("ignores modifier combos and auto-repeat", () => {
    expect(resolveExamHotkey({ key: "1", ctrlKey: true })).toBeNull();
    expect(resolveExamHotkey({ key: "r", code: "KeyR", metaKey: true })).toBeNull();
    expect(resolveExamHotkey({ key: "ArrowLeft", altKey: true })).toBeNull();
    expect(resolveExamHotkey({ key: "2", repeat: true })).toBeNull();
  });

  it("does nothing while typing or while an overlay is open", () => {
    expect(resolveExamHotkey({ key: "1" }, { focus: "text" })).toBeNull();
    expect(resolveExamHotkey({ key: "ArrowRight" }, { overlayOpen: true })).toBeNull();
    expect(resolveExamHotkey({ key: "Enter" }, { overlayOpen: true })).toBeNull();
  });

  it("leaves Enter/Space to a focused button but still allows digits", () => {
    expect(resolveExamHotkey({ key: "Enter" }, { focus: "button" })).toBeNull();
    expect(resolveExamHotkey({ key: " ", code: "Space" }, { focus: "button" })).toBeNull();
    expect(resolveExamHotkey({ key: "2" }, { focus: "button" })).toEqual({ type: "select", index: 1 });
  });

  it("maps arrows, Enter and Space", () => {
    expect(resolveExamHotkey({ key: "ArrowLeft" })).toEqual({ type: "prev" });
    expect(resolveExamHotkey({ key: "ArrowRight" })).toEqual({ type: "next" });
    expect(resolveExamHotkey({ key: "Enter" })).toEqual({ type: "enter" });
    expect(resolveExamHotkey({ key: " ", code: "Space" })).toEqual({ type: "space" });
  });
});
