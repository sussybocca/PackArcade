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

    if (event.httpMethod === 'GET') {
      // GET - Fetch leaderboard entries
      const { arcadeId, gameSubdomain, limit = 100 } = event.queryStringParameters;

      // Get leaderboard for this game
      const { data: leaderboard } = await supabase
        .from('leaderboards')
        .select('id, score_type, sort_order')
        .eq('arcade_id', arcadeId)
        .eq('game_subdomain', gameSubdomain)
        .single();

      if (!leaderboard) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Leaderboard not found' })
        };
      }

      // Get entries
      const query = supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('leaderboard_id', leaderboard.id)
        .order('score', { ascending: leaderboard.sort_order === 'asc' })
        .limit(parseInt(limit));

      const { data: entries, error } = await query;

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          leaderboard,
          entries: entries || []
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // POST - Submit a score
      const { arcadeId, gameSubdomain, playerName, playerId, score, scoreData } = JSON.parse(event.body);

      // Get or create leaderboard
      let { data: leaderboard } = await supabase
        .from('leaderboards')
        .select('id')
        .eq('arcade_id', arcadeId)
        .eq('game_subdomain', gameSubdomain)
        .single();

      if (!leaderboard) {
        // Create default leaderboard
        const { data: newLeaderboard } = await supabase
          .from('leaderboards')
          .insert([{
            arcade_id: arcadeId,
            game_subdomain: gameSubdomain,
            name: `${gameSubdomain} Leaderboard`,
            score_type: 'points',
            sort_order: 'desc'
          }])
          .select()
          .single();
        
        leaderboard = newLeaderboard;
      }

      // Submit entry
      const { data: entry, error } = await supabase
        .from('leaderboard_entries')
        .insert([{
          leaderboard_id: leaderboard.id,
          player_name: playerName,
          player_id: playerId,
          score: parseInt(score),
          score_data: scoreData
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, entry })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
