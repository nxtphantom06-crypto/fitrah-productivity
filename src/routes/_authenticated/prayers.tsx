import { loadFeatures } from '@/lib/feature-queries';
import { FitrahError, FitrahNotFound } from '@/components/fitrah/feedback-pages';
import { createFileRoute } from "@tanstack/react-router";
import { PrayersPage } from "@/components/fitrah/prayer-tracker";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/_authenticated/prayers")({ loader: loadFeatures, errorComponent: FitrahError, notFoundComponent: FitrahNotFound, head: () => pageHead("Prayers", "A space for your five daily prayers in Fitrah."), component: PrayersPage });
