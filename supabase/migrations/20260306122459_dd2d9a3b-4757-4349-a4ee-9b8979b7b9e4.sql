-- Restore notes from audit_logs to marketer_meetings by matching on phone
-- Use a CTE to get distinct notes per phone from deleted patient records
WITH deleted_notes AS (
  SELECT DISTINCT ON (old_data->>'phone')
    old_data->>'phone' as phone,
    old_data->>'notes' as notes
  FROM audit_logs
  WHERE table_name = 'patients' 
    AND action = 'DELETE' 
    AND old_data->>'last_name' IN ('A', 'AA', 'A/B', 'B', 'B/C', 'C')
    AND old_data->>'notes' IS NOT NULL 
    AND old_data->>'notes' != ''
    AND old_data->>'phone' IS NOT NULL
  ORDER BY old_data->>'phone', created_at DESC
)
UPDATE public.marketer_meetings m
SET notes = dn.notes
FROM deleted_notes dn
WHERE m.phone = dn.phone
  AND (m.notes IS NULL OR m.notes = '');