CREATE TABLE public.activity_completions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, entity_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('task','todo')), completed_at timestamptz NOT NULL DEFAULT now(), day date NOT NULL,
 UNIQUE(user_id,entity_id,kind,day)
);
GRANT SELECT ON public.activity_completions TO authenticated;
GRANT ALL ON public.activity_completions TO service_role;
REVOKE ALL ON public.activity_completions FROM anon;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.activity_completions FROM authenticated;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own completion history" ON public.activity_completions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX completion_owner_day ON public.activity_completions(user_id,day);
CREATE FUNCTION public.record_fitrah_completion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE done boolean; was_done boolean=false; zone text;
BEGIN
 IF TG_TABLE_NAME='tasks' THEN done=NEW.status='Completed'; IF TG_OP='UPDATE' THEN was_done=OLD.status='Completed'; END IF;
 ELSE done=NEW.completed; IF TG_OP='UPDATE' THEN was_done=OLD.completed; END IF; END IF;
 IF done AND NOT was_done THEN
 SELECT timezone INTO zone FROM public.profiles WHERE id=NEW.user_id;
 INSERT INTO public.activity_completions(user_id,entity_id,kind,completed_at,day)
 VALUES(NEW.user_id,NEW.id,CASE WHEN TG_TABLE_NAME='tasks' THEN 'task' ELSE 'todo' END,now(),(now() AT TIME ZONE COALESCE(zone,'UTC'))::date)
 ON CONFLICT(user_id,entity_id,kind,day) DO NOTHING;
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_fitrah_completion() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER record_task_completion AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.record_fitrah_completion();
CREATE TRIGGER record_todo_completion AFTER INSERT OR UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.record_fitrah_completion();
INSERT INTO public.activity_completions(user_id,entity_id,kind,completed_at,day)
 SELECT t.user_id,t.id,'task',t.completed_at,(t.completed_at AT TIME ZONE COALESCE(p.timezone,'UTC'))::date FROM public.tasks t LEFT JOIN public.profiles p ON p.id=t.user_id WHERE t.completed_at IS NOT NULL
 UNION ALL SELECT t.user_id,t.id,'todo',t.completed_at,(t.completed_at AT TIME ZONE COALESCE(p.timezone,'UTC'))::date FROM public.todos t LEFT JOIN public.profiles p ON p.id=t.user_id WHERE t.completed_at IS NOT NULL ON CONFLICT DO NOTHING;
CREATE TABLE public.notification_preferences (
 user_id uuid PRIMARY KEY, settings jsonb NOT NULL DEFAULT '{}'::jsonb, latitude double precision, longitude double precision,
 method text NOT NULL DEFAULT 'MuslimWorldLeague' CHECK(method IN ('MuslimWorldLeague','Karachi','NorthAmerica','UmmAlQura')),
 madhab text NOT NULL DEFAULT 'Shafi' CHECK(madhab IN ('Shafi','Hanafi')), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(latitude BETWEEN -90 AND 90), CHECK(longitude BETWEEN -180 AND 180)
);
GRANT SELECT,INSERT,UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
REVOKE ALL ON public.notification_preferences FROM anon;
REVOKE DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.notification_preferences FROM authenticated;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reminder preferences" ON public.notification_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, token text NOT NULL UNIQUE, enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), last_checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
REVOKE ALL ON public.push_subscriptions FROM anon;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own push devices" ON public.push_subscriptions FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.notification_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
 user_id uuid NOT NULL, event_key text NOT NULL, state text NOT NULL DEFAULT 'sending' CHECK(state IN ('sending','sent','failed')),
 claimed_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, attempts integer NOT NULL DEFAULT 1,
 UNIQUE(subscription_id,event_key)
);
GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT ALL ON public.notification_deliveries TO service_role;
REVOKE ALL ON public.notification_deliveries FROM anon;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.notification_deliveries FROM authenticated;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own delivery history" ON public.notification_deliveries FOR SELECT TO authenticated USING(user_id=auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayers, public.todos, public.tasks, public.subtasks, public.activity_completions, public.notification_preferences;
CREATE FUNCTION public.claim_fitrah_delivery(device uuid, owner_id uuid, event text) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE claimed uuid;
BEGIN
 INSERT INTO public.notification_deliveries(subscription_id,user_id,event_key) VALUES(device,owner_id,event)
 ON CONFLICT(subscription_id,event_key) DO UPDATE SET state='sending',claimed_at=now(),attempts=notification_deliveries.attempts+1
 WHERE notification_deliveries.state<>'sent' AND notification_deliveries.claimed_at<now()-interval '5 minutes' AND notification_deliveries.attempts<3
 RETURNING id INTO claimed; RETURN claimed;
END $$;
REVOKE ALL ON FUNCTION public.claim_fitrah_delivery(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_fitrah_delivery(uuid,uuid,text) TO service_role;