import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/fitrah/shell-pages";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/todos")({ head: () => pageHead("To-dos", "Make room for your daily intentions with Fitrah."), component: () => <TasksPage todos /> });
