CREATE OR REPLACE FUNCTION public.validate_prayer_day() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE zone text; today date;
BEGIN
 SELECT timezone INTO zone FROM public.profiles WHERE id=NEW.user_id;
 today=(now() AT TIME ZONE COALESCE(zone,'UTC'))::date;
 -- Today, or up to 7 earlier days so a phone that was offline can still sync what it recorded.
 IF NEW.date > today OR NEW.date < today - 7 OR (TG_OP='UPDATE' AND (OLD.date<>NEW.date OR OLD.user_id<>NEW.user_id OR OLD.name<>NEW.name)) THEN
 RAISE EXCEPTION 'Only today''s prayers can be changed';
 END IF;
 NEW.updated_at=now(); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_prayer_day() FROM PUBLIC, anon, authenticated;