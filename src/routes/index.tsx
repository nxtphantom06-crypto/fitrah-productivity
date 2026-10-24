import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fitrah/dashboard";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/")({ head: () => pageHead("Home", "Your prayers, intentions and daily progress, together in Fitrah."), component: Dashboard });
