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
    const { username, challengeId } = JSON.parse(event.body)

    // Get player ID
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .single()

    if (!player) throw new Error('Player not found')

    // Mark challenge as completed
    const { error } = await supabase
      .from('completed_challenges')
      .insert([{
        player_id: player.id,
        challenge_id: challengeId
      }])

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
