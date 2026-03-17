const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { sessionId } = event.queryStringParameters;

    // Get user
    const { data: user } = await supabase
      .from('no_login_users')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!user) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sites: [] })
      };
    }

    // Get user's subdomains
    const { data: sites } = await supabase
      .from('subdomains')
      .select('subdomain_name, created_at, config')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sites: sites || [] })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
