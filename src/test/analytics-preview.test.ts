import { describe, expect, it } from 'vitest';
import { previewMonth } from '@/lib/analytics-preview';
describe('Sample analytics', () => {
  it('uses five possible prayers per calendar day', () => {
    const data = previewMonth(2026, 9);
    expect(data.possible).toBe(155);
    expect(data.daily).toHaveLength(31);
    expect(data.total).toBe(data.daily.reduce((sum, day) => sum + day.count, 0));
  });
  it('handles leap-year February without impossible dates', () => {
    const data = previewMonth(2028, 1);
    expect(data.days).toBe(29);
    expect(data.possible).toBe(145);
    expect(data.daily.at(-1)?.day).toBe(29);
  });
});