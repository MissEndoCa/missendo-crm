-- =============================================
-- MAILING SYSTEM TABLES
-- =============================================

-- Email Templates Table
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contact Groups Table (for grouping leads/patients)
CREATE TABLE public.contact_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Group Membership (many-to-many)
CREATE TABLE public.lead_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    added_by UUID REFERENCES public.profiles(id),
    UNIQUE(group_id, lead_id)
);

-- Patient Group Membership (many-to-many)
CREATE TABLE public.patient_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    added_by UUID REFERENCES public.profiles(id),
    UNIQUE(group_id, patient_id)
);

-- Email Campaigns Table
CREATE TABLE public.email_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id UUID REFERENCES public.email_templates(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Recipients Table
CREATE TABLE public.campaign_recipients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('lead', 'patient')),
    recipient_id UUID,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened')),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Email Templates
CREATE POLICY "Users can view templates in their organization"
ON public.email_templates FOR SELECT
USING (
    has_role(auth.uid(), 'super_admin') OR
    organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Admins can manage templates"
ON public.email_templates FOR ALL
USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'clinic_admin') AND organization_id = get_user_organization(auth.uid()))
);

-- Contact Groups
CREATE POLICY "Users can view groups in their organization"
ON public.contact_groups FOR SELECT
USING (
    has_role(auth.uid(), 'super_admin') OR
    organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Admins can manage groups"
ON public.contact_groups FOR ALL
USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'clinic_admin') AND organization_id = get_user_organization(auth.uid()))
);

-- Lead Group Members
CREATE POLICY "Users can view lead group members"
ON public.lead_group_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.contact_groups g
        WHERE g.id = lead_group_members.group_id
        AND (has_role(auth.uid(), 'super_admin') OR g.organization_id = get_user_organization(auth.uid()))
    )
);

CREATE POLICY "Admins can manage lead group members"
ON public.lead_group_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.contact_groups g
        WHERE g.id = lead_group_members.group_id
        AND (has_role(auth.uid(), 'super_admin') OR 
            (has_role(auth.uid(), 'clinic_admin') AND g.organization_id = get_user_organization(auth.uid())))
    )
);

-- Patient Group Members
CREATE POLICY "Users can view patient group members"
ON public.patient_group_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.contact_groups g
        WHERE g.id = patient_group_members.group_id
        AND (has_role(auth.uid(), 'super_admin') OR g.organization_id = get_user_organization(auth.uid()))
    )
);

CREATE POLICY "Admins can manage patient group members"
ON public.patient_group_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.contact_groups g
        WHERE g.id = patient_group_members.group_id
        AND (has_role(auth.uid(), 'super_admin') OR 
            (has_role(auth.uid(), 'clinic_admin') AND g.organization_id = get_user_organization(auth.uid())))
    )
);

-- Email Campaigns
CREATE POLICY "Users can view campaigns in their organization"
ON public.email_campaigns FOR SELECT
USING (
    has_role(auth.uid(), 'super_admin') OR
    organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Admins can manage campaigns"
ON public.email_campaigns FOR ALL
USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'clinic_admin') AND organization_id = get_user_organization(auth.uid()))
);

-- Campaign Recipients
CREATE POLICY "Users can view campaign recipients"
ON public.campaign_recipients FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.email_campaigns c
        WHERE c.id = campaign_recipients.campaign_id
        AND (has_role(auth.uid(), 'super_admin') OR c.organization_id = get_user_organization(auth.uid()))
    )
);

CREATE POLICY "Admins can manage campaign recipients"
ON public.campaign_recipients FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.email_campaigns c
        WHERE c.id = campaign_recipients.campaign_id
        AND (has_role(auth.uid(), 'super_admin') OR 
            (has_role(auth.uid(), 'clinic_admin') AND c.organization_id = get_user_organization(auth.uid())))
    )
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX idx_contact_groups_org ON public.contact_groups(organization_id);
CREATE INDEX idx_lead_group_members_group ON public.lead_group_members(group_id);
CREATE INDEX idx_lead_group_members_lead ON public.lead_group_members(lead_id);
CREATE INDEX idx_patient_group_members_group ON public.patient_group_members(group_id);
CREATE INDEX idx_patient_group_members_patient ON public.patient_group_members(patient_id);
CREATE INDEX idx_email_campaigns_org ON public.email_campaigns(organization_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON public.campaign_recipients(status);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_groups_updated_at
BEFORE UPDATE ON public.contact_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();