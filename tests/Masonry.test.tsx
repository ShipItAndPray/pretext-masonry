import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// Mock @chenglou/pretext
vi.mock("@chenglou/pretext", () => ({
  prepare: vi.fn(() => ({ mock: true })),
  layout: vi.fn((_prepared: unknown, _maxWidth: number, lineHeight: number) => ({
    lineCount: 2,
    height: lineHeight * 2,
  })),
}));

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    // Override clientWidth to simulate a real container
    Object.defineProperty(target, "clientWidth", { value: 800, configurable: true });
    Object.defineProperty(target, "clientHeight", { value: 600, configurable: true });
    // Simulate initial resize
    this.callback(
      [
        {
          target,
          contentRect: { width: 800, height: 600 } as DOMRectReadOnly,
          contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          devicePixelContentBoxSize: [],
        } as unknown as ResizeObserverEntry,
      ],
      this
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

import { Masonry } from "../src/Masonry";

interface TestItem {
  id: number;
  text: string;
}

const makeItems = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    text: `Card ${i} with some text content that varies in length.`,
  }));

describe("Masonry component", () => {
  it("renders without crashing", () => {
    const items = makeItems(5);
    const { container } = render(
      <Masonry
        items={items}
        columnCount={3}
        gap={16}
        getItemText={(item) => item.text}
        renderItem={(item) => <div>{item.text}</div>}
        virtualize={false}
        style={{ height: 600 }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the correct number of cards when not virtualized", () => {
    const items = makeItems(6);
    const { container } = render(
      <Masonry
        items={items}
        columnCount={3}
        gap={16}
        getItemText={(item) => item.text}
        renderItem={(item) => <div data-testid="card">{item.text}</div>}
        virtualize={false}
        style={{ height: 600 }}
      />
    );
    const cards = container.querySelectorAll("[data-masonry-index]");
    expect(cards).toHaveLength(6);
  });

  it("applies absolute positioning to cards", () => {
    const items = makeItems(3);
    const { container } = render(
      <Masonry
        items={items}
        columnCount={3}
        gap={16}
        getItemText={(item) => item.text}
        renderItem={(item) => <div>{item.text}</div>}
        virtualize={false}
        style={{ height: 600 }}
      />
    );
    const cards = container.querySelectorAll("[data-masonry-index]");
    for (const card of cards) {
      const style = (card as HTMLElement).style;
      expect(style.position).toBe("absolute");
    }
  });

  it("sets data-masonry-column attribute", () => {
    const items = makeItems(3);
    const { container } = render(
      <Masonry
        items={items}
        columnCount={3}
        gap={16}
        getItemText={(item) => item.text}
        renderItem={(item) => <div>{item.text}</div>}
        virtualize={false}
        style={{ height: 600 }}
      />
    );
    const columns = new Set<string>();
    const cards = container.querySelectorAll("[data-masonry-column]");
    for (const card of cards) {
      columns.add(card.getAttribute("data-masonry-column")!);
    }
    expect(columns.size).toBe(3);
  });

  it("handles empty items array", () => {
    const { container } = render(
      <Masonry
        items={[]}
        columnCount={3}
        gap={16}
        getItemText={() => ""}
        renderItem={() => <div />}
        style={{ height: 600 }}
      />
    );
    const cards = container.querySelectorAll("[data-masonry-index]");
    expect(cards).toHaveLength(0);
  });
});
