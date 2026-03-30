import type { CardDimension, LayoutPosition } from "./types";

/**
 * Classic greedy shortest-column masonry layout algorithm.
 * Pure function -- no side effects, no DOM access.
 *
 * For each card (in order), assigns it to the column with the smallest
 * current height. This produces optimal visual balance.
 */
export function computeMasonryLayout(
  cards: CardDimension[],
  options: {
    columnCount: number;
    columnWidth: number;
    gap: number;
  }
): { positions: LayoutPosition[]; totalHeight: number } {
  const { columnCount, columnWidth, gap } = options;

  if (cards.length === 0 || columnCount <= 0) {
    return { positions: [], totalHeight: 0 };
  }

  // Track current height of each column
  const columnHeights = new Float64Array(columnCount);
  const positions: LayoutPosition[] = new Array(cards.length);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // Find the shortest column
    let shortestCol = 0;
    let shortestHeight = columnHeights[0];
    for (let c = 1; c < columnCount; c++) {
      if (columnHeights[c] < shortestHeight) {
        shortestHeight = columnHeights[c];
        shortestCol = c;
      }
    }

    const x = shortestCol * (columnWidth + gap);
    const y = columnHeights[shortestCol];

    positions[i] = {
      index: card.index,
      column: shortestCol,
      x,
      y,
      width: columnWidth,
      height: card.predictedHeight,
    };

    // Update column height: card height + gap (gap acts as vertical spacing)
    columnHeights[shortestCol] += card.predictedHeight + gap;
  }

  // Total height is the tallest column minus the trailing gap
  let maxHeight = 0;
  for (let c = 0; c < columnCount; c++) {
    if (columnHeights[c] > maxHeight) {
      maxHeight = columnHeights[c];
    }
  }
  const totalHeight = maxHeight > 0 ? maxHeight - gap : 0;

  return { positions, totalHeight };
}

/**
 * Incrementally compute layout for newly appended cards.
 * Reuses existing column heights to avoid recomputing the entire layout.
 */
export function appendToMasonryLayout(
  existingPositions: LayoutPosition[],
  existingColumnHeights: number[],
  newCards: CardDimension[],
  options: {
    columnCount: number;
    columnWidth: number;
    gap: number;
  }
): { positions: LayoutPosition[]; totalHeight: number; columnHeights: number[] } {
  const { columnCount, columnWidth, gap } = options;
  const columnHeights = [...existingColumnHeights];
  const newPositions: LayoutPosition[] = new Array(newCards.length);

  for (let i = 0; i < newCards.length; i++) {
    const card = newCards[i];

    let shortestCol = 0;
    let shortestHeight = columnHeights[0];
    for (let c = 1; c < columnCount; c++) {
      if (columnHeights[c] < shortestHeight) {
        shortestHeight = columnHeights[c];
        shortestCol = c;
      }
    }

    const x = shortestCol * (columnWidth + gap);
    const y = columnHeights[shortestCol];

    newPositions[i] = {
      index: card.index,
      column: shortestCol,
      x,
      y,
      width: columnWidth,
      height: card.predictedHeight,
    };

    columnHeights[shortestCol] += card.predictedHeight + gap;
  }

  const allPositions = [...existingPositions, ...newPositions];

  let maxHeight = 0;
  for (let c = 0; c < columnCount; c++) {
    if (columnHeights[c] > maxHeight) {
      maxHeight = columnHeights[c];
    }
  }
  const totalHeight = maxHeight > 0 ? maxHeight - gap : 0;

  return { positions: allPositions, totalHeight, columnHeights };
}
