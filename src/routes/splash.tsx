import { createFileRoute } from "@tanstack/react-router";
import { SplashPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/splash")({ head: () => pageHead("Splash", "Welcome to Fitrah, a daily space for faith and purpose."), component: SplashPage });
