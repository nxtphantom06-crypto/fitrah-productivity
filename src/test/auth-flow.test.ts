import { describe, expect, it } from 'vitest';
import { safeReturnPath, signupHasSession } from '@/lib/auth-flow';
describe('Account navigation', () => {
  it('keeps same-origin task destinations', () => {
    expect(safeReturnPath('/tasks/new')).toBe('/tasks/new');
  });
  it.each(['https://example.com', '//example.com', '/\\example.com', undefined])('rejects unsafe destination %s', value => {
    expect(safeReturnPath(value)).toBe('/dashboard');
  });
  it('does not treat unconfirmed signup as signed in', () => {
    expect(signupHasSession(null)).toBe(false);
    expect(signupHasSession(undefined)).toBe(false);
    expect(signupHasSession({ user: { id: 'confirmed' } })).toBe(true);
  });
});