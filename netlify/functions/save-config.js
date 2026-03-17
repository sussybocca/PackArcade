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

    const { subdomain, config, sessionId } = JSON.parse(event.body);

    // Get user
    const { data: user } = await supabase
      .from('no_login_users')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get subdomain
    const { data: subdomainData } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', subdomain)
      .eq('user_id', user.id)
      .single();

    if (!subdomainData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Subdomain not found' })
      };
    }

    // Save to dev_table
    const { error } = await supabase
      .from('dev_table')
      .upsert({
        subdomain_id: subdomainData.id,
        config_name: 'supabase_config',
        config_data: config,
        updated_at: new Date()
      }, {
        onConflict: 'subdomain_id, config_name'
      });

    if (error) throw error;

    // Also update subdomain config
    await supabase
      .from('subdomains')
      .update({ config: config, last_updated: new Date() })
      .eq('id', subdomainData.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
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
