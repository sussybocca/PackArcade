const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const game = event.queryStringParameters?.game || 'all'
    
    let query = supabase
      .from('scores')
      .select(`
        score,
        created_at,
        players!inner(username)
      `)
      .order('score', { ascending: false })
      .limit(100)

    if (game !== 'all') {
      query = query.eq('game_slug', game)
    }

    const { data, error } = await query

    if (error) throw error

    const scores = data.map(entry => ({
      username: entry.players.username,
      score: entry.score,
      created_at: entry.created_at
    }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ scores })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
