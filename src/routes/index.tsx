import { createFileRoute } from "@tanstack/react-router";
import { AuthEntry } from "@/components/fitrah/auth-entry";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/")({ head: () => pageHead("Home", "Your prayers, intentions and daily progress, together in Fitrah."), component: AuthEntry });
