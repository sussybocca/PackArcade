// netlify/functions/verify-password.js
exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { password } = JSON.parse(event.body);
    const adminPassword = process.env.ADMIN_PASSWORD; // set in Netlify dashboard

    // Compare (simple string comparison; consider using constant-time comparison in production)
    const allowed = password === adminPassword;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow your studio domain
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ allowed }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request' }),
    };
  }
};
