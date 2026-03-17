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

    const { subdomain, range = '24h', sessionId } = event.queryStringParameters;

    // Get subdomain ID with ownership check
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

    // Verify ownership (you'd need to check sessionId against user_id)
    // This is simplified - you'd want proper auth

    // Calculate time range
    const now = new Date();
    let startTime;
    switch(range) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    // Get real-time active users
    const { data: activeUsers } = await supabase
      .from('active_users')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .gt('last_activity', new Date(now - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    // Get analytics events
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false });

    // Get page views aggregated by day
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('*')
      .eq('subdomain_id', subdomainData.id)
      .gte('date', startTime.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Calculate statistics
    const totalViews = events?.length || 0;
    const uniqueVisitors = new Set(events?.map(e => e.session_id)).size;
    const bounceRate = events ? calculateBounceRate(events) : 0;
    const avgDuration = events ? calculateAvgDuration(events) : 0;

    // Get device breakdown
    const devices = events?.reduce((acc, e) => {
      acc[e.device_type] = (acc[e.device_type] || 0) + 1;
      return acc;
    }, {});

    // Get browser breakdown
    const browsers = events?.reduce((acc, e) => {
      acc[e.browser] = (acc[e.browser] || 0) + 1;
      return acc;
    }, {});

    // Get top pages
    const topPages = events?.reduce((acc, e) => {
      if (e.page_path) {
        acc[e.page_path] = (acc[e.page_path] || 0) + 1;
      }
      return acc;
    }, {});

    // Sort and format top pages
    const sortedPages = Object.entries(topPages || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // Get hourly breakdown for chart
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now - i * 60 * 60 * 1000);
      const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
      const count = events?.filter(e => {
        const eventHour = new Date(e.timestamp).getHours();
        return eventHour === hour.getHours();
      }).length || 0;
      hourlyData.unshift({ hour: hourStr, views: count });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        realtime: {
          activeNow: activeUsers?.length || 0,
          activeUsers: activeUsers || []
        },
        summary: {
          totalViews,
          uniqueVisitors,
          bounceRate: Math.round(bounceRate * 100) / 100,
          avgDuration: Math.round(avgDuration)
        },
        devices: devices || {},
        browsers: browsers || {},
        topPages: sortedPages,
        hourlyData,
        pageViews: pageViews || [],
        events: events?.slice(0, 100) || [] // Last 100 events
      })
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

function calculateBounceRate(events) {
  const sessions = {};
  events.forEach(e => {
    if (!sessions[e.session_id]) {
      sessions[e.session_id] = [];
    }
    sessions[e.session_id].push(e);
  });
  
  let bounces = 0;
  Object.values(sessions).forEach(sessionEvents => {
    if (sessionEvents.length === 1) {
      bounces++;
    }
  });
  
  return (bounces / Object.keys(sessions).length) * 100;
}

function calculateAvgDuration(events) {
  const sessions = {};
  events.forEach(e => {
    if (!sessions[e.session_id]) {
      sessions[e.session_id] = { min: null, max: null };
    }
    const time = new Date(e.timestamp).getTime();
    if (!sessions[e.session_id].min || time < sessions[e.session_id].min) {
      sessions[e.session_id].min = time;
    }
    if (!sessions[e.session_id].max || time > sessions[e.session_id].max) {
      sessions[e.session_id].max = time;
    }
  });
  
  let totalDuration = 0;
  let sessionCount = 0;
  Object.values(sessions).forEach(s => {
    if (s.min && s.max && s.max > s.min) {
      totalDuration += (s.max - s.min) / 1000; // seconds
      sessionCount++;
    }
  });
  
  return sessionCount > 0 ? totalDuration / sessionCount : 0;
}
