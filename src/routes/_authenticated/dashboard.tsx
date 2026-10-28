import { loadFeatures } from '@/lib/feature-queries';
import { FitrahError, FitrahNotFound } from '@/components/fitrah/feedback-pages';
import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fitrah/dashboard";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/_authenticated/dashboard")({ loader: loadFeatures, errorComponent: FitrahError, notFoundComponent: FitrahNotFound, head: () => pageHead("Dashboard", "Start your day with faith and intention in Fitrah."), component: Dashboard });
