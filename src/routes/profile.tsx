import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/fitrah/profile";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/profile")({ head: () => pageHead("Profile", "Personalize your Fitrah experience and appearance."), component: ProfilePage });
