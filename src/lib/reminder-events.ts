import {Coordinates,CalculationMethod,Madhab,PrayerTimes} from 'adhan';
import {fromZonedTime} from 'date-fns-tz';
import {dateInTimezone,prayerNames,countPrayers} from './feature-model';
import {streakSummary,shiftDay,type PrayerHistory,type Completion} from './activity-analytics';
import {dueInWindow,preferenceSchema} from './reminder-model';
import type {z} from 'zod';
export type ReminderEvent={key:string;title:string;body:string;path:string};
export function reminderEvents(prefs:z.infer<typeof preferenceSchema>,timezone:string,prayers:PrayerHistory,completions:Completion[],now:Date){
 const day=dateInTimezone(now,timezone),events:ReminderEvent[]=[];
 const settings=prefs.settings;
 if(prefs.latitude!==null&&prefs.longitude!==null){
  const params=CalculationMethod[prefs.method]();params.madhab=Madhab[prefs.madhab];
  for(const date of [day,shiftDay(day,1)]){
   const times=new PrayerTimes(new Coordinates(prefs.latitude,prefs.longitude),new Date(`${date}T12:00:00`),params);
   for(const name of prayerNames){const r=settings.prayers[name];const offset=r.offset==='Custom'?r.minutes:r.offset==='At prayer time'?0:15;const time=times[name.toLowerCase() as 'fajr'|'dhuhr'|'asr'|'maghrib'|'isha'];if(r.enabled&&prayers[date]?.[name]?.status!=='Completed'&&dueInWindow(new Date(time.getTime()-offset*60000),now))events.push({key:`${date}:prayer:${name}`,title:`${name} reminder`,body:offset?`${name} begins in ${offset} minutes.`:`It’s time for ${name}.`,path:'/prayers'});}
  }
 }
 if(settings.daily&&dueInWindow(fromZonedTime(`${day}T${settings.time}:00`,timezone),now))events.push({key:`${day}:tasks`,title:'A moment for your intentions',body:'Make room for one meaningful task today.',path:'/tasks'});
 const streak=streakSummary(prayers,completions,day);
 if(settings.streak&&dueInWindow(fromZonedTime(`${day}T23:45:00`,timezone),now)&&(countPrayers(prayers[day]??{})<5||!completions.some(c=>c.day===day)))events.push({key:`${day}:check-in`,title:'A moment to reconnect',body:'Your day is not complete yet. There is still time for a small step.',path:'/dashboard'});
 const yesterday=shiftDay(day,-1);
 if(settings.streak&&dueInWindow(fromZonedTime(`${day}T00:00:00`,timezone),now)&&streakSummary(prayers,completions,yesterday).daily===0&&streakSummary(prayers,completions,shiftDay(day,-2)).daily>0)events.push({key:`${day}:broken`,title:'Start fresh!',body:'A new day is another chance to build your rhythm.',path:'/dashboard'});
 if(settings.milestones&&[7,30,100].includes(streak.daily)&&countPrayers(prayers[day]??{})===5&&completions.some(c=>c.day===day))events.push({key:`milestone:${streak.daily}:${day}`,title:`🔥 ${streak.daily}-Day Streak!`,body:'Small steps. Lasting intention. Keep going.',path:'/progress'});
 return events;
}