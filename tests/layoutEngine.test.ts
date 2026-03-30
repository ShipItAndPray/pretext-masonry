import { describe, it, expect } from "vitest";
import { computeMasonryLayout, appendToMasonryLayout } from "../src/layoutEngine";
import type { CardDimension } from "../src/types";

describe("computeMasonryLayout", () => {
  it("returns empty layout for no cards", () => {
    const result = computeMasonryLayout([], {
      columnCount: 3,
      columnWidth: 200,
      gap: 16,
    });
    expect(result.positions).toEqual([]);
    expect(result.totalHeight).toBe(0);
  });

  it("places 3 equal-height cards in 3 columns at same height", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 100 },
      { index: 1, predictedHeight: 100 },
      { index: 2, predictedHeight: 100 },
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 3,
      columnWidth: 200,
      gap: 16,
    });

    expect(result.positions).toHaveLength(3);
    // All 3 cards should be at y=0 (one per column)
    expect(result.positions[0].y).toBe(0);
    expect(result.positions[1].y).toBe(0);
    expect(result.positions[2].y).toBe(0);
    // Each in a different column
    const columns = result.positions.map((p) => p.column).sort();
    expect(columns).toEqual([0, 1, 2]);
    // Total height = 100 (all columns same height)
    expect(result.totalHeight).toBe(100);
  });

  it("places cards in shortest column (varying heights)", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 200 }, // col 0
      { index: 1, predictedHeight: 100 }, // col 1
      { index: 2, predictedHeight: 150 }, // col 2
      { index: 3, predictedHeight: 80 },  // col 1 (shortest at 100+16=116)
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 3,
      columnWidth: 200,
      gap: 16,
    });

    expect(result.positions).toHaveLength(4);
    // Card 3 should go to column 1 (height 116 is shortest)
    expect(result.positions[3].column).toBe(1);
    expect(result.positions[3].y).toBe(100 + 16); // after card 1 + gap
  });

  it("stacks cards vertically in a single column", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 100 },
      { index: 1, predictedHeight: 150 },
      { index: 2, predictedHeight: 80 },
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 1,
      columnWidth: 400,
      gap: 10,
    });

    expect(result.positions[0].y).toBe(0);
    expect(result.positions[1].y).toBe(100 + 10);
    expect(result.positions[2].y).toBe(100 + 10 + 150 + 10);
    expect(result.totalHeight).toBe(100 + 10 + 150 + 10 + 80);
  });

  it("applies gap correctly between cards", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 50 },
      { index: 1, predictedHeight: 50 },
      { index: 2, predictedHeight: 50 }, // goes to col 0
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 2,
      columnWidth: 200,
      gap: 20,
    });

    // Card 2 goes to col 0 (both at 50+20=70, picks first)
    expect(result.positions[2].y).toBe(50 + 20);
  });

  it("computes correct x positions based on column and gap", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 100 },
      { index: 1, predictedHeight: 100 },
      { index: 2, predictedHeight: 100 },
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 3,
      columnWidth: 200,
      gap: 16,
    });

    // x = column * (columnWidth + gap)
    const xValues = result.positions.map((p) => p.x).sort((a, b) => a - b);
    expect(xValues).toEqual([0, 216, 432]);
  });

  it("sets correct width on all positions", () => {
    const cards: CardDimension[] = [
      { index: 0, predictedHeight: 100 },
      { index: 1, predictedHeight: 200 },
    ];
    const result = computeMasonryLayout(cards, {
      columnCount: 2,
      columnWidth: 300,
      gap: 16,
    });

    for (const pos of result.positions) {
      expect(pos.width).toBe(300);
    }
  });

  it("returns 0 totalHeight for zero columnCount", () => {
    const cards: CardDimension[] = [{ index: 0, predictedHeight: 100 }];
    const result = computeMasonryLayout(cards, {
      columnCount: 0,
      columnWidth: 200,
      gap: 16,
    });
    expect(result.positions).toEqual([]);
    expect(result.totalHeight).toBe(0);
  });
});

describe("appendToMasonryLayout", () => {
  it("appends new cards without recomputing existing positions", () => {
    const existingPositions = [
      { index: 0, column: 0, x: 0, y: 0, width: 200, height: 100 },
      { index: 1, column: 1, x: 216, y: 0, width: 200, height: 100 },
    ];
    const existingColumnHeights = [116, 116]; // 100 + 16 gap

    const newCards: CardDimension[] = [
      { index: 2, predictedHeight: 80 },
    ];

    const result = appendToMasonryLayout(
      existingPositions,
      existingColumnHeights,
      newCards,
      { columnCount: 2, columnWidth: 200, gap: 16 }
    );

    expect(result.positions).toHaveLength(3);
    // Existing positions preserved
    expect(result.positions[0]).toEqual(existingPositions[0]);
    expect(result.positions[1]).toEqual(existingPositions[1]);
    // New card appended
    expect(result.positions[2].index).toBe(2);
    expect(result.positions[2].y).toBe(116);
  });
});
