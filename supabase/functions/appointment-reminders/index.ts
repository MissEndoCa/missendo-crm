import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        appointment_date,
        organization_id,
        patient_id,
        patients (
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .gte('appointment_date', today.toISOString())
      .lt('appointment_date', tomorrow.toISOString())
      .eq('status', 'scheduled');

    if (appointmentsError) throw appointmentsError;

    console.log(`Found ${appointments?.length || 0} appointments for today`);

    // Create notifications for each appointment
    const notifications = [];
    for (const appointment of appointments || []) {
      const patient = appointment.patients as any;
      
      // Get organization users to notify
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('organization_id', appointment.organization_id);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        continue;
      }

      // Create notification for each user in the organization
      for (const profile of profiles || []) {
        notifications.push({
          user_id: profile.id,
          organization_id: appointment.organization_id,
          type: 'appointment_reminder',
          title: 'Appointment Today',
          message: `${patient.first_name} ${patient.last_name} has an appointment today. Do you want to convert this lead to a patient?`,
          is_read: false,
        });
      }
    }

    if (notifications.length > 0) {
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointmentsProcessed: appointments?.length || 0,
        notificationsCreated: notifications.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in appointment-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});