import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignEmailRequest {
  campaign_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const smtpHost = Deno.env.get("SMTP_HOST")!;
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER")!;
    const smtpPass = Deno.env.get("SMTP_PASS")!;
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL")!;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Miss Endo";

    const { campaign_id }: CampaignEmailRequest = await req.json();

    if (!campaign_id) {
      throw new Error("campaign_id is required");
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError) {
      console.error("Error fetching campaign:", campaignError);
      throw campaignError;
    }

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Update campaign status to sending
    await supabase
      .from("email_campaigns")
      .update({ 
        status: "sending", 
        started_at: new Date().toISOString() 
      })
      .eq("id", campaign_id);

    // Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending");

    if (recipientsError) {
      console.error("Error fetching recipients:", recipientsError);
      throw recipientsError;
    }

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending recipients", total: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting campaign ${campaign_id} with ${recipients.length} recipients`);

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpPort === 465,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    let successCount = 0;
    let failCount = 0;

    // Generate HTML email template with tracking pixel
    const generateEmailHtml = (recipientId: string, recipientName: string, content: string) => {
      const logoUrl = "https://xzcpxatfzgusrxfreeoi.supabase.co/storage/v1/object/public/email-assets/miss-endo-logo.png";
      
      // Tracking pixel URL
      const trackingUrl = `${supabaseUrl}/functions/v1/track-email-open?rid=${recipientId}`;
      
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
<!-- Header with Logo -->
<tr>
<td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
<img src="${logoUrl}" alt="Miss Endo" width="180" height="auto" style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
</td>
</tr>
<!-- Content -->
<tr>
<td style="padding: 30px;">
<div style="color: #111827; font-size: 16px; line-height: 1.6;">
${content.replace(/\{\{name\}\}/g, recipientName)}
</div>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="background-color: #1f2937; padding: 25px; text-align: center;">
<p style="margin: 0; color: #9ca3af; font-size: 12px;">Miss Endo</p>
<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 11px;">This email was sent from Miss Endo.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
<!-- Tracking Pixel -->
<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>`;
    };

    // Process each recipient with delay to avoid rate limiting
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Replace variables in subject and content
        const personalizedSubject = campaign.subject.replace(/\{\{name\}\}/g, recipient.recipient_name || 'Valued Customer');
        const personalizedContent = campaign.content.replace(/\{\{name\}\}/g, recipient.recipient_name || 'Valued Customer');
        
        const emailHtml = generateEmailHtml(recipient.id, recipient.recipient_name || 'Valued Customer', personalizedContent);

        await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: recipient.email,
          subject: personalizedSubject,
          html: emailHtml,
        });

        // Update recipient status to sent
        await supabase
          .from("campaign_recipients")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString() 
          })
          .eq("id", recipient.id);

        successCount++;
        console.log(`Sent email to ${recipient.email} (${i + 1}/${recipients.length})`);

        // Add 2 second delay between emails to avoid rate limiting
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        
        // Update recipient status to failed
        await supabase
          .from("campaign_recipients")
          .update({ 
            status: "failed", 
            error_message: emailError.message 
          })
          .eq("id", recipient.id);

        failCount++;
      }
    }

    await client.close();

    // Update campaign with final counts and status
    await supabase
      .from("email_campaigns")
      .update({ 
        status: "sent",
        completed_at: new Date().toISOString(),
        sent_count: successCount,
        failed_count: failCount
      })
      .eq("id", campaign_id);

    console.log(`Campaign ${campaign_id} completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Campaign emails sent",
        total: recipients.length,
        success: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-campaign-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
