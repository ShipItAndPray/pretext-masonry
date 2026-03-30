import type { ReactNode, CSSProperties } from "react";

export interface CardMeta {
  imageHeight?: number;
  headerText?: string;
  headerFont?: string;
  padding?: { top: number; right: number; bottom: number; left: number };
  extraHeight?: number;
}

export interface MasonryProps<T> {
  items: T[];
  columnCount?: number;
  columnWidth?: number;
  gap?: number;
  overscan?: number;
  virtualize?: boolean;
  getItemText: (item: T) => string;
  getItemMeta?: (item: T) => CardMeta;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  font?: string;
  lineHeight?: number;
}

export interface CardDimension {
  index: number;
  predictedHeight: number;
}

export interface LayoutPosition {
  index: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MasonryLayoutResult {
  positions: LayoutPosition[];
  totalHeight: number;
  columnCount: number;
  columnWidth: number;
}

export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  visibleItems: Array<{
    index: number;
    position: LayoutPosition;
  }>;
}
