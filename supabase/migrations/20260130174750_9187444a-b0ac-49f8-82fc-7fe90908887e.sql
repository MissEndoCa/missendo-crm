-- Fix audit trigger function: avoid using JSONB operators on row types (e.g. NEW ? 'organization_id')
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_org_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Get user email from profiles (best-effort)
    SELECT email INTO v_user_email
    FROM public.profiles
    WHERE id = v_user_id;

    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;

        BEGIN
          v_record_id := (v_old_data->>'id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_record_id := NULL;
        END;

        BEGIN
          v_org_id := (v_old_data->>'organization_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_org_id := NULL;
        END;

    ELSIF TG_OP = 'INSERT' THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);

        BEGIN
          v_record_id := (v_new_data->>'id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_record_id := NULL;
        END;

        BEGIN
          v_org_id := (v_new_data->>'organization_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_org_id := NULL;
        END;

    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);

        BEGIN
          v_record_id := (v_new_data->>'id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_record_id := NULL;
        END;

        BEGIN
          v_org_id := (v_new_data->>'organization_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_org_id := NULL;
        END;
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id,
        user_email,
        organization_id
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        v_user_id,
        v_user_email,
        v_org_id
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;