import { describe, it, expect } from "vitest";
import { computeVisibleRange } from "../src/virtualizer";
import type { LayoutPosition } from "../src/types";

function makePositions(count: number, columnCount: number): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const columnHeights = new Array(columnCount).fill(0);
  const columnWidth = 200;
  const gap = 16;
  const cardHeight = 100;

  for (let i = 0; i < count; i++) {
    // Find shortest column
    let shortestCol = 0;
    for (let c = 1; c < columnCount; c++) {
      if (columnHeights[c] < columnHeights[shortestCol]) shortestCol = c;
    }
    positions.push({
      index: i,
      column: shortestCol,
      x: shortestCol * (columnWidth + gap),
      y: columnHeights[shortestCol],
      width: columnWidth,
      height: cardHeight,
    });
    columnHeights[shortestCol] += cardHeight + gap;
  }
  return positions;
}

describe("computeVisibleRange", () => {
  it("returns empty range for empty positions", () => {
    const result = computeVisibleRange([], 0, 800, 5);
    expect(result.visibleItems).toHaveLength(0);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
  });

  it("returns only visible cards for viewport at top", () => {
    // 30 cards in 3 columns = 10 rows, each 100px + 16px gap
    // Column heights: 10 * 100 + 9 * 16 = 1144
    const positions = makePositions(30, 3);
    const result = computeVisibleRange(positions, 0, 800, 0);

    // All cards with y + height <= 800 should be visible (no overscan)
    for (const item of result.visibleItems) {
      expect(item.position.y + item.position.height).toBeGreaterThan(0);
      expect(item.position.y).toBeLessThan(800);
    }
  });

  it("includes overscan cards above and below viewport", () => {
    const positions = makePositions(30, 3);
    const resultNoOverscan = computeVisibleRange(positions, 400, 400, 0);
    const resultWithOverscan = computeVisibleRange(positions, 400, 400, 5);

    expect(resultWithOverscan.visibleItems.length).toBeGreaterThanOrEqual(
      resultNoOverscan.visibleItems.length
    );
  });

  it("returns correct range when scrolled to middle", () => {
    const positions = makePositions(60, 3);
    // Scroll to middle
    const result = computeVisibleRange(positions, 500, 800, 2);

    // All returned items should overlap with the extended viewport
    for (const item of result.visibleItems) {
      const cardBottom = item.position.y + item.position.height;
      const cardTop = item.position.y;
      // With overscan of 2 (200px), range is [300, 1500]
      expect(cardBottom).toBeGreaterThan(500 - 200);
      expect(cardTop).toBeLessThan(500 + 800 + 200);
    }
  });

  it("includes last items when scrolled to end", () => {
    const positions = makePositions(30, 3);
    const maxY = Math.max(...positions.map((p) => p.y));
    // Scroll so viewport covers the last cards (not past the end)
    const result = computeVisibleRange(positions, maxY - 400, 800, 5);

    // Should include items near the bottom
    const lastItems = result.visibleItems.filter(
      (item) => item.position.y >= maxY
    );
    expect(lastItems.length).toBeGreaterThan(0);
  });

  it("returns all items when viewport covers everything", () => {
    const positions = makePositions(9, 3);
    // Viewport of 10000px covers all cards
    const result = computeVisibleRange(positions, 0, 10000, 0);
    expect(result.visibleItems).toHaveLength(9);
  });
});
