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
      .select('id, created_at')
      .eq('username', username)
      .single();

    if (playerError) throw playerError;

    // Get stats
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('score')
      .eq('player_id', player.id);

    if (scoresError) throw scoresError;

    const stats = {
      games_played: scores.length,
      high_scores: scores.length, // You can make this more sophisticated
      total_score: scores.reduce((sum, s) => sum + s.score, 0),
      created_at: player.created_at
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
