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

    const { sessionId, arcadeId, subdomain } = event.queryStringParameters;

    let query = supabase
      .from('arcades')
      .select(`
        *,
        arcade_games(*),
        leaderboards(*)
      `);

    if (arcadeId) {
      query = query.eq('id', arcadeId);
    } else if (subdomain) {
      query = query.eq('subdomain', subdomain);
    } else if (sessionId) {
      // Get user's arcades
      const { data: user } = await supabase
        .from('no_login_users')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ arcades: [] })
        };
      }
    }

    const { data: arcades, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ arcades: arcades || [] })
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
