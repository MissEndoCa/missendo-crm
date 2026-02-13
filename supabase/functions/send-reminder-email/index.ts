import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  reminder_id?: string;
  check_pending?: boolean;
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
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Miss Endo CRM";

    const { reminder_id, check_pending }: ReminderEmailRequest = await req.json();

    let remindersToProcess: any[] = [];

    if (check_pending) {
      const now = new Date();
      const nowIso = now.toISOString();
      
      // Get all pending reminders that are due NOW
      const { data: pendingReminders, error: fetchError } = await supabase
        .from("reminders")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, email),
          lead:leads(first_name, last_name, phone, email),
          creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .lte("reminder_date", nowIso);

      if (fetchError) {
        console.error("Error fetching pending reminders:", fetchError);
        throw fetchError;
      }

      remindersToProcess = pendingReminders || [];
      console.log(`Found ${remindersToProcess.length} pending reminders due now`);
    } else if (reminder_id) {
      // Get specific reminder
      const { data: reminder, error: fetchError } = await supabase
        .from("reminders")
        .select(`
          *,
          patient:patients(first_name, last_name, phone, email),
          lead:leads(first_name, last_name, phone, email),
          creator:profiles!reminders_created_by_fkey(first_name, last_name, email)
        `)
        .eq("id", reminder_id)
        .single();

      if (fetchError) {
        console.error("Error fetching reminder:", fetchError);
        throw fetchError;
      }

      remindersToProcess = reminder ? [reminder] : [];
    }

    if (remindersToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to process", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    let errorCount = 0;

    for (const reminder of remindersToProcess) {
      try {
        const targetName = reminder.patient 
          ? `${reminder.patient.first_name} ${reminder.patient.last_name}`
          : reminder.lead 
            ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
            : "Unknown";

        const targetType = reminder.patient ? "Patient" : "Lead";
        const targetPhone = reminder.patient?.phone || reminder.lead?.phone || "N/A";
        
        // Determine recipients based on notify settings
        let recipientEmails: string[] = [];
        
        // First, check if there are specific users selected in reminder_notify_users table
        const { data: notifyUsers, error: notifyError } = await supabase
          .from("reminder_notify_users")
          .select("user_id")
          .eq("reminder_id", reminder.id);
        
        if (notifyError) {
          console.error("Error fetching notify users:", notifyError);
        }
        
        if (notifyUsers && notifyUsers.length > 0) {
          // Send to specifically selected users
          const userIds = notifyUsers.map(nu => nu.user_id);
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("email")
            .in("id", userIds);
          
          if (profileError) {
            console.error("Error fetching selected user profiles:", profileError);
          } else if (profiles) {
            recipientEmails = profiles.map(p => p.email).filter(Boolean);
          }
          console.log(`Sending to ${recipientEmails.length} selected users`);
        } else if (reminder.notify_all_admins) {
          // Get all super admin emails
          const { data: superAdmins, error: adminError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "super_admin");
          
          if (adminError) {
            console.error("Error fetching super admins:", adminError);
          } else if (superAdmins && superAdmins.length > 0) {
            const userIds = superAdmins.map(sa => sa.user_id);
            const { data: profiles, error: profileError } = await supabase
              .from("profiles")
              .select("email")
              .in("id", userIds);
            
            if (profileError) {
              console.error("Error fetching admin profiles:", profileError);
            } else if (profiles) {
              recipientEmails = profiles.map(p => p.email).filter(Boolean);
            }
          }
          console.log(`Sending to all super admins: ${recipientEmails.length} recipients`);
        } else {
          // Send only to creator
          const creatorEmail = reminder.creator?.email;
          if (creatorEmail) {
            recipientEmails = [creatorEmail];
          }
          console.log(`Sending to creator only: ${recipientEmails.length} recipient`);
        }

        if (recipientEmails.length === 0) {
          console.error(`No recipients found for reminder: ${reminder.id}`);
          errorCount++;
          continue;
        }

        const reminderDate = new Date(reminder.reminder_date).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        });

        const emailHtml = `<!DOCTYPE html>
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
<td style="background-color: #603f8b; padding: 30px; text-align: center;">
<img src="https://xzcpxatfzgusrxfreeoi.supabase.co/storage/v1/object/public/email-assets/miss-endo-logo.png" alt="Miss Endo" width="120" style="max-width: 120px; height: auto; margin-bottom: 15px;">
<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Reminder</h1>
<p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${reminder.title}</p>
</td>
</tr>
<!-- Content -->
<tr>
<td style="padding: 30px;">
<table width="100%" cellpadding="0" cellspacing="0">
<!-- Person Info -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contact</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 18px; font-weight: 600;">${targetName}</p>
<span style="display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; ${targetType === 'Patient' ? 'background-color: #dbeafe; color: #1d4ed8;' : 'background-color: #fef3c7; color: #b45309;'}">${targetType}</span>
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Phone -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${targetPhone}</p>
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Date -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reminder Date</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${reminderDate}</p>
</td>
</tr>
<tr><td style="height: 12px;"></td></tr>
<!-- Type -->
<tr>
<td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
<p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Type</p>
<p style="margin: 5px 0 0 0; color: #111827; font-size: 16px; font-weight: 500;">${getReminderTypeLabel(reminder.reminder_type)}</p>
</td>
</tr>
${reminder.notes ? `<tr><td style="height: 12px;"></td></tr>
<tr>
<td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
<p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
<p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">${reminder.notes}</p>
</td>
</tr>` : ''}
</table>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="background-color: #1f2937; padding: 25px; text-align: center;">
<p style="margin: 0; color: #9ca3af; font-size: 12px;">Miss Endo CRM - Reminder System</p>
<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 11px;">This email was sent automatically.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

        // Send email to all recipients
        for (const recipientEmail of recipientEmails) {
          await client.send({
            from: `${fromName} <${fromEmail}>`,
            to: recipientEmail,
            subject: `Reminder: ${reminder.title} - ${targetName}`,
            content: "auto",
            html: emailHtml,
          });
          console.log(`Email sent to: ${recipientEmail}`);
        }

        // Update reminder status to sent
        await supabase
          .from("reminders")
          .update({ 
            status: "sent", 
            email_sent_at: new Date().toISOString() 
          })
          .eq("id", reminder.id);

        console.log(`Reminder email sent successfully for: ${reminder.id}`);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email for reminder ${reminder.id}:`, emailError);
        errorCount++;
      }
    }

    await client.close();

    return new Response(
      JSON.stringify({ 
        message: "Reminders processed",
        success: successCount,
        errors: errorCount,
        total: remindersToProcess.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getReminderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    call_back: "Call Back",
    follow_up: "Follow Up",
    appointment: "Appointment",
    unreachable: "Unreachable",
    custom: "Custom",
  };
  return labels[type] || type;
}
