import { describe, it, expect, vi } from "vitest";
import { predictCardHeight } from "../src/heightPredictor";

// Mock @chenglou/pretext since jsdom doesn't have canvas for font measurement
vi.mock("@chenglou/pretext", () => ({
  prepare: vi.fn((_text: string, _font: string) => ({ mock: true })),
  layout: vi.fn((_prepared: unknown, maxWidth: number, lineHeight: number) => {
    // Simple mock: estimate based on a rough chars-per-line calculation
    // In real usage, pretext does proper font measurement
    return { lineCount: 1, height: lineHeight };
  }),
}));

describe("predictCardHeight", () => {
  it("returns padding-only height for empty text", () => {
    const height = predictCardHeight("", {
      containerWidth: 300,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    });
    expect(height).toBe(32); // top + bottom padding
  });

  it("returns height with body text", () => {
    const height = predictCardHeight("Hello world", {
      containerWidth: 300,
      lineHeight: 21,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    });
    // 1 line (from mock) * 21 lineHeight + 32 padding = 53
    expect(height).toBe(53);
  });

  it("includes imageHeight in total", () => {
    const height = predictCardHeight("Hello", {
      containerWidth: 300,
      lineHeight: 21,
      imageHeight: 200,
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
    // 1 line * 21 + 20 padding + 200 image = 241
    expect(height).toBe(241);
  });

  it("includes header text height", () => {
    const height = predictCardHeight("Body text", {
      containerWidth: 300,
      lineHeight: 21,
      headerText: "Title",
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
    // header: 1 line * 21 + body: 1 line * 21 + 20 padding = 62
    expect(height).toBe(62);
  });

  it("includes extraHeight", () => {
    const height = predictCardHeight("Text", {
      containerWidth: 300,
      lineHeight: 21,
      extraHeight: 40,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    // 1 line * 21 + 40 extra = 61
    expect(height).toBe(61);
  });

  it("handles zero containerWidth gracefully", () => {
    const height = predictCardHeight("Some text", {
      containerWidth: 0,
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
    expect(height).toBe(20); // Just padding
  });

  it("handles negative available width (padding > container)", () => {
    const height = predictCardHeight("Some text", {
      containerWidth: 20,
      padding: { top: 10, right: 15, bottom: 10, left: 15 },
    });
    // Available width = 20 - 30 = -10, returns padding + extra only
    expect(height).toBe(20);
  });

  it("uses default values when options are omitted", () => {
    const height = predictCardHeight("Test", {
      containerWidth: 300,
    });
    // Should not throw, uses defaults
    expect(height).toBeGreaterThan(0);
  });
});
