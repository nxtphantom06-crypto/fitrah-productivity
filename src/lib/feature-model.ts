export const prayerNames = ['Fajr','Dhuhr','Asr','Maghrib','Isha'] as const;
export type PrayerName = typeof prayerNames[number];
export type PrayerRecord = { status: 'Pending'|'Completed'|'Missed'; note: string };
export type Priority = 'Low'|'Medium'|'High';
export type Todo = { id: string; title: string; priority: Priority; due: string; time: string; completed: boolean };
export type Task = { id: string; title: string; description: string; priority: Priority; due: string; category: 'Personal'|'Work'|'Study'; project: string; status: 'Not Started'|'In Progress'|'Completed'; subtasks: {id:string; title:string; completed:boolean}[]; created: string; updated: string };
export function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function countPrayers(records: Partial<Record<PrayerName,PrayerRecord>>) { return prayerNames.filter(name=>records[name]?.status==='Completed').length; }
export function todoMatches(todo:Todo,filter:string,today:string) { if(filter==='Completed')return todo.completed;if(filter==='Today')return !todo.completed&&(!todo.due||todo.due===today);if(filter==='Upcoming')return !todo.completed&&todo.due>today;return true; }
export function subtaskProgress(task: Pick<Task,'subtasks'>) { const total=task.subtasks.length, done=task.subtasks.filter(s=>s.completed).length;return {total,done,percent:total?Math.round(done/total*100):0}; }
export function moveItem<T extends {id:string}>(items:T[],id:string,delta:number) { const index=items.findIndex(item=>item.id===id),target=index+delta;if(index<0||target<0||target>=items.length)return items;const next=[...items];const item=next[index];if(!item)return items;next.splice(index,1);next.splice(target,0,item);return next; }
export function completeTask(task:Task):Task { return {...task,status:'Completed',subtasks:task.subtasks.map(s=>({...s,completed:true}))}; }
