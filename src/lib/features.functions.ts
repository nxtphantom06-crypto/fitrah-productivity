import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { todoSchema, taskSchema, prayerSchema, idSchema, orderSchema } from './feature-schemas';
import { dateInTimezone, type PrayerName, type PrayerRecord, type Todo, type Task } from './feature-model';

export const readFeatures = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const {supabase,userId}=context;
  const [prayers,todos,tasks,profile]=await Promise.all([
    supabase.from('prayers').select('*').eq('user_id',userId),
    supabase.from('todos').select('*').eq('user_id',userId).order('position').order('created_at'),
    supabase.from('tasks').select('*, subtasks(*)').eq('user_id',userId).order('created_at',{ascending:false}),
    supabase.from('profiles').select('timezone').eq('id',userId).single(),
  ]);
  if(prayers.error||todos.error||tasks.error||profile.error) throw new Error('Your activity could not be loaded. Please try again.');
  const records:Record<string,Partial<Record<PrayerName,PrayerRecord>>>={};
  for(const p of prayers.data??[]) { const day=records[p.date]??{}; day[p.name as PrayerName]={status:p.status as PrayerRecord['status'],note:p.note};records[p.date]=day; }
  return {prayers:records,timezone:profile.data?.timezone??'UTC',todos:(todos.data??[]).map(t=>({id:t.id,title:t.title,priority:t.priority as Todo['priority'],due:t.due??'',time:t.due_time?.slice(0,5)??'',completed:t.completed})),tasks:(tasks.data??[]).map(t=>({id:t.id,title:t.title,description:t.description,priority:t.priority as Task['priority'],due:t.due??'',category:t.category as Task['category'],project:t.project,status:t.status as Task['status'],created:t.created_at,updated:t.updated_at,subtasks:t.subtasks.sort((a,b)=>a.position-b.position).map(s=>({id:s.id,title:s.title,completed:s.completed}))}))};
});
export const writePrayer = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>prayerSchema.parse(input)).handler(async ({data,context})=>{
  const {supabase,userId}=context;
  const profile=await supabase.from('profiles').select('timezone').eq('id',userId).single();
  if(profile.error||data.date!==dateInTimezone(new Date(),profile.data.timezone)) throw new Error('Only today’s prayers can be changed.');
  // Updating only the supplied columns preserves notes during status changes.
  const {error}=await supabase.from('prayers').upsert({user_id:userId,date:data.date,name:data.name,...data.patch},{onConflict:'user_id,date,name'});
  if(error) throw new Error('Your prayer could not be saved. Please try again.');
  return true;
});
export const writeTodo = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>todoSchema.parse(input)).handler(async ({data,context})=>{
  const {supabase,userId}=context;
  const existing=await supabase.from('todos').select('position').eq('id',data.id).eq('user_id',userId).maybeSingle();
  if(existing.error) throw new Error('Your to-do could not be saved.');
  let position=existing.data?.position;
  if(position===undefined){const last=await supabase.from('todos').select('position').eq('user_id',userId).order('position',{ascending:false}).limit(1);if(last.error)throw new Error('Your to-do could not be saved.');position=(last.data?.[0]?.position??-1)+1;}
  const {error}=await supabase.from('todos').upsert({id:data.id,user_id:userId,title:data.title,priority:data.priority,due:data.due||null,due_time:data.time||null,completed:data.completed,position});
  if(error)throw new Error('Your to-do could not be saved. Please try again.');return true;
});
export const removeTodo = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>idSchema.parse(input)).handler(async ({data,context})=>{
  const {error}=await context.supabase.from('todos').delete().eq('id',data.id).eq('user_id',context.userId);if(error)throw new Error('Your to-do could not be deleted.');return true;
});
export const reorderTodos = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>orderSchema.parse(input)).handler(async ({data,context})=>{
  const {error}=await context.supabase.rpc('reorder_fitrah_todos',{ids:data.ids});if(error)throw new Error('Your order could not be saved.');return true;
});
export const writeTask = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>taskSchema.parse(input)).handler(async ({data,context})=>{
  const {error}=await context.supabase.rpc('save_fitrah_task',{payload:data});if(error)throw new Error('Your task could not be saved. Please try again.');return true;
});
export const removeTask = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>idSchema.parse(input)).handler(async ({data,context})=>{
  const {error}=await context.supabase.from('tasks').delete().eq('id',data.id).eq('user_id',context.userId);if(error)throw new Error('Your task could not be deleted.');return true;
});