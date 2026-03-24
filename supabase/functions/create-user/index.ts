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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Create admin client with service role first (needed for role checks)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    const jwt = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      console.log('No Authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user making the request (pass JWT explicitly)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwt);

    if (userError) {
      console.error('Auth getUser error:', userError);
    }

    if (!user) {
      console.log('No authenticated user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id, user.email);

    // Check if user has super_admin or clinic_admin role using admin client (bypasses RLS)
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User roles:', userRoles);

    const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin');
    const isClinicAdmin = userRoles?.some(r => r.role === 'clinic_admin');

    if (!isSuperAdmin && !isClinicAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Only super admins can create users and assign roles' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { email, password, firstName, lastName, phone, role, organizationId } = await req.json();

    if (!email || !password || !firstName || !lastName || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // supabaseAdmin is already created above for role checks

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      // User exists, just update their organization and role
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          organization_id: organizationId,
          phone: phone || null,
        })
        .eq('id', existingProfile.id);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        return new Response(JSON.stringify({ error: 'Failed to update user profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if role exists
      const { data: existingRoles } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', existingProfile.id)
        .eq('organization_id', organizationId);

      if (!existingRoles || existingRoles.length === 0) {
        // Add role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: existingProfile.id,
            role: role,
            organization_id: organizationId,
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          return new Response(JSON.stringify({ error: 'Failed to assign user role' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'User added to organization successfully',
          userId: existingProfile.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user using admin client (won't create session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ error: 'User creation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User created successfully:', newUser.user.id);

    // Update profile with organization and phone
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        organization_id: organizationId,
        phone: phone || null,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to update user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        organization_id: organizationId,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to assign user role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        userId: newUser.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: String(error) || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
