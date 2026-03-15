// State management
let currentView = 'timeline'; // 'timeline' or 'commit'
let currentCommitSha = null;
let currentCommitData = null;

// Render the commit timeline
async function renderCommitList(container) {
    const template = document.getElementById('commit-list-template');
    const clone = template.content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(clone);
    
    const commits = await fetchCommits();
    const grid = document.getElementById('commit-grid');
    
    for (const commit of commits) {
        const cardTemplate = document.getElementById('commit-card-template');
        const cardClone = cardTemplate.content.cloneNode(true);
        
        // Fill in commit data
        cardClone.querySelector('.commit-hash').textContent = commit.sha.substring(0, 7);
        cardClone.querySelector('.commit-date').textContent = commit.date;
        cardClone.querySelector('.commit-message').textContent = commit.message;
        cardClone.querySelector('.commit-author').innerHTML = `👤 ${commit.author}`;
        
        // Add click handler
        const btn = cardClone.querySelector('.view-commit-btn');
        btn.addEventListener('click', () => viewCommit(commit.sha));
        
        grid.appendChild(cardClone);
    }
}

// View a specific commit
async function viewCommit(sha) {
    currentView = 'commit';
    currentCommitSha = sha;
    
    const app = document.getElementById('app');
    const template = document.getElementById('commit-viewer-template');
    const clone = template.content.cloneNode(true);
    app.innerHTML = '';
    app.appendChild(clone);
    
    // Fetch commit details
    const commits = await fetchCommits();
    const commit = commits.find(c => c.sha === sha);
    if (!commit) return;
    
    document.getElementById('commit-hash-display').textContent = sha.substring(0, 7);
    document.getElementById('commit-message-display').textContent = commit.message;
    
    // Fetch and display files
    const files = await fetchCommitFiles(sha);
    renderFileTree(files);
    
    // Back button handler
    document.querySelector('.back-btn').addEventListener('click', () => {
        currentView = 'timeline';
        renderCommitList(app);
    });
}

// Render file tree for a commit
function renderFileTree(files) {
    const treeContainer = document.getElementById('file-tree');
    treeContainer.innerHTML = '<h4 style="margin-top:0;">Files changed</h4>';
    
    const fileList = document.createElement('ul');
    fileList.style.listStyle = 'none';
    fileList.style.padding = '0';
    
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file';
        li.textContent = file.filename.split('/').pop(); // Show just filename
        li.title = file.filename; // Full path on hover
        
        // Add status indicator
        const statusSpan = document.createElement('span');
        statusSpan.style.marginLeft = '0.5rem';
        statusSpan.style.fontSize = '0.8rem';
        statusSpan.style.padding = '0.2rem 0.4rem';
        statusSpan.style.borderRadius = '4px';
        
        switch(file.status) {
            case 'added':
                statusSpan.style.background = '#238636';
                statusSpan.textContent = 'A';
                break;
            case 'modified':
                statusSpan.style.background = '#f0883e';
                statusSpan.textContent = 'M';
                break;
            case 'removed':
                statusSpan.style.background = '#da3633';
                statusSpan.textContent = 'D';
                break;
        }
        
        li.appendChild(statusSpan);
        
        // Click handler to preview file
        li.addEventListener('click', () => previewFile(file));
        fileList.appendChild(li);
    });
    
    treeContainer.appendChild(fileList);
}

// Preview a file's content
async function previewFile(file) {
    const previewContainer = document.getElementById('file-preview');
    previewContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const content = await fetchFileContent(file.raw_url);
        const fileExt = file.filename.split('.').pop();
        
        let formattedContent = content;
        if (fileExt === 'html' || fileExt === 'htm') {
            // Show HTML preview in an iframe
            previewContainer.innerHTML = `
                <div class="preview-content">
                    <h4>${file.filename}</h4>
                    <iframe srcdoc="${escapeHtml(content)}" style="width:100%; height:500px; border:1px solid #30363d; border-radius:4px;"></iframe>
                </div>
            `;
        } else {
            // Show code with syntax highlighting (using marked for markdown, otherwise plain)
            previewContainer.innerHTML = `
                <div class="preview-content">
                    <h4>${file.filename}</h4>
                    <pre><code class="language-${fileExt}">${escapeHtml(content)}</code></pre>
                </div>
            `;
        }
    } catch (error) {
        previewContainer.innerHTML = `<div class="error">Failed to load file: ${error.message}</div>`;
    }
}

// Helper to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app
async function initApp() {
    const app = document.getElementById('app');
    await renderCommitList(app);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
