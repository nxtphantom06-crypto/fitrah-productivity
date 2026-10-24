import {describe,expect,it} from 'vitest';
import {countPrayers,todoMatches,subtaskProgress,moveItem,completeTask,type Todo,type Task} from '@/lib/feature-model';
const todo:Todo={id:'one',title:'Read',priority:'High',due:'2026-10-24',time:'',completed:false};
const task:Task={id:'one',title:'Study',description:'',priority:'High',due:'',category:'Study',project:'',status:'Not Started',subtasks:[{id:'a',title:'Read',completed:true},{id:'b',title:'Write',completed:false}],created:'',updated:''};
describe('Feature rules',()=>{
 it('counts exactly the five completed prayers, not pending or missed',()=>expect(countPrayers({Fajr:{status:'Completed',note:''},Dhuhr:{status:'Completed',note:''},Asr:{status:'Pending',note:''},Maghrib:{status:'Missed',note:''},Isha:{status:'Completed',note:''}})).toBe(3));
 it('today includes undated and today’s incomplete to-dos',()=>{expect(todoMatches(todo,'Today','2026-10-24')).toBe(true);expect(todoMatches({...todo,due:''},'Today','2026-10-24')).toBe(true);expect(todoMatches({...todo,completed:true},'Today','2026-10-24')).toBe(false);});
 it('upcoming only includes future incomplete to-dos',()=>{expect(todoMatches(todo,'Upcoming','2026-10-23')).toBe(true);expect(todoMatches(todo,'Upcoming','2026-10-24')).toBe(false);expect(todoMatches({...todo,completed:true},'Upcoming','2026-10-23')).toBe(false);});
 it('completed filter only includes completed to-dos',()=>{expect(todoMatches(todo,'Completed','2026-10-24')).toBe(false);expect(todoMatches({...todo,completed:true},'Completed','2026-10-24')).toBe(true);});
 it('calculates concrete subtask X/Y and percentage',()=>expect(subtaskProgress(task)).toEqual({done:1,total:2,percent:50}));
 it('handles a task without subtasks',()=>expect(subtaskProgress({...task,subtasks:[]})).toEqual({done:0,total:0,percent:0}));
 it('reorders one step and never beyond list boundaries',()=>{expect(moveItem([{id:'a'},{id:'b'}],'b',-1).map(i=>i.id)).toEqual(['b','a']);expect(moveItem([{id:'a'},{id:'b'}],'a',-1).map(i=>i.id)).toEqual(['a','b']);});
 it('completing a task checks all its subtasks',()=>{const result=completeTask(task);expect(result.status).toBe('Completed');expect(subtaskProgress(result)).toEqual({done:2,total:2,percent:100});});
});
