// GitHub API configuration
const GITHUB_OWNER = 'sussybocca';
const GITHUB_REPO = 'PackArcade';
const API_BASE = 'https://api.github.com';

// Cache for commits to avoid repeated API calls
let commitsCache = null;
let filesCache = new Map(); // commit SHA -> files

async function fetchCommits(perPage = 100) {
    if (commitsCache) return commitsCache;
    
    try {
        const response = await fetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=${perPage}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        
        const commits = await response.json();
        commitsCache = commits.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: new Date(commit.commit.author.date).toLocaleDateString(),
            html_url: commit.html_url
        }));
        return commitsCache;
    } catch (error) {
        console.error('Failed to fetch commits:', error);
        return [];
    }
}

async function fetchCommitFiles(sha) {
    if (filesCache.has(sha)) return filesCache.get(sha);
    
    try {
        const response = await fetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${sha}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        
        const data = await response.json();
        const files = data.files.map(file => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            raw_url: file.raw_url,
            contents_url: file.contents_url
        }));
        
        filesCache.set(sha, files);
        return files;
    } catch (error) {
        console.error(`Failed to fetch files for commit ${sha}:`, error);
        return [];
    }
}

async function fetchFileContent(rawUrl) {
    try {
        const response = await fetch(rawUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error('Error fetching file content:', error);
        return '// Error loading file content';
    }
}
