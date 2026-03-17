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

    const { subdomain, rating, comment, sessionId } = JSON.parse(event.body);

    // Get explore site ID
    const { data: exploreSite } = await supabase
      .from('explore_sites')
      .select('id')
      .eq('subdomains.subdomain_name', subdomain)
      .single();

    if (!exploreSite) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Site not found in explore' })
      };
    }

    // Check if already reviewed by this session
    const { data: existing } = await supabase
      .from('site_reviews')
      .select('id')
      .eq('explore_site_id', exploreSite.id)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      // Update existing review
      const { error } = await supabase
        .from('site_reviews')
        .update({
          rating,
          comment,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new review
      const { error } = await supabase
        .from('site_reviews')
        .insert([{
          explore_site_id: exploreSite.id,
          session_id: sessionId,
          rating,
          comment
        }]);

      if (error) throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Review error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
