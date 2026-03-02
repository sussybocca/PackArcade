// netlify/functions/push-to-github.js
const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { files } = JSON.parse(event.body); // files = { 'path/to/file.js': 'content', ... }
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = 'main'; // or your default branch name

  if (!token || !owner || !repo) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GitHub configuration' }),
    };
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get the reference of the branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    // 2. Get the current commit and its tree
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for each file and build a new tree
    const tree = await Promise.all(
      Object.entries(files).map(async ([filePath, content]) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content,
          encoding: 'utf-8',
        });
        return {
          path: `public/imagine/${filePath}`, // all files go under public/imagine/
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      })
    );

    // 4. Create a new tree based on the current one + our new blobs
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 5. Create a commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: 'Auto‑push from PackGames studio [skip ci]',
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // 6. Update the branch reference to point to the new commit
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
      force: false,
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
