import { z } from 'zod';
import { prayerNames } from './feature-model';
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}, 'Invalid date');
const optionalDay = z.union([z.literal(''), day]);
const priority = z.enum(['Low','Medium','High']);
export const todoSchema = z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(500),priority,due:optionalDay,time:z.union([z.literal(''),z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]),completed:z.boolean()}).refine(t => !t.time || !!t.due, 'A time needs a date');
export const taskSchema = z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(500),description:z.string().max(20000),priority,due:optionalDay,category:z.enum(['Personal','Work','Study']),project:z.string().max(500),status:z.enum(['Not Started','In Progress','Completed']),subtasks:z.array(z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(500),completed:z.boolean()})).max(200),created:z.string(),updated:z.string()}).refine(t => new Set(t.subtasks.map(s=>s.id)).size === t.subtasks.length, 'Duplicate subtask');
export const prayerSchema = z.object({date:day,name:z.enum(prayerNames),patch:z.object({status:z.enum(['Pending','Completed','Missed']).optional(),note:z.string().max(20000).optional()})});
export const idSchema = z.object({id:z.string().uuid()});
export const orderSchema = z.object({ids:z.array(z.string().uuid()).max(10000)}).refine(v=>new Set(v.ids).size===v.ids.length,'Duplicate to-do');