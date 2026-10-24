import { createContext,useContext,useState,useEffect,type ReactNode } from 'react';
import { dateKey,countPrayers,moveItem,canEditPrayer,type PrayerName,type PrayerRecord,type Todo,type Task } from '@/lib/feature-model';
type Store={today:string;prayers:Record<string,Partial<Record<PrayerName,PrayerRecord>>>;todos:Todo[];tasks:Task[];setPrayer:(date:string,name:PrayerName,patch:Partial<PrayerRecord>)=>void;saveTodo:(todo:Todo)=>void;deleteTodo:(id:string)=>void;moveTodo:(id:string,delta:number)=>void;saveTask:(task:Task)=>void;deleteTask:(id:string)=>void};
const FeatureContext=createContext<Store|null>(null);
export function FeatureProvider({children}:{children:ReactNode}) {
 const [today,setToday]=useState('');const [prayers,setPrayers]=useState<Store['prayers']>({});const [todos,setTodos]=useState<Todo[]>([]);const [tasks,setTasks]=useState<Task[]>([]);
 useEffect(()=>{const update=()=>setToday(dateKey(new Date()));update();const timer=setInterval(update,30000);return()=>clearInterval(timer);},[]);
 const setPrayer:Store['setPrayer']=(date,name,patch)=>{if(!canEditPrayer(date,today))return;setPrayers(prev=>({...prev,[date]:{...prev[date],[name]:{status:'Pending',note:'',...prev[date]?.[name],...patch}}}));};
 const saveTodo=(todo:Todo)=>setTodos(prev=>prev.some(t=>t.id===todo.id)?prev.map(t=>t.id===todo.id?todo:t):[...prev,todo]);
 const saveTask=(task:Task)=>setTasks(prev=>prev.some(t=>t.id===task.id)?prev.map(t=>t.id===task.id?task:t):[...prev,task]);
 return <FeatureContext.Provider value={{today,prayers,todos,tasks,setPrayer,saveTodo,deleteTodo:id=>setTodos(prev=>prev.filter(t=>t.id!==id)),moveTodo:(id,delta)=>setTodos(prev=>moveItem(prev,id,delta)),saveTask,deleteTask:id=>setTasks(prev=>prev.filter(t=>t.id!==id))}}>{children}</FeatureContext.Provider>;
}
export function useFeatures(){const value=useContext(FeatureContext);if(!value)throw new Error('FeatureProvider is required');return value;}
export function usePrayerCount(){const {today,prayers}=useFeatures();return countPrayers(prayers[today]??{});}
