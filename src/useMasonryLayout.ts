import { useMemo, useRef } from "react";
import { predictCardHeight } from "./heightPredictor";
import { computeMasonryLayout } from "./layoutEngine";
import type { CardMeta, MasonryLayoutResult, CardDimension } from "./types";

const DEFAULT_FONT = "14px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
const DEFAULT_LINE_HEIGHT = 21;
const DEFAULT_GAP = 16;

/**
 * Hook that computes masonry layout positions for all items.
 * Supports incremental updates when items are appended.
 */
export function useMasonryLayout<T>(
  items: T[],
  options: {
    containerWidth: number;
    columnCount?: number;
    columnWidth?: number;
    gap?: number;
    getItemText: (item: T) => string;
    getItemMeta?: (item: T) => CardMeta;
    font?: string;
    lineHeight?: number;
  }
): MasonryLayoutResult {
  const {
    containerWidth,
    gap = DEFAULT_GAP,
    getItemText,
    getItemMeta,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
  } = options;

  // Compute column count and width
  const { columnCount, columnWidth } = useMemo(() => {
    if (options.columnCount) {
      const cw = (containerWidth - gap * (options.columnCount - 1)) / options.columnCount;
      return { columnCount: options.columnCount, columnWidth: Math.max(0, cw) };
    }
    if (options.columnWidth) {
      const cc = Math.max(1, Math.floor((containerWidth + gap) / (options.columnWidth + gap)));
      const cw = (containerWidth - gap * (cc - 1)) / cc;
      return { columnCount: cc, columnWidth: Math.max(0, cw) };
    }
    // Default: auto-compute with target width of 280
    const targetWidth = 280;
    const cc = Math.max(1, Math.floor((containerWidth + gap) / (targetWidth + gap)));
    const cw = (containerWidth - gap * (cc - 1)) / cc;
    return { columnCount: cc, columnWidth: Math.max(0, cw) };
  }, [containerWidth, options.columnCount, options.columnWidth, gap]);

  // Cache previously computed heights for incremental layout
  const heightCacheRef = useRef<Map<number, number>>(new Map());

  return useMemo(() => {
    if (containerWidth <= 0 || items.length === 0) {
      return { positions: [], totalHeight: 0, columnCount, columnWidth };
    }

    const heightCache = heightCacheRef.current;
    const cards: CardDimension[] = new Array(items.length);

    for (let i = 0; i < items.length; i++) {
      // Use cached height if available for this index
      let height = heightCache.get(i);
      if (height === undefined) {
        const text = getItemText(items[i]);
        const meta = getItemMeta?.(items[i]);
        height = predictCardHeight(text, {
          containerWidth: columnWidth,
          font,
          lineHeight,
          padding: meta?.padding,
          imageHeight: meta?.imageHeight,
          headerText: meta?.headerText,
          headerFont: meta?.headerFont,
          extraHeight: meta?.extraHeight,
        });
        heightCache.set(i, height);
      }
      cards[i] = { index: i, predictedHeight: height };
    }

    const { positions, totalHeight } = computeMasonryLayout(cards, {
      columnCount,
      columnWidth,
      gap,
    });

    return { positions, totalHeight, columnCount, columnWidth };
  }, [items, containerWidth, columnCount, columnWidth, gap, getItemText, getItemMeta, font, lineHeight]);
}
