-- Update organizations table for proper API fields
ALTER TABLE public.organizations 
  DROP COLUMN IF EXISTS ad_api_key,
  DROP COLUMN IF EXISTS whatsapp_api_key;

-- Add proper Facebook Ads API fields
ALTER TABLE public.organizations
  ADD COLUMN fb_page_access_token TEXT,
  ADD COLUMN fb_ad_account_id TEXT;

-- Add proper WhatsApp Business API fields
ALTER TABLE public.organizations
  ADD COLUMN wa_phone_number_id TEXT,
  ADD COLUMN wa_access_token TEXT;