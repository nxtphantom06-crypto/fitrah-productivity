import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/login")({ head: () => pageHead("Welcome back", "Return to your Fitrah daily rhythm."), component: () => <AuthPage mode="login" /> });
