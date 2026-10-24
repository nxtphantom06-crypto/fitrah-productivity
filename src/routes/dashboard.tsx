import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fitrah/dashboard";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/dashboard")({ head: () => pageHead("Dashboard", "Start your day with faith and intention in Fitrah."), component: Dashboard });
