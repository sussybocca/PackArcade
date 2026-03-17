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

    const { subdomain, files, sessionId } = JSON.parse(event.body);

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

    // Delete existing files
    await supabase
      .from('files')
      .delete()
      .eq('subdomain_id', subdomainData.id);

    // Insert new files
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

    // Update last_updated
    await supabase
      .from('subdomains')
      .update({ last_updated: new Date() })
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
