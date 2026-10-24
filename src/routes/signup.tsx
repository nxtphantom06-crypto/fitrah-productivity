import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/signup")({ head: () => pageHead("Create account", "Begin your Fitrah journey with faith and intention."), component: () => <AuthPage mode="signup" /> });
