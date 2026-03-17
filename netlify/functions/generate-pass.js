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

    const { subdomain, sessionId } = JSON.parse(event.body);

    // Generate a random Dev.pass (strong password)
    const generateDevPass = () => {
      const length = 16;
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      return 'Dev.' + password;
    };

    const devPass = generateDevPass();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store the pass in Supabase
    const { data: passData, error: passError } = await supabase
      .from('dev_passes')
      .insert([{
        pass_code: devPass,
        subdomain: subdomain,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        is_used: false
      }])
      .select()
      .single();

    if (passError) throw passError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        pass: devPass,
        expires: expiresAt
      })
    };

  } catch (error) {
    console.error('Error generating pass:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
