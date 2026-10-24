import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/fitrah/shell-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/profile")({ head: () => pageHead("Profile", "Personalize your Fitrah experience and appearance."), component: ProfilePage });
