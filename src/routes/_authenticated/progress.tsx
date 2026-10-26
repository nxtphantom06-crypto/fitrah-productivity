import { createFileRoute } from "@tanstack/react-router";
import { ProgressPage } from "@/components/fitrah/progress";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/_authenticated/progress")({ head: () => pageHead("Progress", "Your faith-aligned consistency and progress in Fitrah."), component: ProgressPage });
