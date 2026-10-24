import { createFileRoute } from "@tanstack/react-router";
import { PrayersPage } from "@/components/fitrah/shell-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/prayers")({ head: () => pageHead("Prayers", "A space for your five daily prayers in Fitrah."), component: PrayersPage });
