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

    const { limit = 10 } = event.queryStringParameters;

    // Get recent leaderboard entries
    const { data: scores, error: scoresError } = await supabase
      .from('leaderboard_entries')
      .select(`
        player_name,
        score,
        created_at,
        leaderboards (
          name,
          game_subdomain
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (scoresError) throw scoresError;

    // Get recent arcade creations
    const { data: arcades, error: arcadesError } = await supabase
      .from('arcades')
      .select(`
        title,
        arcade_name,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (arcadesError) throw arcadesError;

    // Combine and format activities
    const activities = [];

    scores?.forEach(entry => {
      activities.push({
        type: 'score',
        user: entry.player_name,
        action: 'achieved a high score on',
        target: entry.leaderboards?.name || entry.leaderboards?.game_subdomain || 'a game',
        time: formatTimeAgo(new Date(entry.created_at)),
        icon: 'fa-trophy'
      });
    });

    arcades?.forEach(arcade => {
      activities.push({
        type: 'arcade',
        user: 'Someone',
        action: 'created new arcade',
        target: arcade.title || arcade.arcade_name,
        time: formatTimeAgo(new Date(arcade.created_at)),
        icon: 'fa-arcade'
      });
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        activities: activities.slice(0, parseInt(limit)) 
      })
    };

  } catch (error) {
    console.error('Error in recent-activity:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        activities: [
          { user: 'PlayerOne', action: 'achieved #1 on', target: 'Nebula Drifter', time: '2 minutes ago', icon: 'fa-trophy' },
          { user: 'ArcadeKing', action: 'created new arcade', target: 'Pixel Paradise', time: '15 minutes ago', icon: 'fa-arcade' },
          { user: 'GameMaster', action: 'beat high score on', target: 'Quantum Puzzles', time: '1 hour ago', icon: 'fa-star' }
        ]
      })
    };
  }
};

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  return Math.floor(seconds / 86400) + ' days ago';
}
