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
      .select('id, user_id, config')
      .eq('subdomain_name', subdomain)
      .single();

    let subdomainId;
    let isNew = false;

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

    if (existing) {
      // === UPDATE EXISTING SUBDOMAIN ===
      console.log(`Updating existing subdomain: ${subdomain}`);
      subdomainId = existing.id;
      isNew = false;
      
      // Update subdomain config
      await supabase
        .from('subdomains')
        .update({ 
          config: config || existing.config || {},
          last_updated: new Date()
        })
        .eq('id', subdomainId);

      // Delete existing files
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('subdomain_id', subdomainId);

      if (deleteError) {
        console.error('Error deleting existing files:', deleteError);
        throw deleteError;
      }
    } else {
      // === CREATE NEW SUBDOMAIN ===
      console.log(`Creating new subdomain: ${subdomain}`);
      isNew = true;
      
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
      subdomainId = subdomainData.id;
    }

    // Process files - inject function reference into HTML files
    if (files && files.length > 0) {
      const fileRecords = files.map(file => {
        let fileContent = file.content || '';
        
        // If it's an HTML file, inject the function path
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const functionPath = `/.netlify/functions/serve-user-site?subdomain=${subdomain}`;
          
          // Create injection script that loads content from the function
          const injection = `
<!-- Auto-injected by PackArcade -->
<script>
  (function() {
    // Store function path for later use
    window.__PACKARCADE = window.__PACKARCADE || {};
    window.__PACKARCADE.functionPath = '/.netlify/functions/serve-user-site';
    window.__PACKARCADE.subdomain = '${subdomain}';
    
    // If this is the main page and content is empty, load from function
    if (document.body.children.length === 0 || document.body.innerText.trim() === '') {
      fetch('/.netlify/functions/serve-user-site')
        .then(res => res.text())
        .then(html => {
          // Parse and inject the content
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          document.body.innerHTML = doc.body.innerHTML;
          
          // Update title if needed
          if (doc.title) {
            document.title = doc.title;
          }
        })
        .catch(err => console.error('Failed to load content:', err));
    }
  })();
</script>
`;
          
          // Inject after <head> or at beginning
          if (fileContent.includes('</head>')) {
            fileContent = fileContent.replace('</head>', injection + '</head>');
          } else if (fileContent.includes('<head>')) {
            fileContent = fileContent.replace('<head>', '<head>' + injection);
          } else {
            fileContent = '<!DOCTYPE html>\n<html>\n<head>' + injection + '</head>\n<body>\n' + fileContent + '\n</body>\n</html>';
          }
        }
        
        return {
          subdomain_id: subdomainId,
          file_path: file.path || '/',
          file_name: file.name,
          file_content: fileContent,
          file_type: file.type,
          parent_folder: file.parentFolder,
          is_folder: file.isFolder || false
        };
      });

      const { error: filesError } = await supabase
        .from('files')
        .insert(fileRecords);

      if (filesError) throw filesError;
    }

    // Save config to dev_table if provided
    if (config) {
      // Check if config already exists
      const { data: existingConfig } = await supabase
        .from('dev_table')
        .select('id')
        .eq('subdomain_id', subdomainId)
        .eq('config_name', 'supabase_config')
        .single();

      if (existingConfig) {
        // Update existing config
        await supabase
          .from('dev_table')
          .update({ config_data: config, updated_at: new Date() })
          .eq('id', existingConfig.id);
      } else {
        // Insert new config
        await supabase
          .from('dev_table')
          .insert([{
            subdomain_id: subdomainId,
            config_name: 'supabase_config',
            config_data: config
          }]);
      }
    }

    // === ADD SUBDOMAIN TO NETLIFY AUTOMATICALLY (only for new subdomains) ===
    if (isNew) {
      try {
        const netlifySiteId = process.env.NETLIFY_SITE_ID;
        const netlifyToken = process.env.NETLIFY_TOKEN;
        
        if (netlifySiteId && netlifyToken) {
          const newDomain = `${subdomain}.packarcade.xyz`;
          
          const getResponse = await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${netlifyToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (getResponse.ok) {
            const siteInfo = await getResponse.json();
            const currentDomainAliases = siteInfo.domain_aliases || [];
            
            if (!currentDomainAliases.includes(newDomain)) {
              const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${netlifyToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  domain_aliases: [...currentDomainAliases, newDomain]
                })
              });

              if (updateResponse.ok) {
                console.log(`Successfully added ${newDomain} to Netlify`);
              } else {
                console.error('Failed to update Netlify:', await updateResponse.text());
              }
            }
          }
        }
      } catch (netlifyError) {
        console.error('Error adding subdomain to Netlify:', netlifyError);
      }
    }

    // Create a version record
    try {
      // Get the next version number
      const { data: lastVersion } = await supabase
        .from('versions')
        .select('number')
        .eq('subdomain_id', subdomainId)
        .order('number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = lastVersion ? lastVersion.number + 1 : 1;

      // Create new version
      const { data: versionData, error: versionError } = await supabase
        .from('versions')
        .insert([{
          subdomain_id: subdomainId,
          number: nextVersionNumber,
          name: isNew ? 'Initial version' : `Update ${new Date().toLocaleString()}`,
          created_by_session: sessionId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (!versionError && versionData && files && files.length > 0) {
        // Save files to version
        const versionFileRecords = files.map(file => ({
          version_id: versionData.id,
          file_path: file.path || '/',
          file_name: file.name,
          file_content: file.content,
          file_type: file.type,
          parent_folder: file.parentFolder,
          is_folder: file.isFolder || false
        }));

        await supabase
          .from('version_files')
          .insert(versionFileRecords);
      }
    } catch (versionError) {
      console.error('Error creating version:', versionError);
      // Don't fail the whole request if versioning fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        subdomain: subdomain,
        isNew: isNew,
        url: `https://${subdomain}.packarcade.xyz`,
        message: isNew ? 'Subdomain created successfully' : 'Subdomain updated successfully'
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
