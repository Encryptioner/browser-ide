/**
 * Breakpoints Configuration Tests
 *
 * Tests for the unified breakpoint configuration and helper functions.
 */

import { describe, it, expect } from 'vitest';
import { breakpoints, minWidth, maxWidth, between } from '@/config/breakpoints';
// BreakpointKey type is tested indirectly through the helper functions

// =============================================================================
// BREAKPOINT VALUES
// =============================================================================

describe('breakpoints - values', () => {
  it('should define xsm as 480', () => {
    expect(breakpoints.xsm).toBe(480);
  });

  it('should define sm as 640', () => {
    expect(breakpoints.sm).toBe(640);
  });

  it('should define md as 768', () => {
    expect(breakpoints.md).toBe(768);
  });

  it('should define lg as 1024', () => {
    expect(breakpoints.lg).toBe(1024);
  });

  it('should define xl as 1280', () => {
    expect(breakpoints.xl).toBe(1280);
  });

  it('should define 2xl as 1536', () => {
    expect(breakpoints['2xl']).toBe(1536);
  });

  it('should have exactly 6 breakpoints', () => {
    expect(Object.keys(breakpoints)).toHaveLength(6);
  });
});

// =============================================================================
// minWidth HELPER
// =============================================================================

describe('minWidth', () => {
  it('should return correct media query for xsm', () => {
    expect(minWidth('xsm')).toBe('(min-width: 480px)');
  });

  it('should return correct media query for sm', () => {
    expect(minWidth('sm')).toBe('(min-width: 640px)');
  });

  it('should return correct media query for md', () => {
    expect(minWidth('md')).toBe('(min-width: 768px)');
  });

  it('should return correct media query for lg', () => {
    expect(minWidth('lg')).toBe('(min-width: 1024px)');
  });

  it('should return correct media query for xl', () => {
    expect(minWidth('xl')).toBe('(min-width: 1280px)');
  });

  it('should return correct media query for 2xl', () => {
    expect(minWidth('2xl')).toBe('(min-width: 1536px)');
  });
});

// =============================================================================
// maxWidth HELPER
// =============================================================================

describe('maxWidth', () => {
  it('should return max-width minus 1 for xsm', () => {
    expect(maxWidth('xsm')).toBe('(max-width: 479px)');
  });

  it('should return max-width minus 1 for sm', () => {
    expect(maxWidth('sm')).toBe('(max-width: 639px)');
  });

  it('should return max-width minus 1 for md', () => {
    expect(maxWidth('md')).toBe('(max-width: 767px)');
  });

  it('should return max-width minus 1 for lg', () => {
    expect(maxWidth('lg')).toBe('(max-width: 1023px)');
  });

  it('should return max-width minus 1 for xl', () => {
    expect(maxWidth('xl')).toBe('(max-width: 1279px)');
  });

  it('should return max-width minus 1 for 2xl', () => {
    expect(maxWidth('2xl')).toBe('(max-width: 1535px)');
  });
});

// =============================================================================
// between HELPER
// =============================================================================

describe('between', () => {
  it('should return range query between sm and md', () => {
    expect(between('sm', 'md')).toBe('(min-width: 640px) and (max-width: 767px)');
  });

  it('should return range query between md and lg', () => {
    expect(between('md', 'lg')).toBe('(min-width: 768px) and (max-width: 1023px)');
  });

  it('should return range query between lg and xl', () => {
    expect(between('lg', 'xl')).toBe('(min-width: 1024px) and (max-width: 1279px)');
  });

  it('should return range query between xsm and 2xl', () => {
    expect(between('xsm', '2xl')).toBe('(min-width: 480px) and (max-width: 1535px)');
  });

  it('should handle same breakpoint for both min and max', () => {
    expect(between('md', 'md')).toBe('(min-width: 768px) and (max-width: 767px)');
  });
});
