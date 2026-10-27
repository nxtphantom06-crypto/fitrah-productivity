CREATE TABLE public.prayers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, date date NOT NULL,
 name text NOT NULL CHECK (name IN ('Fajr','Dhuhr','Asr','Maghrib','Isha')),
 status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Missed')),
 note text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,date,name)
);
GRANT SELECT, INSERT, UPDATE ON public.prayers TO authenticated;
GRANT ALL ON public.prayers TO service_role;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own prayers" ON public.prayers FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Insert own prayers" ON public.prayers FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Update own prayers" ON public.prayers FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE FUNCTION public.validate_prayer_day() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE zone text;
BEGIN
 SELECT timezone INTO zone FROM public.profiles WHERE id=NEW.user_id;
 IF NEW.date <> (now() AT TIME ZONE COALESCE(zone,'UTC'))::date OR (TG_OP='UPDATE' AND (OLD.date<>NEW.date OR OLD.user_id<>NEW.user_id OR OLD.name<>NEW.name)) THEN
 RAISE EXCEPTION 'Only today''s prayers can be changed';
 END IF;
 NEW.updated_at=now(); RETURN NEW;
END $$;
CREATE TRIGGER validate_prayer_day BEFORE INSERT OR UPDATE ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.validate_prayer_day();
CREATE TABLE public.todos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL CHECK (length(trim(title))>0),
 priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')), due date, due_time time,
 completed boolean NOT NULL DEFAULT false, completed_at timestamptz, position integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own todos" ON public.todos FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE INDEX todos_owner_position ON public.todos(user_id,position,created_at);
CREATE TABLE public.tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL CHECK (length(trim(title))>0),
 description text NOT NULL DEFAULT '', priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')), due date,
 category text NOT NULL DEFAULT 'Personal' CHECK (category IN ('Personal','Work','Study')), project text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','In Progress','Completed')),
 completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tasks" ON public.tasks FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE INDEX tasks_owner_created ON public.tasks(user_id,created_at);
CREATE TABLE public.subtasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
 user_id uuid NOT NULL, title text NOT NULL CHECK (length(trim(title))>0), completed boolean NOT NULL DEFAULT false, position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtasks TO authenticated;
GRANT ALL ON public.subtasks TO service_role;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subtasks" ON public.subtasks FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.tasks WHERE id=task_id AND user_id=auth.uid()));
CREATE INDEX subtasks_task_position ON public.subtasks(task_id,position);
CREATE FUNCTION public.feature_timestamps() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE done boolean;
BEGIN
 IF TG_OP='UPDATE' AND NEW.user_id<>OLD.user_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
 NEW.updated_at=now();
 IF TG_TABLE_NAME='todos' THEN done=NEW.completed; ELSE done=NEW.status='Completed'; END IF;
 IF done THEN NEW.completed_at=COALESCE(NEW.completed_at,now()); ELSE NEW.completed_at=NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER todo_timestamps BEFORE INSERT OR UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.feature_timestamps();
CREATE TRIGGER task_timestamps BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.feature_timestamps();
CREATE FUNCTION public.save_fitrah_task(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE task_uuid uuid=(payload->>'id')::uuid; step jsonb; step_position integer=0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 INSERT INTO public.tasks(id,user_id,title,description,priority,due,category,project,status)
 VALUES(task_uuid,auth.uid(),payload->>'title',payload->>'description',payload->>'priority',NULLIF(payload->>'due','')::date,payload->>'category',payload->>'project',payload->>'status')
 ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,priority=EXCLUDED.priority,due=EXCLUDED.due,category=EXCLUDED.category,project=EXCLUDED.project,status=EXCLUDED.status;
 DELETE FROM public.subtasks WHERE task_id=task_uuid AND user_id=auth.uid();
 FOR step IN SELECT value FROM jsonb_array_elements(payload->'subtasks') LOOP
 INSERT INTO public.subtasks(id,task_id,user_id,title,completed,position) VALUES((step->>'id')::uuid,task_uuid,auth.uid(),step->>'title',CASE WHEN payload->>'status'='Completed' THEN true ELSE (step->>'completed')::boolean END,step_position);
 step_position=step_position+1;
 END LOOP;
 RETURN task_uuid;
END $$;
REVOKE ALL ON FUNCTION public.save_fitrah_task(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_fitrah_task(jsonb) TO authenticated;
CREATE FUNCTION public.reorder_fitrah_todos(ids uuid[]) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 UPDATE public.todos t SET position=o.ordinality-1 FROM unnest(ids) WITH ORDINALITY o(id,ordinality) WHERE t.id=o.id AND t.user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.reorder_fitrah_todos(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reorder_fitrah_todos(uuid[]) TO authenticated;