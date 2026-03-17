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

    const { subdomain } = event.queryStringParameters;

    // Generate 100 random passes for the wall
    const generatePasses = () => {
      const passes = [];
      const prefixes = ['Dev', 'Root', 'Sys', 'Core', 'Net', 'Web', 'Data', 'Code', 'Base', 'Star'];
      const suffixes = ['Pass', 'Key', 'Code', 'Token', 'Hash', 'Chip', 'Link', 'Port', 'Node', 'Path'];
      
      for (let i = 0; i < 100; i++) {
        const randomNum = Math.floor(Math.random() * 10000);
        const randomHex = Math.floor(Math.random() * 16777215).toString(16);
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        passes.push({
          pass: `${prefix}.${suffix}.${randomHex}.${randomNum}`,
          used: Math.random() > 0.7 // 30% chance of being "used"
        });
      }
      return passes;
    };

    const wallPasses = generatePasses();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        passes: wallPasses,
        timestamp: Date.now()
      })
    };

  } catch (error) {
    console.error('Error generating passes wall:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
