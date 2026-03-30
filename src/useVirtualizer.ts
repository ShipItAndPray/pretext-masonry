import { useState, useEffect, useCallback, useRef } from "react";
import { computeVisibleRange } from "./virtualizer";
import type { LayoutPosition, VirtualRange } from "./types";

/**
 * Hook that tracks scroll position and computes which cards are visible.
 * Attaches scroll listener to the container element.
 */
export function useVirtualizer(
  positions: LayoutPosition[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  overscan: number,
  enabled: boolean
): VirtualRange {
  const [range, setRange] = useState<VirtualRange>({
    startIndex: 0,
    endIndex: 0,
    visibleItems: [],
  });

  const rafId = useRef<number>(0);

  const update = useCallback(() => {
    const container = containerRef.current;
    if (!container || positions.length === 0) return;

    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    const newRange = computeVisibleRange(
      positions,
      scrollTop,
      viewportHeight,
      overscan
    );
    setRange(newRange);
  }, [positions, containerRef, overscan]);

  useEffect(() => {
    if (!enabled) {
      // When virtualization is disabled, show all items
      setRange({
        startIndex: 0,
        endIndex: positions.length,
        visibleItems: positions.map((pos) => ({
          index: pos.index,
          position: pos,
        })),
      });
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    // Initial computation
    update();

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [enabled, positions, containerRef, update]);

  return range;
}
