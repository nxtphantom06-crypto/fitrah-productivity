import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock('@/lib/pwa/register', () => ({ initializePwa: vi.fn() }));

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it.each(['/dashboard', '/prayers', '/tasks', '/todos', '/progress', '/profile', '/splash', '/onboarding', '/signup', '/login', '/forgot-password', '/setup'])('matches %s', (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes(path).at(-1)?.routeId).toBe(path);
  });
  it.each([
    ['/tasks/new', '/tasks_/new'],
    ['/tasks/example', '/tasks_/$id'],
    ['/tasks/example/edit', '/tasks_/$id_/edit'],
  ])('renders independent task content for %s', (path, routeId) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(path);
    expect(matches.at(-1)?.routeId).toBe(routeId);
    expect(matches.some(match => match.routeId === '/tasks')).toBe(false);
  });
});
