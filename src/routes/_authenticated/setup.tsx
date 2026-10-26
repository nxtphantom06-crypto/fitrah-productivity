import { createFileRoute } from "@tanstack/react-router";
import { SetupPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/_authenticated/setup")({ head: () => pageHead("Profile setup", "Set your name, timezone and prayer preferences in Fitrah."), component: SetupPage });
