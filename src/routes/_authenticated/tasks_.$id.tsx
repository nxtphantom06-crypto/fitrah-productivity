import {createFileRoute} from '@tanstack/react-router';
import {TaskDetail} from '@/components/fitrah/tasks';
import {pageHead} from '@/components/fitrah/foundation';
export const Route=createFileRoute('/_authenticated/tasks_/$id')({head:()=>pageHead('Task details','Follow your small steps and task progress in Fitrah.'),component:Page});
function Page(){const {id}=Route.useParams();return <TaskDetail id={id}/>;}
