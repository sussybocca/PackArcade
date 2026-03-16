const { NetlifyAPI } = require('netlify');

const netlify = new NetlifyAPI(process.env.NETLIFY_TOKEN);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { subdomain } = JSON.parse(event.body);
    const siteId = process.env.NETLIFY_SITE_ID;

    if (!subdomain) {
      throw new Error('Subdomain is required');
    }

    // Validate subdomain format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain)) {
      throw new Error('Invalid subdomain format');
    }

    // Check if subdomain already exists in your site
    const site = await netlify.getSite({ siteId });
    const existingDomains = site.domain_aliases || [];

    const fullDomain = `${subdomain}.packarcade.xyz`;

    if (existingDomains.includes(fullDomain)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Subdomain already exists',
          domain: fullDomain
        })
      };
    }

    // Add new domain alias
    const updatedSite = await netlify.updateSite({
      siteId,
      body: {
        domain_aliases: [...existingDomains, fullDomain]
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        domain: fullDomain,
        aliases: updatedSite.domain_aliases
      })
    };

  } catch (error) {
    console.error('Subdomain creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
