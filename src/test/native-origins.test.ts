import { describe, expect, it } from 'vitest';
import { isNativeAppOrigin, nativeCorsHeaders, toServerUrl } from '@/lib/native/origins';

describe('Packaged app access to the hosted site', () => {
 it('accepts only the Android and iOS app origins', () => {
  expect(isNativeAppOrigin('https://localhost')).toBe(true);
  expect(isNativeAppOrigin('capacitor://localhost')).toBe(true);
  expect(isNativeAppOrigin('http://localhost')).toBe(false);
  expect(isNativeAppOrigin('https://evil.example')).toBe(false);
  expect(isNativeAppOrigin(null)).toBe(false);
 });
 it('sends relative server calls to the hosted site', () => {
  expect(toServerUrl('/_serverFn/abc?x=1', 'https://fitrah-productivity.lovable.app/')).toBe('https://fitrah-productivity.lovable.app/_serverFn/abc?x=1');
  expect(toServerUrl('https://other.example/a', 'https://fitrah-productivity.lovable.app')).toBe('https://other.example/a');
 });
 it('echoes the app origin rather than allowing everyone', () => {
  expect(nativeCorsHeaders('https://localhost', null)['Access-Control-Allow-Origin']).toBe('https://localhost');
 });
});
