import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/fitrah/auth-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/onboarding")({ head: () => pageHead("Welcome", "Discover your rhythm with daily prayer and purposeful intentions."), component: OnboardingPage });
