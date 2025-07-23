Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData = await req.json();
    const { action } = requestData;

    if (action === 'setup_admin') {
      // Setup ewangchong@gmail.com as admin
      const adminEmail = 'ewangchong@gmail.com';
      
      // Check if profile exists for admin email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', adminEmail)
        .single();
      
      if (!existingProfile) {
        // Create admin profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id, // Temporary - will be updated when admin actually signs up
            email: adminEmail,
            full_name: 'Admin User',
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating admin profile:', insertError);
        }
      } else {
        // Update existing profile to be admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true, updated_at: new Date().toISOString() })
          .eq('email', adminEmail);
        
        if (updateError) {
          console.error('Error updating admin status:', updateError);
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Admin setup completed',
        admin_email: adminEmail
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'check_admin') {
      // Check if current user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = profile?.is_admin || user.email === 'ewangchong@gmail.com';
      
      return new Response(JSON.stringify({ 
        is_admin: isAdmin,
        email: user.email,
        profile_admin: profile?.is_admin || false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'admin_action') {
      // Verify admin status before allowing admin actions
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      const isAdmin = profile?.is_admin || user.email === 'ewangchong@gmail.com';
      
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Admin action is authorized
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Admin action authorized',
        user_email: user.email
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});