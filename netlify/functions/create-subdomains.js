const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { subdomain, files, sessionId, config } = JSON.parse(event.body);

    // Check if subdomain exists
    const { data: existing } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', subdomain)
      .single();

    if (existing) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subdomain already exists' })
      };
    }

    // Get or create anonymous user
    let userId;
    const { data: user } = await supabase
      .from('no_login_users')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (user) {
      userId = user.id;
      await supabase
        .from('no_login_users')
        .update({ last_active: new Date() })
        .eq('id', userId);
    } else {
      const { data: newUser } = await supabase
        .from('no_login_users')
        .insert([{ 
          session_id: sessionId,
          ip_address: event.headers['client-ip'] || event.headers['x-forwarded-for']
        }])
        .select()
        .single();
      userId = newUser.id;
    }

    // Create subdomain entry
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('subdomains')
      .insert([{
        subdomain_name: subdomain,
        user_id: userId,
        config: config || {}
      }])
      .select()
      .single();

    if (subdomainError) throw subdomainError;

    // Insert files
    if (files && files.length > 0) {
      const fileRecords = files.map(file => ({
        subdomain_id: subdomainData.id,
        file_path: file.path || '/',
        file_name: file.name,
        file_content: file.content,
        file_type: file.type,
        parent_folder: file.parentFolder,
        is_folder: file.isFolder || false
      }));

      const { error: filesError } = await supabase
        .from('files')
        .insert(fileRecords);

      if (filesError) throw filesError;
    }

    // Save config to dev_table if provided
    if (config) {
      await supabase
        .from('dev_table')
        .insert([{
          subdomain_id: subdomainData.id,
          config_name: 'supabase_config',
          config_data: config
        }]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        subdomain: subdomainData,
        url: `https://${subdomain}.packarcade.xyz`
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
