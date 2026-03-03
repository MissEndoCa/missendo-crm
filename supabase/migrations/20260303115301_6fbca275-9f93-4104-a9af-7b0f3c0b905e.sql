
-- Create meeting_result enum
CREATE TYPE public.meeting_result AS ENUM ('positive', 'negative', 'pending', 'follow_up');

-- Create marketer_meetings table
CREATE TABLE public.marketer_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  contact_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'hairdresser',
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  result meeting_result DEFAULT 'pending',
  notes TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketer_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all meetings"
  ON public.marketer_meetings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their organization meetings"
  ON public.marketer_meetings FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization meetings"
  ON public.marketer_meetings FOR ALL
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()))
  WITH CHECK (organization_id = get_user_organization(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_marketer_meetings_updated_at
  BEFORE UPDATE ON public.marketer_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
