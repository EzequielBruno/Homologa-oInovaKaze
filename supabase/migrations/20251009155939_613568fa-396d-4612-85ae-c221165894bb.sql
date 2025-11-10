-- Fix function search path for log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_activity_log (user_id, action, description, changed_by, metadata)
    VALUES (
      NEW.id,
      'profile_updated',
      'Profile updated',
      auth.uid(),
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;