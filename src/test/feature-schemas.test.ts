import {describe,it,expect} from 'vitest';
import {taskSchema,todoSchema,prayerSchema} from '@/lib/feature-schemas';
import {dateInTimezone} from '@/lib/feature-model';
const id='9eec8d4e-b6fc-4bfb-8daf-7bdd363fe6a5';
describe('Saved activity rules',()=>{
 it('uses the account timezone at midnight',()=>{const now=new Date('2026-10-27T23:30:00Z');expect(dateInTimezone(now,'Asia/Kolkata')).toBe('2026-10-28');expect(dateInTimezone(now,'America/New_York')).toBe('2026-10-27');});
 it('keeps a daylight-saving calendar date stable',()=>expect(dateInTimezone(new Date('2026-11-01T06:30:00Z'),'America/New_York')).toBe('2026-11-01'));
 it('permits exactly five named prayers',()=>{for(const name of ['Fajr','Dhuhr','Asr','Maghrib','Isha'])expect(prayerSchema.safeParse({date:'2026-10-27',name,patch:{status:'Completed'}}).success).toBe(true);expect(prayerSchema.safeParse({date:'2026-10-27',name:'Other',patch:{}}).success).toBe(false);});
 it('rejects empty to-do titles and invalid due dates',()=>{const t={id,title:'Read',priority:'Medium',due:'',time:'',completed:false};expect(todoSchema.safeParse(t).success).toBe(true);expect(todoSchema.safeParse({...t,title:' '}).success).toBe(false);expect(todoSchema.safeParse({...t,due:'2026-02-30'}).success).toBe(false);});
 it('requires a due date for a to-do time',()=>{const t={id,title:'Read',priority:'High',due:'',time:'09:00',completed:false};expect(todoSchema.safeParse(t).success).toBe(false);expect(todoSchema.safeParse({...t,due:'2026-10-27'}).success).toBe(true);});
 it('preserves task categories and rejects duplicate subtask IDs',()=>{const task={id,title:'Study',description:'',priority:'Low',due:'',category:'Study',project:'',status:'Not Started',created:'',updated:'',subtasks:[{id,title:'Read',completed:false}]};expect(taskSchema.safeParse(task).success).toBe(true);expect(taskSchema.safeParse({...task,category:'Other'}).success).toBe(false);expect(taskSchema.safeParse({...task,subtasks:[...task.subtasks,...task.subtasks]}).success).toBe(false);});
});