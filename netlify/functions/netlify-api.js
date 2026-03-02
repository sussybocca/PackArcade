// netlify/functions/netlify-api.js
const fetch = require('node-fetch');

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const token = process.env.NETLIFY_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Netlify token' }),
    };
  }

  const params = event.queryStringParameters || {};
  const resource = params.resource;

  if (!resource) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing resource parameter' }),
    };
  }

  // Special internal resource to return site ID
  if (resource === 'site-id') {
    const siteId = process.env.NETLIFY_SITE_ID;
    if (!siteId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Site ID not configured on server' }),
      };
    }
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
    };
  }

  // For other resources, site ID can come from query or env
  const siteId = params.siteId || process.env.NETLIFY_SITE_ID;
  if (!siteId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing siteId (provide as query param or env var)' }),
    };
  }

  // Replace {site_id} placeholder with actual site ID
  const path = resource.replace('{site_id}', siteId);
  const url = `${NETLIFY_API_BASE}/${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Netlify API error: ${response.statusText}` }),
      };
    }

    let data = await response.json();

    // If this is the environment variables endpoint, mask the values
    if (resource.includes('env') || resource.includes('environment')) {
      data = maskEnvValues(data);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Netlify API proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Recursively mask env var values
function maskEnvValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => maskEnvValues(item));
  }
  if (obj && typeof obj === 'object') {
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'value' || key === 'values' || (typeof value === 'string' && value.length > 0)) {
        masked[key] = '••••••••';
      } else if (typeof value === 'object') {
        masked[key] = maskEnvValues(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
  return obj;
}
