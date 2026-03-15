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
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ challenges: data })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
