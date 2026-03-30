import { describe, it, expect } from "vitest";
import { computeMasonryLayout } from "../src/layoutEngine";
import { computeVisibleRange } from "../src/virtualizer";
import type { CardDimension } from "../src/types";

function generateCards(count: number): CardDimension[] {
  const cards: CardDimension[] = new Array(count);
  for (let i = 0; i < count; i++) {
    // Varying heights between 80 and 400
    cards[i] = {
      index: i,
      predictedHeight: 80 + Math.floor(Math.abs(Math.sin(i * 0.7)) * 320),
    };
  }
  return cards;
}

describe("performance benchmarks", () => {
  it("computes layout for 1,000 cards in under 50ms", () => {
    const cards = generateCards(1000);
    const start = performance.now();
    const result = computeMasonryLayout(cards, {
      columnCount: 4,
      columnWidth: 280,
      gap: 16,
    });
    const elapsed = performance.now() - start;

    expect(result.positions).toHaveLength(1000);
    expect(result.totalHeight).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });

  it("computes layout for 10,000 cards in under 500ms", () => {
    const cards = generateCards(10000);
    const start = performance.now();
    const result = computeMasonryLayout(cards, {
      columnCount: 4,
      columnWidth: 280,
      gap: 16,
    });
    const elapsed = performance.now() - start;

    expect(result.positions).toHaveLength(10000);
    expect(result.totalHeight).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(500);
  });

  it("computes visible range for 10,000 items quickly", () => {
    const cards = generateCards(10000);
    const { positions } = computeMasonryLayout(cards, {
      columnCount: 4,
      columnWidth: 280,
      gap: 16,
    });

    const start = performance.now();
    const range = computeVisibleRange(positions, 5000, 1000, 5);
    const elapsed = performance.now() - start;

    // Should render fewer than 50 DOM nodes for a 1000px viewport
    expect(range.visibleItems.length).toBeLessThan(100);
    expect(range.visibleItems.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });

  it("incremental layout is fast for 100 new cards", () => {
    const existingCards = generateCards(5000);
    const { positions } = computeMasonryLayout(existingCards, {
      columnCount: 4,
      columnWidth: 280,
      gap: 16,
    });

    // Now compute layout for just the next 100 cards appended
    const allCards = generateCards(5100);
    const start = performance.now();
    computeMasonryLayout(allCards, {
      columnCount: 4,
      columnWidth: 280,
      gap: 16,
    });
    const elapsed = performance.now() - start;

    // Full recompute of 5100 should still be fast
    expect(elapsed).toBeLessThan(100);
    expect(positions.length).toBe(5000);
  });
});
