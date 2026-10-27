import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/forgot-password")({ head: () => pageHead("Forgot password", "Request help returning to your Fitrah account."), component: () => <AuthPage mode="forgot" /> });
