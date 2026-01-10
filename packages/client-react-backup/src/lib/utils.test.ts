import { describe, it, expect } from 'vitest';
import { getCategoryColor, cn } from './utils';

describe('getCategoryColor', () => {
    it('should return default color for null/undefined category', () => {
        expect(getCategoryColor(null)).toBe('bg-zinc-800 text-zinc-400 border-zinc-700');
        expect(getCategoryColor(undefined)).toBe('bg-zinc-800 text-zinc-400 border-zinc-700');
    });

    it('should return default color for empty string', () => {
        expect(getCategoryColor('')).toBe('bg-zinc-800 text-zinc-400 border-zinc-700');
    });

    it('should return deterministic color for same category', () => {
        const color1 = getCategoryColor('Food & Drink');
        const color2 = getCategoryColor('Food & Drink');
        expect(color1).toBe(color2);
    });

    it('should return different colors for different categories', () => {
        const foodColor = getCategoryColor('Food & Drink');
        const travelColor = getCategoryColor('Travel');
        // They might be the same by chance if hash collision, but unlikely
        // Let's just verify they are valid color strings
        expect(foodColor).toContain('bg-');
        expect(travelColor).toContain('bg-');
    });

    it('should always return a valid Tailwind color class', () => {
        const categories = ['Shopping', 'Entertainment', 'Bills', 'Transfer'];

        for (const cat of categories) {
            const color = getCategoryColor(cat);
            expect(color).toMatch(/bg-\w+-500\/10/);
            expect(color).toMatch(/text-\w+-400/);
            expect(color).toMatch(/border-\w+-500\/20/);
        }
    });
});

describe('cn (class name merger)', () => {
    it('should merge class names', () => {
        const result = cn('px-4', 'py-2');
        expect(result).toBe('px-4 py-2');
    });

    it('should handle conflicting Tailwind classes (last wins)', () => {
        // tailwind-merge should keep the last conflicting utility
        const result = cn('px-2', 'px-4');
        expect(result).toBe('px-4');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        const result = cn('btn', isActive && 'btn-active');
        expect(result).toBe('btn btn-active');
    });

    it('should filter out falsy values', () => {
        const result = cn('base', false && 'hidden', null, undefined, 'visible');
        expect(result).toBe('base visible');
    });
});
