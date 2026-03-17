const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { pass, subdomain, sessionId } = JSON.parse(event.body);

    // Check if pass exists and is valid
    const { data: passData, error: passError } = await supabase
      .from('dev_passes')
      .select('*')
      .eq('pass_code', pass)
      .eq('subdomain', subdomain)
      .eq('is_used', false)
      .single();

    if (passError || !passData) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired pass' })
      };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(passData.expires_at);
    
    if (now > expiresAt) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Pass has expired' })
      };
    }

    // Mark as used
    await supabase
      .from('dev_passes')
      .update({ is_used: true })
      .eq('id', passData.id);

    // Generate a new session token for editing
    const editToken = 'edit_' + Math.random().toString(36).substr(2, 16) + Date.now();

    // Store edit session
    await supabase
      .from('edit_sessions')
      .insert([{
        token: editToken,
        subdomain: subdomain,
        session_id: sessionId,
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        token: editToken,
        message: 'Pass validated. You can now edit.'
      })
    };

  } catch (error) {
    console.error('Error validating pass:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
