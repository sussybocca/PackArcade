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

    const { subdomain, eventType, pagePath, referrer, duration } = JSON.parse(event.body);

    // Get subdomain ID
    const { data: subdomainData } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', subdomain)
      .single();

    if (!subdomainData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Subdomain not found' })
      };
    }

    const userAgent = event.headers['user-agent'] || '';
    const ipAddress = event.headers['client-ip'] || event.headers['x-forwarded-for'] || '';
    const sessionId = event.headers['x-session-id'] || 'unknown';

    // Parse user agent for device info
    const deviceType = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';
    const browser = /firefox/i.test(userAgent) ? 'Firefox' : /chrome/i.test(userAgent) ? 'Chrome' : /safari/i.test(userAgent) ? 'Safari' : 'Other';
    const os = /windows/i.test(userAgent) ? 'Windows' : /mac/i.test(userAgent) ? 'macOS' : /linux/i.test(userAgent) ? 'Linux' : /android/i.test(userAgent) ? 'Android' : /ios/i.test(userAgent) ? 'iOS' : 'Other';

    // Store analytics event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert([{
        subdomain_id: subdomainData.id,
        session_id: sessionId,
        event_type: eventType,
        page_path: pagePath,
        referrer: referrer,
        user_agent: userAgent,
        ip_address: ipAddress,
        device_type: deviceType,
        browser: browser,
        os: os,
        duration: duration || 0,
        timestamp: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    // Update or create active user
    const { data: existingActive } = await supabase
      .from('active_users')
      .select('id')
      .eq('subdomain_id', subdomainData.id)
      .eq('session_id', sessionId)
      .single();

    if (existingActive) {
      await supabase
        .from('active_users')
        .update({ 
          last_activity: new Date().toISOString(),
          current_page: pagePath
        })
        .eq('id', existingActive.id);
    } else {
      await supabase
        .from('active_users')
        .insert([{
          subdomain_id: subdomainData.id,
          session_id: sessionId,
          current_page: pagePath,
          last_activity: new Date().toISOString(),
          user_agent: userAgent,
          ip_address: ipAddress
        }]);
    }

    // Update page views (daily aggregation)
    const today = new Date().toISOString().split('T')[0];
    const { data: existingPageView } = await supabase
      .from('page_views')
      .select('id, views, unique_visitors')
      .eq('subdomain_id', subdomainData.id)
      .eq('page_path', pagePath || '/')
      .eq('date', today)
      .single();

    if (existingPageView) {
      // Check if this session already counted for unique visitors today
      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('subdomain_id', subdomainData.id)
        .eq('session_id', sessionId)
        .eq('page_path', pagePath || '/')
        .gte('timestamp', today);

      await supabase
        .from('page_views')
        .update({
          views: existingPageView.views + 1,
          unique_visitors: count === 1 ? existingPageView.unique_visitors + 1 : existingPageView.unique_visitors
        })
        .eq('id', existingPageView.id);
    } else {
      await supabase
        .from('page_views')
        .insert([{
          subdomain_id: subdomainData.id,
          page_path: pagePath || '/',
          views: 1,
          unique_visitors: 1,
          date: today
        }]);
    }

    // If this is a public site, update explore_sites total_visits
    const { data: exploreSite } = await supabase
      .from('explore_sites')
      .select('id')
      .eq('subdomain_id', subdomainData.id)
      .single();

    if (exploreSite) {
      await supabase.rpc('increment_explore_visits', { site_id: exploreSite.id });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
