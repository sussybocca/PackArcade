const { supabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const username = event.queryStringParameters?.username;

    if (!username) {
      throw new Error('Username required');
    }

    // Get player ID
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .single();

    if (playerError) throw playerError;

    // Get recent games
    const { data: games, error: gamesError } = await supabase
      .from('scores')
      .select('game_slug, score, created_at')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (gamesError) throw gamesError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(games)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
