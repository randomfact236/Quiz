'use client';

/**
 * ============================================================================
 * CollapsibleRows — collapse a wrapping chip row to N visual rows
 * ============================================================================
 * Shows at most `maxRows` rows of chips; anything beyond is hidden and an
 * inline "See more (+N)" chip is rendered as the LAST item of the last row
 * (it participates in the flex wrap, so it never drops to its own line —
 * chips are hidden until it fits). Clicking expands everything and flips the
 * chip to "Show less".
 *
 * Hiding count self-adjusts: a layout effect bands the rendered chips into
 * visual rows (tolerating the 1–2px alignment jitter `items-center` produces
 * between chips of different heights) and hides one more chip while the
 * toggle sits beyond `maxRows`, or reveals one while there is a free row.
 * A ResizeObserver on the row container re-runs the adjustment when the
 * available width changes.
 * ============================================================================
 */

import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleRowsProps {
  children: React.ReactNode;
  /** Visible rows before collapsing. Defaults to 2. */
  maxRows?: number;
  /** Layout classes for the flex row container (e.g. 'flex flex-wrap items-center gap-2'). */
  className?: string;
}

/** Group nodes into visual row bands (±2px tolerance for height jitter). */
function bandNodes(nodes: HTMLElement[]): Array<{ top: number; bottom: number }> {
  const bands: Array<{ top: number; bottom: number }> = [];
  for (const k of nodes) {
    const t = k.offsetTop;
    const b = t + k.offsetHeight;
    const band = bands.find((rb) => t < rb.bottom - 2 && b > rb.top + 2);
    if (band) {
      band.top = Math.min(band.top, t);
      band.bottom = Math.max(band.bottom, b);
    } else {
      bands.push({ top: t, bottom: b });
    }
  }
  return bands.sort((a, b) => a.top - b.top);
}

/** Index of the band containing `top`, or -1. */
function bandIndexOf(bands: Array<{ top: number; bottom: number }>, top: number): number {
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    const next = bands[i + 1];
    if (band && top >= band.top - 2 && (next === undefined || top < next.top - 2)) {
      return i;
    }
  }
  return -1;
}

export function CollapsibleRows({ children, maxRows = 2, className = '' }: CollapsibleRowsProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);

  const items = Children.toArray(children);
  const total = items.length;
  const visibleItems = expanded ? items : items.slice(0, total - hiddenCount);
  const showToggle = expanded || hiddenCount > 0;

  const adjust = useCallback(() => {
    if (expanded) return;
    const el = contentRef.current;
    if (!el) return;
    const nodes = [...el.children] as HTMLElement[];
    const toggle = nodes.find((n) => n.hasAttribute('data-see-more'));
    const bands = bandNodes(nodes);
    const rows = bands.length;
    const toggleBand = toggle ? bandIndexOf(bands, toggle.offsetTop) : -1;

    if (!toggle && rows > maxRows && total > 0) {
      // Nothing hidden yet but content overflows: start by hiding the last chip.
      setHiddenCount(1);
    } else if (toggle && toggleBand >= maxRows && hiddenCount < total) {
      // The toggle wrapped beyond the allowed rows — hide one more chip.
      setHiddenCount(hiddenCount + 1);
    } else if (toggle && rows < maxRows && hiddenCount > 0) {
      // Everything fits with a spare row — reveal one more chip.
      setHiddenCount(hiddenCount - 1);
    }
  }, [expanded, hiddenCount, maxRows, total]);

  useLayoutEffect(() => {
    adjust();
  }, [adjust, children]);

  const lastWidthRef = useRef(0);

  useEffect(() => {
    // Only react to WIDTH changes (a height change is just the converge loop
    // itself settling) — reset and let the layout effect re-hide chips.
    const observer = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w !== lastWidthRef.current) {
        lastWidthRef.current = w;
        setHiddenCount(0);
      }
    });
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('resize', adjust);
    void document.fonts?.ready.then(() => adjust());
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', adjust);
    };
  }, [adjust]);

  return (
    <div ref={contentRef} className={className}>
      {visibleItems}
      {showToggle && (
        <button
          type="button"
          data-see-more=""
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          {expanded ? 'Show less' : `See more (${hiddenCount})`}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export default CollapsibleRows;
