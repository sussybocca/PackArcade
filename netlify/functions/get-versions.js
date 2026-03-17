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

    const { subdomain, sessionId } = event.queryStringParameters;

    // Get subdomain info
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('subdomains')
      .select('id, config')
      .eq('subdomain_name', subdomain)
      .single();

    if (subdomainError || !subdomainData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Subdomain not found' })
      };
    }

    // Get all versions for this subdomain
    const { data: versions, error: versionsError } = await supabase
      .from('versions')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .order('number', { ascending: false });

    if (versionsError) throw versionsError;

    // Get file counts for each version
    const versionsWithStats = await Promise.all(versions.map(async (version) => {
      const { count } = await supabase
        .from('version_files')
        .select('*', { count: 'exact', head: true })
        .eq('version_id', version.id);

      return {
        ...version,
        fileCount: count || 0
      };
    }));

    const currentVersion = subdomainData.config?.currentVersion || 1;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        versions: versionsWithStats,
        currentVersion
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
