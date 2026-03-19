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

    const { popular, category } = event.queryStringParameters;

    const gameList = [
      { 
        subdomain: 'nebula', 
        name: 'Nebula Drifter', 
        description: 'Navigate through cosmic obstacles in this endless space runner',
        players: 1234,
        rating: 4.8,
        category: 'action',
        icon: 'fa-rocket'
      },
      { 
        subdomain: 'quantum', 
        name: 'Quantum Puzzles', 
        description: 'Mind-bending puzzles that challenge your perception of reality',
        players: 987,
        rating: 4.7,
        category: 'puzzle',
        icon: 'fa-atom'
      },
      { 
        subdomain: 'space', 
        name: 'Space Shooters', 
        description: 'Classic arcade shooter with modern graphics',
        players: 876,
        rating: 4.6,
        category: 'action',
        icon: 'fa-rocket'
      },
      { 
        subdomain: 'mario', 
        name: 'Super Mario', 
        description: 'The legendary platformer comes to PackArcade',
        players: 1543,
        rating: 4.9,
        category: 'platformer',
        icon: 'fa-star'
      },
      { 
        subdomain: 'tetris', 
        name: 'Tetris', 
        description: 'The classic block-stacking puzzle game',
        players: 1122,
        rating: 4.8,
        category: 'puzzle',
        icon: 'fa-cubes'
      },
      { 
        subdomain: 'pacman', 
        name: 'Pac-Man', 
        description: 'Eat dots, avoid ghosts, chase high scores',
        players: 891,
        rating: 4.7,
        category: 'arcade',
        icon: 'fa-circle'
      },
      { 
        subdomain: '2048', 
        name: '2048', 
        description: 'Merge tiles to reach the 2048 tile',
        players: 734,
        rating: 4.5,
        category: 'puzzle',
        icon: 'fa-th'
      },
      { 
        subdomain: 'flappy', 
        name: 'Flappy Bird', 
        description: 'Simple but addictive bird-flapping action',
        players: 623,
        rating: 4.3,
        category: 'casual',
        icon: 'fa-dove'
      },
      { 
        subdomain: 'minecraft', 
        name: 'Minecraft', 
        description: 'Build, explore, and survive in this blocky world',
        players: 2341,
        rating: 4.9,
        category: 'sandbox',
        icon: 'fa-cube'
      },
      { 
        subdomain: 'geometry', 
        name: 'Geometry Dash', 
        description: 'Rhythm-based platformer with geometric challenges',
        players: 892,
        rating: 4.7,
        category: 'rhythm',
        icon: 'fa-shapes'
      }
    ];

    let filteredGames = gameList;

    if (popular) {
      filteredGames = gameList.sort((a, b) => b.players - a.players).slice(0, 6);
    }

    if (category) {
      filteredGames = gameList.filter(g => g.category === category);
    }

    // Get real player counts from analytics
    try {
      for (let game of filteredGames) {
        const { count } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('page_path', `https://${game.subdomain}.packarcade.xyz`)
          .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (count) game.players = count;
      }
    } catch (e) {
      console.log('Using default player counts');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ games: filteredGames })
    };

  } catch (error) {
    console.error('Error in games:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        games: [
          { subdomain: 'nebula', name: 'Nebula Drifter', players: 1234, rating: 4.8 },
          { subdomain: 'quantum', name: 'Quantum Puzzles', players: 987, rating: 4.7 },
          { subdomain: 'space', name: 'Space Shooters', players: 876, rating: 4.6 }
        ]
      })
    };
  }
};
