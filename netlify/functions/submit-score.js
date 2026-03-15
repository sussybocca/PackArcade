const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { username, game_slug, score } = JSON.parse(event.body)

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .single()

    if (!player) throw new Error('Player not found')

    // Insert score
    const { data, error } = await supabase
      .from('scores')
      .insert([{
        player_id: player.id,
        game_slug,
        score
      }])
      .select()

    if (error) throw error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
