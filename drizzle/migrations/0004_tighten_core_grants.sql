REVOKE ALL ON public.prayers, public.todos, public.tasks, public.subtasks FROM anon;
REVOKE ALL ON public.prayers, public.todos, public.tasks, public.subtasks FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prayers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos, public.tasks, public.subtasks TO authenticated;
REVOKE ALL ON FUNCTION public.validate_prayer_day(), public.feature_timestamps() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.save_fitrah_task(jsonb) IS 'Owner-scoped atomic task and subtask save; SECURITY INVOKER retains RLS.';