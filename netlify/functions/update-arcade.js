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

    const { arcadeId, updates, sessionId, games } = JSON.parse(event.body);

    // Verify ownership
    const { data: arcade } = await supabase
      .from('arcades')
      .select('user_id')
      .eq('id', arcadeId)
      .single();

    if (!arcade) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Arcade not found' })
      };
    }

    const { data: user } = await supabase
      .from('no_login_users')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!user || user.id !== arcade.user_id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Update arcade
    const { error: updateError } = await supabase
      .from('arcades')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', arcadeId);

    if (updateError) throw updateError;

    // Update games if provided
    if (games) {
      // Delete existing games
      await supabase
        .from('arcade_games')
        .delete()
        .eq('arcade_id', arcadeId);

      // Add new games
      if (games.length > 0) {
        const gameRecords = games.map((game, index) => ({
          arcade_id: arcadeId,
          game_subdomain: game.subdomain,
          display_name: game.name,
          display_order: index,
          is_active: true,
          custom_icon: game.icon
        }));

        await supabase
          .from('arcade_games')
          .insert(gameRecords);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
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
