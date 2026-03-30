import { prepare, layout } from "@chenglou/pretext";

const DEFAULT_FONT = "14px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
const DEFAULT_LINE_HEIGHT = 21; // 14px * 1.5
const DEFAULT_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Predict the rendered height of a text card without any DOM measurement.
 * Uses @chenglou/pretext to compute line count from font metrics alone.
 */
export function predictCardHeight(
  text: string,
  options: {
    containerWidth: number;
    font?: string;
    lineHeight?: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    imageHeight?: number;
    headerText?: string;
    headerFont?: string;
    extraHeight?: number;
  }
): number {
  const font = options.font ?? DEFAULT_FONT;
  const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const padding = options.padding ?? DEFAULT_PADDING;
  const availableWidth = options.containerWidth - padding.left - padding.right;

  if (availableWidth <= 0) return padding.top + padding.bottom + (options.extraHeight ?? 0);

  let totalHeight = padding.top + padding.bottom;

  // Header text height
  if (options.headerText && options.headerText.trim()) {
    const headerFont = options.headerFont ?? font;
    try {
      const prepared = prepare(options.headerText, headerFont);
      const result = layout(prepared, availableWidth, lineHeight);
      totalHeight += result.height;
    } catch {
      // Fallback: estimate 1 line for header
      totalHeight += lineHeight;
    }
  }

  // Body text height
  if (text && text.trim()) {
    try {
      const prepared = prepare(text, font);
      const result = layout(prepared, availableWidth, lineHeight);
      totalHeight += result.height;
    } catch {
      // Fallback: rough estimate based on character count
      const charsPerLine = Math.max(1, Math.floor(availableWidth / 7));
      const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
      totalHeight += lineCount * lineHeight;
    }
  }

  // Image height
  if (options.imageHeight) {
    totalHeight += options.imageHeight;
  }

  // Extra fixed height (buttons, metadata bar, etc.)
  if (options.extraHeight) {
    totalHeight += options.extraHeight;
  }

  return totalHeight;
}
