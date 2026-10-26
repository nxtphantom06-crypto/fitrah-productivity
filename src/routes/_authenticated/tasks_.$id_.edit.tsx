import {createFileRoute} from '@tanstack/react-router';
import {TaskEditor} from '@/components/fitrah/tasks';
import {pageHead} from '@/components/fitrah/foundation';
export const Route=createFileRoute('/_authenticated/tasks_/$id_/edit')({head:()=>pageHead('Edit task','Refine your task and its small steps in Fitrah.'),component:Page});
function Page(){const {id}=Route.useParams();return <TaskEditor id={id}/>;}
