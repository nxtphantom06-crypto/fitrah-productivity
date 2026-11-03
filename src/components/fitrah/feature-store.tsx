import { createContext,useContext,useState,useEffect,useRef,type ReactNode } from 'react';
import { useSuspenseQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { dateInTimezone,countPrayers,moveItem,canEditPrayer,type PrayerName,type PrayerRecord,type Todo,type Task } from '@/lib/feature-model';
import { featureQuery } from '@/lib/feature-queries';
import { writePrayer,writeTodo,removeTodo,reorderTodos,writeTask,removeTask } from '@/lib/features.functions';
import { savePreferences as savePreferencesFn } from '@/lib/notifications.functions';
import { defaultPreferences,type Preferences } from '@/lib/reminder-model';
import type { Completion } from '@/lib/activity-analytics';
import type { SyncOp } from '@/lib/sync-model';
import { isNativeBuild } from '@/lib/native/client';
import { configureSync,recordChange,watchConnection } from '@/lib/native/sync';
import { useAuth } from './auth-store';
type Store={today:string;busy:boolean;timezone:string;joined:string;completions:Completion[];preferences:Preferences;prayers:Record<string,Partial<Record<PrayerName,PrayerRecord>>>;todos:Todo[];tasks:Task[];setPrayer:(date:string,name:PrayerName,patch:Partial<PrayerRecord>)=>Promise<boolean>;saveTodo:(todo:Todo)=>Promise<boolean>;deleteTodo:(id:string)=>Promise<boolean>;moveTodo:(id:string,delta:number)=>Promise<boolean>;saveTask:(task:Task)=>Promise<boolean>;deleteTask:(id:string)=>Promise<boolean>;savePreferences:(preferences:Preferences)=>Promise<boolean>};
const FeatureContext=createContext<Store|null>(null);
const opId=()=>crypto.randomUUID();
export function FeatureProvider({children}:{children:ReactNode}) {
 const {user}=useAuth();
 if(user) return <SavedFeatures userId={user.id}>{children}</SavedFeatures>;
 const unavailable=async()=>false;
 return <FeatureContext.Provider value={{today:'',busy:false,timezone:'UTC',joined:'',completions:[],preferences:defaultPreferences,prayers:{},todos:[],tasks:[],setPrayer:unavailable,saveTodo:unavailable,deleteTodo:unavailable,moveTodo:unavailable,saveTask:unavailable,deleteTask:unavailable,savePreferences:unavailable}}>{children}</FeatureContext.Provider>;
}
function SavedFeatures({children,userId}:{children:ReactNode;userId:string}) {
 const queryClient=useQueryClient();const options=featureQuery(userId);const {data}=useSuspenseQuery(options);
 const [today,setToday]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const prayer=useServerFn(writePrayer),todo=useServerFn(writeTodo),deleteTodo=useServerFn(removeTodo),reorder=useServerFn(reorderTodos),task=useServerFn(writeTask),deleteTask=useServerFn(removeTask),preferences=useServerFn(savePreferencesFn);
 useEffect(()=>{const update=()=>setToday(dateInTimezone(new Date(),data.timezone));update();const timer=setInterval(update,30000);return()=>clearInterval(timer);},[data.timezone]);
 useEffect(()=>{if(!isNativeBuild)return;configureSync(queryClient);return watchConnection(userId);},[queryClient,userId]);
 // Phone app: keep on-device reminders in step with the latest prayers, tasks and settings.
 useEffect(()=>{if(!isNativeBuild)return;const timer=setTimeout(()=>{void import('@/lib/native/reminders').then(m=>m.syncLocalReminders(data));},800);return()=>clearTimeout(timer);},[data]);
 async function mutate(action:()=>Promise<unknown>){if(lock.current)return false;lock.current=true;setBusy(true);setError('');try{await action();await queryClient.invalidateQueries({queryKey:options.queryKey,refetchType:'none'});await queryClient.fetchQuery(options);return true;}catch{setError('Your change could not be saved. Check your connection and try again.');return false;}finally{lock.current=false;setBusy(false);}}
 // Phone app: every change is saved on the phone first and sent when a connection is available.
 const change=(op:SyncOp,online:()=>Promise<unknown>)=>isNativeBuild?recordChange(userId,op):mutate(online);
 return <FeatureContext.Provider value={{...data,today,busy,
  setPrayer:(date,name,patch)=>canEditPrayer(date,today)?change({id:opId(),kind:'prayer',date,name,patch},()=>prayer({data:{date,name,patch}})):Promise.resolve(false),
  saveTodo:value=>change({id:opId(),kind:'todo',todo:value},()=>todo({data:value})),
  deleteTodo:id=>change({id:opId(),kind:'deleteTodo',todoId:id},()=>deleteTodo({data:{id}})),
  moveTodo:(id,delta)=>{const ids=moveItem(data.todos,id,delta).map(t=>t.id);return change({id:opId(),kind:'reorder',ids},()=>reorder({data:{ids}}));},
  saveTask:value=>change({id:opId(),kind:'task',task:value},()=>task({data:value})),
  deleteTask:id=>change({id:opId(),kind:'deleteTask',taskId:id},()=>deleteTask({data:{id}})),
  savePreferences:value=>change({id:opId(),kind:'preferences',preferences:value},()=>preferences({data:value})),
 }}>{busy&&<div role="status" className="text-center text-sm text-muted-foreground py-2">Saving…</div>}{error&&<div role="alert" className="text-center text-sm text-destructive py-2">{error}</div>}{children}</FeatureContext.Provider>;
}
export function useFeatures(){const value=useContext(FeatureContext);if(!value)throw new Error('FeatureProvider is required');return value;}
export function usePrayerCount(){const {today,prayers}=useFeatures();return countPrayers(prayers[today]??{});}
