const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { files, subdomain } = JSON.parse(event.body);
  // files = { 'index.html': 'content', 'metadata.json': 'content' }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = 'main';

  if (!token || !owner || !repo) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing GitHub configuration' }),
    };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get branch reference
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    // 2. Get current commit tree
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create base path with subdomain
    const basePath = subdomain 
      ? `public/imagine/${subdomain}/`
      : 'public/imagine/';

    // 4. Create blobs and build tree
    const tree = await Promise.all(
      Object.entries(files).map(async ([filePath, content]) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content,
          encoding: 'utf-8',
        });
        return {
          path: `${basePath}${filePath}`,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      })
    );

    // 5. Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 6. Create commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `Add game: ${subdomain || 'unknown'} [skip ci]`,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // 7. Update branch
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
      force: false,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        subdomain,
        path: basePath
      }),
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
