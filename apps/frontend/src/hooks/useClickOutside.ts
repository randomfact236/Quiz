/**
 * ============================================================================
 * useClickOutside Hook
 * ============================================================================
 * @module hooks/useClickOutside
 * @description Fires a callback when a click occurs outside the referenced element.
 *              Replaces multiple duplicated useEffect click-outside handlers.
 */

import { useEffect, type RefObject } from 'react';

/**
 * Fires `callback` whenever the user clicks outside of `ref.current`.
 * Only active when `enabled` is true (default: true).
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T>,
    callback: () => void,
    enabled = true,
): void {
    useEffect(() => {
        if (!enabled) return;

        const handleMouseDown = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [ref, callback, enabled]);
}
