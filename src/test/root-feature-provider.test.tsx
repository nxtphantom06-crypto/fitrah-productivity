import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFeatures } from '@/components/fitrah/feature-store';

vi.mock('@/components/fitrah/auth-store', () => ({ AuthProvider: ({ children }: { children: import('react').ReactNode }) => children, useAuth: () => ({ user: null }) }));
vi.mock('@/lib/pwa/register', () => ({ initializePwa: vi.fn() }));
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, Outlet: FeatureConsumer };
});

import { Route } from '@/routes/__root';

function FeatureConsumer() {
  const { todos, saveTodo } = useFeatures();
  return <>
    <output aria-label="Todo count">{todos.length}</output>
    <button onClick={() => saveTodo({ id: 'root-test', title: 'Read a chapter', priority: 'Medium', due: '', time: '', completed: false })}>Add todo</button>
  </>;
}

describe('Root feature provider', () => {
  it('provides shared mutable feature state to the route outlet', () => {
    vi.spyOn(Route, 'useRouteContext').mockReturnValue({ queryClient: new QueryClient() });
    const Root = Route.options.component;
    if (typeof Root !== 'function') throw new Error('Root route component is required');
    render(<Root />);
    expect(screen.getByLabelText('Todo count')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'Add todo' }));
    expect(screen.getByLabelText('Todo count')).toHaveTextContent('1');
    vi.restoreAllMocks();
  });
});