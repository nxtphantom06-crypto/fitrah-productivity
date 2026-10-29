import {z} from 'zod';
import {prayerNames} from './feature-model';
const reminder=z.object({enabled:z.boolean(),offset:z.enum(['15 minutes before','At prayer time','Custom']),minutes:z.number().int().min(0).max(120)});
export const reminderSchema=z.object({prayers:z.object({Fajr:reminder,Dhuhr:reminder,Asr:reminder,Maghrib:reminder,Isha:reminder}),daily:z.boolean(),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),streak:z.boolean(),milestones:z.boolean()});
export type Reminder=z.infer<typeof reminder>;
export type ReminderSettings=z.infer<typeof reminderSchema>;
export const defaultReminders:ReminderSettings={prayers:Object.fromEntries(prayerNames.map(p=>[p,{enabled:true,offset:'15 minutes before',minutes:15}])) as ReminderSettings['prayers'],daily:true,time:'09:00',streak:true,milestones:true};
export const preferenceSchema=z.object({settings:reminderSchema,latitude:z.number().min(-90).max(90).nullable(),longitude:z.number().min(-180).max(180).nullable(),method:z.enum(['MuslimWorldLeague','Karachi','NorthAmerica','UmmAlQura']),madhab:z.enum(['Shafi','Hanafi'])});
export function dueInWindow(time:Date,now:Date,windowMinutes=5){const age=now.getTime()-time.getTime();return age>=0&&age<windowMinutes*60000;}