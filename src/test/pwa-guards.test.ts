import { describe, expect, it } from 'vitest';
import { shouldRegisterPwa } from '@/lib/pwa/guards';
describe('Offline safety', () => {
 it('never registers in development', () => expect(shouldRegisterPwa(false, 'fitrah.example', false, '')).toBe(false));
 it('never registers in an iframe', () => expect(shouldRegisterPwa(true, 'fitrah.example', true, '')).toBe(false));
 it('never registers on main or draft preview hosts', () => {
  for (const host of ['id-preview--abc.lovable.app','preview-v2--abc.lovable.app','project--abc-dev.gpt-eng.com','abc.lovableproject.com','beta.lovable.dev']) expect(shouldRegisterPwa(true,host,false,'')).toBe(false);
 });
 it('honors the offline kill switch', () => expect(shouldRegisterPwa(true,'fitrah.example',false,'?sw=off')).toBe(false));
 it('allows a published custom domain even with a preview-like label', () => expect(shouldRegisterPwa(true,'preview-v2--shop.example.com',false,'')).toBe(true));
});