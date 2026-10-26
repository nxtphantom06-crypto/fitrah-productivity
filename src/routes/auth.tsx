import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/components/fitrah/auth-pages';
import { pageHead } from '@/components/fitrah/foundation';
import { safeReturnPath } from '@/lib/auth-flow';
export const Route = createFileRoute('/auth')({ validateSearch: (search: Record<string,unknown>) => ({ redirect: safeReturnPath(search['redirect']) }), head: () => pageHead('Sign in','Return to your faith-aligned day with Fitrah.'), component: () => <AuthPage mode="login"/> });
