const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const host = event.headers.host;
    const subdomain = host.split('.')[0];
    const path = event.path;

    // First check if it's a game subdomain (from your list)
    const gameSubdomains = [
      'nebula', 'samurai', 'quantum', 'luma', 'space', 'mario',
      'tetris', 'pacman', '2048', 'flappy', 'slope', 'subway',
      'minecraft', 'geometry', 'run', 'run3', 'fruitninja',
      'cookieclicker', 'bitlife', 'bloonstd', 'angrybirds', 'ageofwar'
    ];

    if (gameSubdomains.includes(subdomain)) {
      // Let Netlify handle these via redirects
      return {
        statusCode: 404,
        body: 'Not found'
      };
    }

    // Check if it's a user subdomain
    const { data: subdomainData } = await supabase
      .from('subdomains')
      .select('id')
      .eq('subdomain_name', subdomain)
      .eq('is_active', true)
      .single();

    if (!subdomainData) {
      // Not a user subdomain, let other redirects handle it
      return {
        statusCode: 404,
        body: 'Not found'
      };
    }

    // Get the requested file
    let filePath = path === '/' ? '/index.html' : path;
    
    const { data: file } = await supabase
      .from('files')
      .select('file_content, file_name, file_type')
      .eq('subdomain_id', subdomainData.id)
      .eq('file_path', '/')
      .eq('file_name', filePath.split('/').pop() || 'index.html')
      .single();

    if (!file) {
      // Try to find index.html if file not found
      const { data: indexFile } = await supabase
        .from('files')
        .select('file_content, file_name, file_type')
        .eq('subdomain_id', subdomainData.id)
        .eq('file_path', '/')
        .eq('file_name', 'index.html')
        .single();

      if (indexFile) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': getContentType('index.html'),
            'Access-Control-Allow-Origin': '*'
          },
          body: indexFile.file_content
        };
      }

      return {
        statusCode: 404,
        body: 'File not found'
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': getContentType(file.file_name),
        'Access-Control-Allow-Origin': '*'
      },
      body: file.file_content
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};

function getContentType(filename) {
  const ext = filename.split('.').pop();
  const types = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain'
  };
  return types[ext] || 'text/plain';
}
