import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { FitrahError, FitrahNotFound } from '@/components/fitrah/feedback-pages';

export const getRouter = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

  const router = createRouter({
    routeTree,
    defaultErrorComponent: FitrahError,
    defaultNotFoundComponent: FitrahNotFound,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
