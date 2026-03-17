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

    const { subdomain, version, sessionId } = event.queryStringParameters;

    // Get subdomain info
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', subdomain)
      .single();

    if (subdomainError || !subdomainData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Subdomain not found' })
      };
    }

    // Get version
    const { data: versionData, error: versionError } = await supabase
      .from('versions')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .eq('number', parseInt(version))
      .single();

    if (versionError || !versionData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Version not found' })
      };
    }

    // Get files for this version
    const { data: files, error: filesError } = await supabase
      .from('version_files')
      .select('*')
      .eq('version_id', versionData.id);

    if (filesError) throw filesError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        version: versionData,
        files: files || []
      })
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
