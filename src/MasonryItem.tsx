import React, { memo } from "react";
import type { LayoutPosition } from "./types";

interface MasonryItemProps {
  position: LayoutPosition;
  children: React.ReactNode;
}

/**
 * Individual card wrapper. Uses absolute positioning with CSS transforms
 * for GPU-accelerated placement.
 */
export const MasonryItem = memo(function MasonryItem({
  position,
  children,
}: MasonryItemProps) {
  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: position.width,
        willChange: "transform",
      }}
      data-masonry-index={position.index}
      data-masonry-column={position.column}
    >
      {children}
    </div>
  );
});
