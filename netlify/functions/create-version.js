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

    const { subdomain, files, sessionId, versionName, config } = JSON.parse(event.body);

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

    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('versions')
      .select('number')
      .eq('subdomain_id', subdomainData.id)
      .order('number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = lastVersion ? lastVersion.number + 1 : 1;

    // Create new version record
    const { data: versionData, error: versionError } = await supabase
      .from('versions')
      .insert([{
        subdomain_id: subdomainData.id,
        number: nextVersionNumber,
        name: versionName || `Version ${nextVersionNumber}`,
        created_by_session: sessionId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (versionError) throw versionError;

    // Save files for this version
    if (files && files.length > 0) {
      const fileRecords = files.map(file => ({
        version_id: versionData.id,
        file_path: file.path || '/',
        file_name: file.name,
        file_content: file.content,
        file_type: file.type,
        parent_folder: file.parentFolder,
        is_folder: file.isFolder || false
      }));

      const { error: filesError } = await supabase
        .from('version_files')
        .insert(fileRecords);

      if (filesError) throw filesError;
    }

    // Update subdomain config with current version
    const updatedConfig = {
      ...subdomainData.config,
      currentVersion: nextVersionNumber
    };

    await supabase
      .from('subdomains')
      .update({ config: updatedConfig })
      .eq('id', subdomainData.id);

    // Get all versions for response
    const { data: allVersions } = await supabase
      .from('versions')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .order('number', { ascending: false });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        version: nextVersionNumber,
        versions: allVersions
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
