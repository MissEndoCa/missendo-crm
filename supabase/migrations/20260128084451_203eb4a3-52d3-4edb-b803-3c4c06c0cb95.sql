-- Create a function to notify admins when a new lead is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_record RECORD;
    lead_full_name TEXT;
BEGIN
    -- Get lead full name
    lead_full_name := NEW.first_name || ' ' || NEW.last_name;
    
    -- Notify super admins
    FOR admin_record IN 
        SELECT DISTINCT p.id, p.organization_id
        FROM profiles p
        INNER JOIN user_roles ur ON ur.user_id = p.id
        WHERE ur.role = 'super_admin'
        AND p.is_active = true
    LOOP
        INSERT INTO notifications (
            user_id,
            organization_id,
            title,
            message,
            type,
            is_read
        ) VALUES (
            admin_record.id,
            NEW.organization_id,
            'Yeni Lead: ' || lead_full_name,
            'Yeni bir lead eklendi: ' || lead_full_name || ' (' || COALESCE(NEW.phone, 'Telefon yok') || ')',
            'lead',
            false
        );
    END LOOP;
    
    -- Notify clinic admins of the same organization
    FOR admin_record IN 
        SELECT DISTINCT p.id
        FROM profiles p
        INNER JOIN user_roles ur ON ur.user_id = p.id
        WHERE ur.role = 'clinic_admin'
        AND p.organization_id = NEW.organization_id
        AND p.is_active = true
    LOOP
        INSERT INTO notifications (
            user_id,
            organization_id,
            title,
            message,
            type,
            is_read
        ) VALUES (
            admin_record.id,
            NEW.organization_id,
            'Yeni Lead: ' || lead_full_name,
            'Yeni bir lead eklendi: ' || lead_full_name || ' (' || COALESCE(NEW.phone, 'Telefon yok') || ')',
            'lead',
            false
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS trigger_notify_admins_on_new_lead ON leads;
CREATE TRIGGER trigger_notify_admins_on_new_lead
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_on_new_lead();