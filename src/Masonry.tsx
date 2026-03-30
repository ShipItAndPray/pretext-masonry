import React, { useRef, useEffect, useCallback, useState } from "react";
import { useMasonryLayout } from "./useMasonryLayout";
import { useVirtualizer } from "./useVirtualizer";
import { MasonryItem } from "./MasonryItem";
import type { MasonryProps } from "./types";

const DEFAULT_GAP = 16;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_END_REACHED_THRESHOLD = 500;

/**
 * Masonry grid component with predictive text card heights and virtualization.
 * Cards are placed in the correct column on first paint with zero layout jump.
 */
export function Masonry<T>(props: MasonryProps<T>): React.ReactElement {
  const {
    items,
    columnCount,
    columnWidth,
    gap = DEFAULT_GAP,
    overscan = DEFAULT_OVERSCAN,
    virtualize,
    getItemText,
    getItemMeta,
    renderItem,
    className,
    style,
    onEndReached,
    endReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    font,
    lineHeight,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const endReachedCalledRef = useRef(false);

  // Track container width via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(width);
      }
    });

    observer.observe(container);
    // Set initial width
    setContainerWidth(container.clientWidth);

    return () => observer.disconnect();
  }, []);

  // Compute layout
  const layoutResult = useMasonryLayout(items, {
    containerWidth,
    columnCount,
    columnWidth,
    gap,
    getItemText,
    getItemMeta,
    font,
    lineHeight,
  });

  // Determine if virtualization should be enabled
  const shouldVirtualize = virtualize ?? items.length > 100;

  // Virtualization
  const virtualRange = useVirtualizer(
    layoutResult.positions,
    containerRef,
    overscan,
    shouldVirtualize
  );

  // Infinite scroll: check if near bottom
  const handleScroll = useCallback(() => {
    if (!onEndReached) return;
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, clientHeight } = container;
    const distanceFromBottom = layoutResult.totalHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < endReachedThreshold) {
      if (!endReachedCalledRef.current) {
        endReachedCalledRef.current = true;
        onEndReached();
      }
    } else {
      endReachedCalledRef.current = false;
    }
  }, [onEndReached, endReachedThreshold, layoutResult.totalHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onEndReached) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll, onEndReached]);

  // Which items to render
  const itemsToRender = shouldVirtualize
    ? virtualRange.visibleItems
    : layoutResult.positions.map((pos) => ({ index: pos.index, position: pos }));

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "auto",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          height: layoutResult.totalHeight,
          width: "100%",
        }}
      >
        {itemsToRender.map(({ index, position }) => (
          <MasonryItem key={index} position={position}>
            {renderItem(items[index], index)}
          </MasonryItem>
        ))}
      </div>
    </div>
  );
}
