import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/fitrah/tasks";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/tasks")({ head: () => pageHead("Tasks", "Bring purpose to your tasks with Fitrah."), component: TasksPage });
