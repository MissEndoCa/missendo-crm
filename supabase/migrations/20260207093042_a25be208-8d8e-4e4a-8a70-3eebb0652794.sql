-- Add columns for selected Facebook campaigns and ad sets
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS fb_selected_campaigns jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fb_selected_adsets jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.fb_selected_campaigns IS 'Array of selected Facebook campaign IDs with names [{id, name}]';
COMMENT ON COLUMN public.organizations.fb_selected_adsets IS 'Array of selected Facebook ad set IDs with names [{id, name}]';