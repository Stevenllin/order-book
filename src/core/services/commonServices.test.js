import { describe, it, expect } from 'vitest';
import { formatNumber } from './commonServices';

describe('formatNumber', () => {
  it('should format number with default 1 decimal place', () => {
    expect(formatNumber(1234.567)).toBe('1,234.6');
    expect(formatNumber(0.123)).toBe('0.1');
    expect(formatNumber(1000000)).toBe('1,000,000.0');
  });

  it('should format number with specified decimal places', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    expect(formatNumber(0.123, 3)).toBe('0.123');
    expect(formatNumber(1000000, 0)).toBe('1,000,000');
  });

  it('should handle zero and negative numbers', () => {
    expect(formatNumber(0, 2)).toBe('0.00');
    expect(formatNumber(-1234.567, 1)).toBe('-1,234.6');
    expect(formatNumber(-0.123, 2)).toBe('-0.12');
  });
});
