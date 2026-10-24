import {createFileRoute} from '@tanstack/react-router';
import {TaskEditor} from '@/components/fitrah/tasks';
import {pageHead} from '@/components/fitrah/foundation';
export const Route=createFileRoute('/tasks_/new')({head:()=>pageHead('New task','Create a purposeful task in Fitrah.'),component:TaskEditor});
