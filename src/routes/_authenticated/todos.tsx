import { createFileRoute } from "@tanstack/react-router";
import { TodosPage } from "@/components/fitrah/todos";
import { pageHead } from "@/components/fitrah/foundation";
export const Route = createFileRoute("/_authenticated/todos")({ head: () => pageHead("To-dos", "Make room for your daily intentions with Fitrah."), component: TodosPage });
