import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/fitrah/shell-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/tasks")({ head: () => pageHead("Tasks", "Bring purpose to your tasks with Fitrah."), component: TasksPage });
