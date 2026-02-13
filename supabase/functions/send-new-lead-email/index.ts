import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadEmailRequest {
  lead_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  source?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: LeadEmailRequest = await req.json();
    console.log("Received new lead email request:", payload);

    const { lead_id, organization_id, first_name, last_name, phone, source } = payload;

    if (!lead_id || !organization_id) {
      throw new Error("Missing required fields: lead_id, organization_id");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
    }

    const orgName = org?.name || "Unknown Clinic";

    // Get all super admins
    const { data: superAdmins, error: superAdminError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .eq("is_active", true)
      .in(
        "id",
        (
          await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "super_admin")
        ).data?.map((r) => r.user_id) || []
      );

    if (superAdminError) {
      console.error("Error fetching super admins:", superAdminError);
    }

    // Get clinic admins for this organization
    const { data: clinicAdmins, error: clinicAdminError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .in(
        "id",
        (
          await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "clinic_admin")
        ).data?.map((r) => r.user_id) || []
      );

    if (clinicAdminError) {
      console.error("Error fetching clinic admins:", clinicAdminError);
    }

    // Combine all recipients (unique emails)
    const allRecipients = [...(superAdmins || []), ...(clinicAdmins || [])];
    const uniqueEmails = [...new Set(allRecipients.map((r) => r.email))].filter(Boolean);

    console.log(`Sending email to ${uniqueEmails.length} recipients:`, uniqueEmails);

    if (uniqueEmails.length === 0) {
      console.log("No recipients found, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "Miss Endo CRM";

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFromEmail) {
      console.error("Missing SMTP configuration");
      throw new Error("SMTP configuration incomplete");
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    const leadFullName = `${first_name} ${last_name}`.trim() || "İsimsiz";
    const leadSource = source || "Manuel Giriş";

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Yeni Lead Geldi!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Sisteme yeni bir potansiyel hasta eklendi:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: 600; width: 40%;">👤 İsim</td>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${leadFullName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: 600;">📱 Telefon</td>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${phone}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: 600;">🏥 Klinik</td>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${orgName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb; font-weight: 600;">📍 Kaynak</td>
        <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;">${leadSource}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://crm.missendo.com/leads" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Lead'i Görüntüle →
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
      Bu e-posta otomatik olarak gönderilmiştir.<br>
      Miss Endo CRM Sistemi
    </p>
  </div>
</body>
</html>
    `;

    // Send email to all recipients
    try {
      const rawSubject = `🎉 Yeni Lead: ${leadFullName} - ${orgName}`;

      await client.send({
        from: `${smtpFromName} <${smtpFromEmail}>`,
        to: uniqueEmails,
        subject: rawSubject,
        content: "auto",
        html: htmlContent,
      });

      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    } finally {
      await client.close();
    }

    return new Response(
      JSON.stringify({ success: true, recipientCount: uniqueEmails.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-new-lead-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
