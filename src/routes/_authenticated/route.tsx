import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { currentUser } from '@/lib/current-user';
export const Route = createFileRoute('/_authenticated')({
 ssr: false,
 beforeLoad: async ({ location }) => {
  // In the phone app this also works offline, using the sign-in saved on the phone.
  const user = await currentUser();
  if (!user) throw redirect({ to: '/auth', search: { redirect: location.href } });
 },
 component: Outlet,
});
