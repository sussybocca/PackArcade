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

    const { arcadeName, subdomain, sessionId, config } = JSON.parse(event.body);

    // Check if arcade name exists
    const { data: existing } = await supabase
      .from('arcades')
      .select('id')
      .eq('arcade_name', arcadeName)
      .single();

    if (existing) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Arcade name already exists' })
      };
    }

    // Check if subdomain exists
    const { data: existingSubdomain } = await supabase
      .from('arcades')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (existingSubdomain) {
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

    // Create arcade
    const { data: arcadeData, error: arcadeError } = await supabase
      .from('arcades')
      .insert([{
        arcade_name: arcadeName,
        subdomain: subdomain,
        user_id: userId,
        title: config?.title || arcadeName,
        description: config?.description || '',
        theme: config?.theme || 'default',
        logo_url: config?.logo_url || null,
        background_color: config?.background_color || '#1a1f33',
        text_color: config?.text_color || '#ffffff',
        accent_color: config?.accent_color || '#667eea',
        is_public: config?.is_public !== false,
        config: config || {}
      }])
      .select()
      .single();

    if (arcadeError) throw arcadeError;

    // Add default games if specified
    if (config?.defaultGames && config.defaultGames.length > 0) {
      const gameRecords = config.defaultGames.map((game, index) => ({
        arcade_id: arcadeData.id,
        game_subdomain: game.subdomain,
        display_name: game.name,
        display_order: index,
        is_active: true
      }));

      await supabase
        .from('arcade_games')
        .insert(gameRecords);
    }

    // Add subdomain to Netlify
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
            await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${netlifyToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                domain_aliases: [...currentDomainAliases, newDomain]
              })
            });
          }
        }
      }
    } catch (netlifyError) {
      console.error('Error adding subdomain to Netlify:', netlifyError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        arcade: arcadeData,
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
