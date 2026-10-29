import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {preferenceSchema} from './reminder-model';
export const savePreferences=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(v=>preferenceSchema.parse(v)).handler(async({data,context})=>{
 const {error}=await context.supabase.from('notification_preferences').upsert({...data,user_id:context.userId,updated_at:new Date().toISOString()});if(error)throw new Error('Reminder preferences could not be saved.');return true;
});
export const registerPush=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(v=>z.object({token:z.string().min(20).max(4096)}).parse(v)).handler(async({data,context})=>{
 const {error}=await context.supabase.from('push_subscriptions').upsert({user_id:context.userId,token:data.token,enabled:true,last_checked_at:new Date().toISOString()},{onConflict:'token'});if(error)throw new Error('This device could not be registered. Sign out of other accounts on this device and try again.');return true;
});
export const disablePush=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(v=>z.object({token:z.string().min(20).max(4096)}).parse(v)).handler(async({data,context})=>{
 const {error}=await context.supabase.from('push_subscriptions').delete().eq('user_id',context.userId).eq('token',data.token);if(error)throw new Error('This device could not be disconnected.');return true;
});