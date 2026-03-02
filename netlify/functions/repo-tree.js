const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = 'main'; // or your default branch

  if (!token || !owner || !repo) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GitHub configuration' }),
    };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get the reference of the branch to obtain the latest commit tree SHA
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    // 2. Get the commit details to retrieve the tree SHA
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });
    const treeSha = commitData.tree.sha;

    // 3. Get the full recursive tree (includes all files and subdirectories)
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: 1,
    });

    // Return only relevant fields: path, type, size, sha (optional)
    const items = treeData.tree.map(item => ({
      path: item.path,
      type: item.type, // 'blob' or 'tree'
      size: item.size, // only for blobs
      sha: item.sha,
    }));

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
