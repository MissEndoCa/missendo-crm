-- Add Facebook OAuth columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS fb_page_id text,
ADD COLUMN IF NOT EXISTS fb_page_name text,
ADD COLUMN IF NOT EXISTS fb_connected_at timestamptz,
ADD COLUMN IF NOT EXISTS fb_user_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.fb_page_id IS 'Facebook Page ID connected via OAuth';
COMMENT ON COLUMN public.organizations.fb_page_name IS 'Facebook Page name for display';
COMMENT ON COLUMN public.organizations.fb_connected_at IS 'When Facebook was connected';
COMMENT ON COLUMN public.organizations.fb_user_id IS 'Facebook user ID who connected the page';