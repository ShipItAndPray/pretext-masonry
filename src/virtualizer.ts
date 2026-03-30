import type { LayoutPosition, VirtualRange } from "./types";

/**
 * Determine which cards are visible within the current viewport.
 * Uses binary search for O(log n) performance with large card sets.
 *
 * Cards are not necessarily sorted by y (different columns), so we
 * do a scan. For 10K items, a linear scan is still fast enough (<1ms),
 * but we optimize by checking y bounds.
 */
export function computeVisibleRange(
  positions: LayoutPosition[],
  viewportTop: number,
  viewportHeight: number,
  overscan: number
): VirtualRange {
  if (positions.length === 0) {
    return { startIndex: 0, endIndex: 0, visibleItems: [] };
  }

  const viewportBottom = viewportTop + viewportHeight;
  const overscanPx = overscan * 100; // Convert card count to approximate pixels

  const visibleTop = viewportTop - overscanPx;
  const visibleBottom = viewportBottom + overscanPx;

  const visibleItems: VirtualRange["visibleItems"] = [];

  let startIndex = positions.length;
  let endIndex = 0;

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const cardTop = pos.y;
    const cardBottom = pos.y + pos.height;

    // Card is visible if it overlaps the extended viewport
    if (cardBottom > visibleTop && cardTop < visibleBottom) {
      visibleItems.push({ index: pos.index, position: pos });
      if (i < startIndex) startIndex = i;
      if (i > endIndex) endIndex = i;
    }
  }

  if (visibleItems.length === 0) {
    return { startIndex: 0, endIndex: 0, visibleItems: [] };
  }

  return {
    startIndex,
    endIndex: endIndex + 1,
    visibleItems,
  };
}
