import { createContext,useContext,useState,useEffect,useRef,type ReactNode } from 'react';
import { useSuspenseQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { dateInTimezone,countPrayers,moveItem,canEditPrayer,type PrayerName,type PrayerRecord,type Todo,type Task } from '@/lib/feature-model';
import { featureQuery } from '@/lib/feature-queries';
import { writePrayer,writeTodo,removeTodo,reorderTodos,writeTask,removeTask } from '@/lib/features.functions';
import { useAuth } from './auth-store';
type Store={today:string;busy:boolean;prayers:Record<string,Partial<Record<PrayerName,PrayerRecord>>>;todos:Todo[];tasks:Task[];setPrayer:(date:string,name:PrayerName,patch:Partial<PrayerRecord>)=>Promise<boolean>;saveTodo:(todo:Todo)=>Promise<boolean>;deleteTodo:(id:string)=>Promise<boolean>;moveTodo:(id:string,delta:number)=>Promise<boolean>;saveTask:(task:Task)=>Promise<boolean>;deleteTask:(id:string)=>Promise<boolean>};
const FeatureContext=createContext<Store|null>(null);
export function FeatureProvider({children}:{children:ReactNode}) {
 const {user}=useAuth();
 if(user) return <SavedFeatures userId={user.id}>{children}</SavedFeatures>;
 const unavailable=async()=>false;
 return <FeatureContext.Provider value={{today:'',busy:false,prayers:{},todos:[],tasks:[],setPrayer:unavailable,saveTodo:unavailable,deleteTodo:unavailable,moveTodo:unavailable,saveTask:unavailable,deleteTask:unavailable}}>{children}</FeatureContext.Provider>;
}
function SavedFeatures({children,userId}:{children:ReactNode;userId:string}) {
 const queryClient=useQueryClient();const options=featureQuery(userId);const {data}=useSuspenseQuery(options);
 const [today,setToday]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const prayer=useServerFn(writePrayer),todo=useServerFn(writeTodo),deleteTodo=useServerFn(removeTodo),reorder=useServerFn(reorderTodos),task=useServerFn(writeTask),deleteTask=useServerFn(removeTask);
 useEffect(()=>{const update=()=>setToday(dateInTimezone(new Date(),data.timezone));update();const timer=setInterval(update,30000);return()=>clearInterval(timer);},[data.timezone]);
 async function mutate(action:()=>Promise<unknown>){if(lock.current)return false;lock.current=true;setBusy(true);setError('');try{await action();await queryClient.invalidateQueries({queryKey:options.queryKey,refetchType:'none'});await queryClient.fetchQuery(options);return true;}catch{setError('Your change could not be saved. Check your connection and try again.');return false;}finally{lock.current=false;setBusy(false);}}
 return <FeatureContext.Provider value={{...data,today,busy,setPrayer:(date,name,patch)=>canEditPrayer(date,today)?mutate(()=>prayer({data:{date,name,patch}})):Promise.resolve(false),saveTodo:value=>mutate(()=>todo({data:value})),deleteTodo:id=>mutate(()=>deleteTodo({data:{id}})),moveTodo:(id,delta)=>mutate(()=>reorder({data:{ids:moveItem(data.todos,id,delta).map(t=>t.id)}})),saveTask:value=>mutate(()=>task({data:value})),deleteTask:id=>mutate(()=>deleteTask({data:{id}}))}}>{busy&&<div role="status" className="text-center text-sm text-muted-foreground py-2">Saving…</div>}{error&&<div role="alert" className="text-center text-sm text-destructive py-2">{error}</div>}{children}</FeatureContext.Provider>;
}
export function useFeatures(){const value=useContext(FeatureContext);if(!value)throw new Error('FeatureProvider is required');return value;}
export function usePrayerCount(){const {today,prayers}=useFeatures();return countPrayers(prayers[today]??{});}
