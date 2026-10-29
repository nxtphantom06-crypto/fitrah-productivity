import {countPrayers,prayerNames,type PrayerName,type PrayerRecord} from './feature-model';
export type Completion={day:string;kind:string;entity_id:string};
export type PrayerHistory=Record<string,Partial<Record<PrayerName,PrayerRecord>>>;
export function shiftDay(day:string,delta:number){const d=new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);}
export function streakSummary(prayers:PrayerHistory,completions:Completion[],today:string){
 const productive=new Set(completions.map(c=>c.day));
 const full=Object.keys(prayers).filter(day=>day<=today&&countPrayers(prayers[day]??{})===5).sort();
 const dailyDays=full.filter(day=>productive.has(day));
 function measure(days:string[]){const set=new Set(days);let end=set.has(today)?today:shiftDay(today,-1),current=0,best=0,run=0,previous='';while(set.has(end)){current++;end=shiftDay(end,-1);}for(const day of days){run=previous&&shiftDay(previous,1)===day?run+1:1;best=Math.max(best,run);previous=day;}return {current,best};}
 const daily=measure(dailyDays),monthly=measure(full);
 return {daily:daily.current,monthly:monthly.current,best:daily.best,bestMonthly:monthly.best,history:full.map(day=>({day,prayers:5,productive:productive.has(day)}))};
}
export function activityMonth(year:number,month:number,prayers:PrayerHistory,completions:Completion[],today:string,joined:string){
 const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const key=(y:number,m:number,d:number)=>new Date(Date.UTC(y,m,d)).toISOString().slice(0,10);
 const eligible=(day:string)=>day>=joined&&day<=today;
 const daily=Array.from({length:days},(_,i)=>{const date=key(year,month,i+1);const prior=key(year,month-1,i+1);const priorExists=new Date(`${prior}T12:00:00Z`).getUTCMonth()===((month+11)%12);return {day:i+1,count:date<=today?countPrayers(prayers[date]??{}):0,previous:priorExists&&prior<=today?countPrayers(prayers[prior]??{}):null,date};});
 const elapsed=daily.filter(d=>eligible(d.date)).length,total=daily.reduce((s,d)=>s+d.count,0),possible=elapsed*5;
 const taskEvents=completions.filter(c=>c.kind==='task'&&c.day.startsWith(key(year,month,1).slice(0,7))&&c.day<=today);
 const weeks=Array.from({length:Math.ceil(days/7)},(_,i)=>({name:`Week ${i+1}`,tasks:taskEvents.filter(c=>Math.floor((Number(c.day.slice(-2))-1)/7)===i).length}));
 return {days,daily,total,possible,average:possible?Math.round(total/possible*100):0,taskTotal:taskEvents.length,prayers:prayerNames.map(name=>({name,percent:elapsed?Math.round(daily.filter(d=>eligible(d.date)&&prayers[d.date]?.[name]?.status==='Completed').length/elapsed*100):0})),weeks};
}