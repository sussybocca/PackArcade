// This file serves as the main entry point and handles any additional initialization
console.log('PackArcade Time Portal initialized');

// Add any global event listeners or features here
window.addEventListener('error', (e) => {
    console.error('Portal error:', e.error);
});

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentView === 'commit') {
        document.querySelector('.back-btn')?.click();
    }
});
