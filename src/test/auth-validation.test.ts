import { describe, expect, it } from 'vitest';
import { validateAuth } from '@/lib/auth-validation';
const valid={name:'Mohsin',email:'mohsin@example.com',password:'abcdefgh',confirm:'abcdefgh'};
describe('Account form validation',()=>{
 it('requires a full name at signup',()=>expect(validateAuth({...valid,name:''},'signup')['name']).toBeDefined());
 it('requires a valid email',()=>expect(validateAuth({...valid,email:'invalid'},'signup')['email']).toBeDefined());
 it('requires at least 8 password characters',()=>{expect(validateAuth({...valid,password:'1234567',confirm:'1234567'},'signup')['password']).toBeDefined();expect(validateAuth(valid,'signup')['password']).toBeUndefined();});
 it('requires matching passwords',()=>expect(validateAuth({...valid,confirm:'different'},'signup')['confirm']).toBeDefined());
 it('requires a login password',()=>expect(validateAuth({...valid,password:''},'login')['password']).toBeDefined());
 it('does not require a password for reset requests',()=>expect(validateAuth({email:valid.email},'forgot')).toEqual({}));
});
