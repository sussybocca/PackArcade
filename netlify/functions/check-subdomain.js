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

    const { name } = event.queryStringParameters;

    const { data, error } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', name)
      .single();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ exists: !!data })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ exists: false })
    };
  }
};
