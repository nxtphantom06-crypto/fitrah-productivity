import { loadFeatures } from '@/lib/feature-queries';
import { FitrahError, FitrahNotFound } from '@/components/fitrah/feedback-pages';
import {createFileRoute} from '@tanstack/react-router';
import {TaskEditor} from '@/components/fitrah/tasks';
import {pageHead} from '@/components/fitrah/foundation';
export const Route=createFileRoute('/_authenticated/tasks_/new')({loader:loadFeatures,errorComponent:FitrahError,notFoundComponent:FitrahNotFound,head:()=>pageHead('New task','Create a purposeful task in Fitrah.'),component:TaskEditor});
