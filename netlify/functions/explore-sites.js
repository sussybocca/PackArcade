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
      // GET - Fetch explore sites
      const { category, search, page = 1, limit = 20 } = event.queryStringParameters;

      let query = supabase
        .from('explore_sites')
        .select(`
          *,
          subdomains (
            subdomain_name,
            config
          )
        `)
        .eq('is_public', true)
        .order('featured', { ascending: false })
        .order('total_visits', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.textSearch('description', search);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: sites, error, count } = await query
        .range(from, to);

      if (error) throw error;

      // Get average ratings
      const sitesWithRatings = await Promise.all(sites.map(async (site) => {
        const { data: reviews } = await supabase
          .from('site_reviews')
          .select('rating')
          .eq('explore_site_id', site.id);

        const avgRating = reviews?.length 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;

        return {
          ...site,
          avgRating,
          reviewCount: reviews?.length || 0
        };
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          sites: sitesWithRatings,
          page: parseInt(page),
          total: count
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // POST - Toggle site visibility or update explore info
      const { subdomain, isPublic, category, tags, description, sessionId } = JSON.parse(event.body);

      // Verify ownership
      const { data: subdomainData } = await supabase
        .from('subdomains')
        .select('id, user_id')
        .eq('subdomain_name', subdomain)
        .single();

      if (!subdomainData) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Subdomain not found' })
        };
      }

      // Check if already in explore
      const { data: existing } = await supabase
        .from('explore_sites')
        .select('id')
        .eq('subdomain_id', subdomainData.id)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('explore_sites')
          .update({
            is_public: isPublic,
            category,
            tags,
            description,
            last_crawled: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('explore_sites')
          .insert([{
            subdomain_id: subdomainData.id,
            is_public: isPublic,
            category,
            tags,
            description,
            last_crawled: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

  } catch (error) {
    console.error('Explore error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
