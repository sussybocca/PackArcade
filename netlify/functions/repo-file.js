const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const filePath = event.queryStringParameters?.path;
  if (!filePath) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing path parameter' }),
    };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GitHub configuration' }),
    };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Get the file content from GitHub (returns base64 encoded)
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if (Array.isArray(data)) {
      // It's a directory, not a file
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Path is a directory' }),
      };
    }

    // Decode content if it's a text file (you may want to check encoding)
    // 'data.content' is base64, but might be wrapped with newlines; clean it.
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain; charset=utf-8' 
      },
      body: content,
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    // If file not found, return 404
    if (error.status === 404) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
