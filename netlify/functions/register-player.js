const { supabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { username } = JSON.parse(event.body);

    // Check if player exists
    const { data: existing, error: checkError } = await supabase
      .from('players')
      .select('id, username, created_at')
      .eq('username', username)
      .single();

    if (existing) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          id: existing.id, 
          username: existing.username,
          created_at: existing.created_at,
          existing: true 
        })
      };
    }

    // Create new player
    const { data, error } = await supabase
      .from('players')
      .insert([{ username }])
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: data.id, 
        username: data.username,
        created_at: data.created_at,
        existing: false 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
