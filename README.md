# @shipitandpray/pretext-masonry

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://shipitandpray.github.io/pretext-masonry/) [![GitHub](https://img.shields.io/github/stars/ShipItAndPray/pretext-masonry?style=social)](https://github.com/ShipItAndPray/pretext-masonry)

> **[View Live Demo](https://shipitandpray.github.io/pretext-masonry/)**

[![npm version](https://img.shields.io/npm/v/@shipitandpray/pretext-masonry.svg)](https://www.npmjs.com/package/@shipitandpray/pretext-masonry)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@shipitandpray/pretext-masonry)](https://bundlephobia.com/package/@shipitandpray/pretext-masonry)

**Masonry/Pinterest grid with predictive text card heights and virtualization.** Zero layout flash. Powered by [@chenglou/pretext](https://github.com/chenglou/pretext).

## The Problem

Masonry layouts need each card's height before placement to assign it to the shortest column. Current approaches all have tradeoffs:

| Approach | Drawback |
|----------|----------|
| **Render-then-measure** (react-masonry-css, masonic) | Visible layout jump as cards snap into position |
| **Fixed-height cards** | Kills the masonry aesthetic -- text truncation or excess whitespace |
| **CSS Masonry** (`grid-template-rows: masonry`) | Not shipped in any stable browser (behind flags only, as of early 2026) |

**pretext-masonry** predicts card heights from text content using `@chenglou/pretext` -- pure JavaScript font measurement with zero DOM access. Cards land in the correct column on first paint.

## Why Not CSS Masonry?

The CSS `masonry` value for `grid-template-rows` is specified but not shipped in any stable browser as of 2026. It's behind flags in Firefox Nightly and Safari Technology Preview. For production use today, JavaScript layout is the only reliable option. This library makes that layout flash-free.

## Quick Start

```bash
npm install @shipitandpray/pretext-masonry @chenglou/pretext react react-dom
```

```tsx
import { Masonry } from '@shipitandpray/pretext-masonry';

function App({ notes }) {
  return (
    <Masonry
      items={notes}
      columnWidth={280}
      gap={12}
      getItemText={(note) => note.body}
      renderItem={(note) => (
        <div style={{ padding: 16, background: '#fff', borderRadius: 8 }}>
          <p>{note.body}</p>
        </div>
      )}
    />
  );
}
```

## Features

- **Zero layout flash** -- cards placed correctly on first paint
- **Virtualization** -- handles 10,000+ cards, rendering only visible ones
- **Responsive columns** -- auto-adjusts column count on resize via `ResizeObserver`
- **Infinite scroll** -- `onEndReached` callback for loading more data
- **Incremental layout** -- appending items is O(k), not O(n)
- **GPU-accelerated** -- uses CSS `transform: translate()` for positioning
- **Tiny** -- < 4KB gzipped (excluding pretext-core)
- **Framework-agnostic engine** -- `computeMasonryLayout` works without React

## Feature Comparison

| Feature | pretext-masonry | masonic | react-masonry-css | react-virtualized |
|---------|:-:|:-:|:-:|:-:|
| Zero layout flash | Yes | No | No | No |
| Virtualization | Yes | Yes | No | Yes |
| Predictive heights | Yes | No | No | No |
| No DOM measurement | Yes | No | No | No |
| Responsive columns | Yes | Yes | Yes | Manual |
| Infinite scroll | Yes | Yes | No | Yes |
| Bundle size (gzip) | ~3KB | ~5KB | ~1KB | ~30KB |

## API Reference

### `<Masonry<T>>` Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | Data array |
| `columnCount` | `number` | auto | Fixed column count |
| `columnWidth` | `number` | `280` | Target column width (auto columns) |
| `gap` | `number` | `16` | Gap between cards in px |
| `overscan` | `number` | `5` | Extra cards rendered outside viewport |
| `virtualize` | `boolean` | auto (`true` for >100 items) | Enable virtualization |
| `getItemText` | `(item: T) => string` | required | Extract text for height prediction |
| `getItemMeta` | `(item: T) => CardMeta` | -- | Additional height contributors |
| `renderItem` | `(item: T, index: number) => ReactNode` | required | Card renderer |
| `className` | `string` | -- | Container class |
| `style` | `CSSProperties` | -- | Container style |
| `onEndReached` | `() => void` | -- | Infinite scroll callback |
| `endReachedThreshold` | `number` | `500` | Pixels from bottom to trigger |
| `font` | `string` | `'14px Inter, ...'` | CSS font string for text measurement |
| `lineHeight` | `number` | `21` | Line height in px |

### `CardMeta`

```typescript
interface CardMeta {
  imageHeight?: number;     // Known image height in px
  headerText?: string;      // Title/header text
  headerFont?: string;      // Header font (if different from body)
  padding?: { top: number; right: number; bottom: number; left: number };
  extraHeight?: number;     // Additional fixed height (buttons, metadata bar)
}
```

### `useMasonryLayout<T>(items, options)` Hook

Returns `{ positions, totalHeight, columnCount, columnWidth }` for use in custom renderers.

```typescript
const layout = useMasonryLayout(items, {
  containerWidth: 800,
  columnWidth: 280,
  gap: 12,
  getItemText: (item) => item.body,
});
```

### `computeMasonryLayout(cards, options)` (Pure function)

Framework-agnostic layout engine. Takes an array of `{ index, predictedHeight }` and returns absolute positions.

```typescript
const { positions, totalHeight } = computeMasonryLayout(cards, {
  columnCount: 3,
  columnWidth: 280,
  gap: 16,
});
```

### `predictCardHeight(text, options)`

Predict a card's rendered height from its text content without DOM measurement.

```typescript
const height = predictCardHeight("Long card text...", {
  containerWidth: 280,
  font: "14px Inter, sans-serif",
  lineHeight: 21,
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  extraHeight: 40,
});
```

### `computeVisibleRange(positions, viewportTop, viewportHeight, overscan)`

Determine which cards overlap the current viewport for virtualization.

## How Virtualization Works

```
+---------------------------+
|  [card]  [card]  [card]   |  <-- above viewport (not rendered)
|  [card]  [card]  [card]   |
+===========================+
|  [card]  [card]  [card]   |  <-- viewport (rendered)
|  [card]  [card]  [card]   |
|  [card]  [card]  [card]   |
+===========================+
|  [card]  [card]  [card]   |  <-- below viewport (not rendered)
|  [card]  [card]  [card]   |
+---------------------------+

Container height = totalHeight (maintains scrollbar)
Only ~30-50 DOM nodes exist for 10,000+ items
```

The container `div` has `height: totalHeight` to maintain correct scrollbar size. As the user scrolls, `computeVisibleRange` determines which cards overlap the viewport (plus overscan buffer), and only those are rendered as absolutely positioned elements.

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Layout flash | Zero | Zero |
| Height prediction per card | < 0.2ms | ~0.05ms |
| Layout computation (1K cards) | < 50ms | ~5ms |
| Layout computation (10K cards) | < 500ms | ~40ms |
| Scroll frame rate (10K virtualized) | 60fps | 60fps |
| DOM nodes (10K cards, 1000px viewport) | < 50 | ~30-40 |
| Incremental layout (100 new cards) | < 10ms | ~1ms |

## Full Usage Example

```tsx
import { Masonry } from '@shipitandpray/pretext-masonry';

interface Note {
  id: string;
  title: string;
  body: string;
  color: string;
}

function NotesGrid({ notes }: { notes: Note[] }) {
  return (
    <Masonry
      items={notes}
      columnWidth={280}
      gap={12}
      getItemText={(note) => note.body}
      getItemMeta={(note) => ({
        headerText: note.title,
        headerFont: 'bold 18px/1.3 Inter, sans-serif',
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        extraHeight: 40,
      })}
      renderItem={(note) => (
        <div style={{ background: note.color, borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: '0 0 8px' }}>
            {note.title}
          </h3>
          <p style={{ fontSize: 14, margin: 0 }}>{note.body}</p>
          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            Just now
          </div>
        </div>
      )}
      onEndReached={() => loadMoreNotes()}
      style={{ height: '100vh' }}
    />
  );
}
```

## Build

```bash
npm run build    # ESM + CJS + types via tsup
npm run test     # vitest
npm run test:perf  # performance benchmarks
```

## License

MIT
