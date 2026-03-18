// AWA.js – Arcade Web App Enhancer (Advanced Edition)
// This script enhances your PWA with a custom immersive UI, smarter installation flow,
// and performance optimizations. It runs on every page.

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    appName: 'Arcade Web App',
    headerColor: '#1a1f33',
    headerTextColor: '#ffffff',
    settingsPanelColor: '#f0f0f0',
    enableLazyLoading: true,
    enablePreload: true,
    installButtonSelector: '#installButton',      // Button on launcher.html
    installContainerSelector: '#installContainer', // Container on launcher.html
    statusMessageSelector: '#statusMessage'       // Status message element
  };

  // ==================== STATE ====================
  let deferredPrompt;                // Stores the beforeinstallprompt event
  let isStandalone = false;          // Whether app runs in standalone mode
  let settingsVisible = false;       // Tracks settings panel visibility
  let installAttempted = false;      // Track if installation was attempted

  // ==================== UTILITY FUNCTIONS ====================
  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true; // iOS Safari
  }

  // Safely get element by ID
  function $(id) {
    return document.getElementById(id);
  }

  // ==================== INSTALLATION FLOW ====================
  // 1. Capture the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();                 // Prevent the default mini-infobar
    deferredPrompt = e;                  // Save for later
    console.log('[AWA] Install prompt captured');

    // Show a custom install button on launcher.html if it exists
    const installContainer = $(CONFIG.installContainerSelector);
    if (installContainer) {
      installContainer.style.display = 'block';
    }

    // Also, if we're on any page and not installed, we could show a floating install button
    if (!isStandaloneMode() && !window.location.pathname.includes('launcher.html')) {
      showFloatingInstallButton();
    }
  });

  // 2. Handle clicks on the custom install button
  document.addEventListener('click', async (event) => {
    const isInstallButton = event.target.matches('#installButton, .awa-floating-install, #chromebook-install-btn');
    if (isInstallButton && deferredPrompt) {
      event.preventDefault();
      installAttempted = true;
      console.log('[AWA] Triggering installation prompt');
      
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[AWA] User install choice: ${outcome}`);
        
        if (outcome === 'accepted') {
          // Don't redirect - let the app stay on launcher.html
          // The appinstalled event will handle any UI updates
          console.log('[AWA] Installation accepted');
          
          // Update UI to show installed state
          const installContainer = $(CONFIG.installContainerSelector);
          if (installContainer) {
            installContainer.style.display = 'none';
          }
          
          // Show success message
          const statusMsg = $(CONFIG.statusMessageSelector);
          if (statusMsg) {
            statusMsg.textContent = '✓ App installed successfully! You can now launch it from your home screen.';
            statusMsg.style.color = '#4caf50';
          }
          
          // Hide floating button if it exists
          const floatingBtn = document.querySelector('.awa-floating-install');
          if (floatingBtn) floatingBtn.remove();
        }
      } catch (err) {
        console.error('[AWA] Installation error:', err);
      }
      
      deferredPrompt = null;  // Can only be used once
    }
  });

  // 3. Listen for successful installation
  window.addEventListener('appinstalled', (evt) => {
    console.log('[AWA] App was successfully installed.');
    
    // Update UI to show installed state
    const installContainer = $(CONFIG.installContainerSelector);
    if (installContainer) {
      installContainer.style.display = 'none';
    }
    
    const statusMsg = $(CONFIG.statusMessageSelector);
    if (statusMsg) {
      statusMsg.textContent = '✓ App is now installed! Launch from your home screen.';
      statusMsg.style.color = '#4caf50';
    }
    
    // Hide floating button
    const floatingBtn = document.querySelector('.awa-floating-install');
    if (floatingBtn) floatingBtn.remove();
    
    // Hide Chromebook badge if present
    const chromeBadge = document.getElementById('chromebook-badge-container');
    if (chromeBadge) chromeBadge.style.display = 'none';
  });

  // 4. Show a floating install button on any page if the app is not installed
  function showFloatingInstallButton() {
    // Avoid duplicates
    if (document.querySelector('.awa-floating-install')) return;

    const btn = document.createElement('button');
    btn.className = 'awa-floating-install';
    btn.textContent = '⬇️ Install Arcade Web App';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 40px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s, background 0.2s;
      border: 1px solid rgba(255,255,255,0.2);
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    document.body.appendChild(btn);
  }

  // 5. Manual install trigger for Chromebook badge
  window.triggerInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  };

  // ==================== STANDALONE ENHANCEMENTS ====================
  if (isStandaloneMode()) {
    console.log('[AWA] Running in standalone mode – applying immersive UI.');
    isStandalone = true;

    // 1. Create custom title bar
    const header = document.createElement('header');
    header.id = 'awa-header';
    header.style.cssText = `
      background: ${CONFIG.headerColor};
      color: ${CONFIG.headerTextColor};
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10000;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      user-select: none;
    `;
    header.innerHTML = `
      <span style="font-weight: 600; font-size: 1.2rem;">⚡ ${CONFIG.appName}</span>
      <div style="display: flex; gap: 8px;">
        <button id="awa-settings" class="awa-header-btn" title="Settings">⚙️</button>
        <button id="awa-minimize" class="awa-header-btn" title="Minimize">🗕</button>
        <button id="awa-close" class="awa-header-btn" title="Close">🗙</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .awa-header-btn {
        background: transparent;
        border: none;
        color: ${CONFIG.headerTextColor};
        font-size: 1.2rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .awa-header-btn:hover {
        background: rgba(255,255,255,0.2);
      }
    `;
    document.head.appendChild(style);
    document.body.prepend(header);

    // 2. Settings panel (hidden initially)
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'awa-settings-panel';
    settingsPanel.style.cssText = `
      display: none;
      position: fixed;
      top: 60px;
      right: 20px;
      width: 300px;
      background: ${CONFIG.settingsPanelColor};
      border: 1px solid #ccc;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      padding: 20px;
      z-index: 10001;
      font-family: 'Segoe UI', system-ui, sans-serif;
      backdrop-filter: blur(10px);
      background: rgba(255,255,255,0.95);
    `;
    settingsPanel.innerHTML = `
      <h3 style="margin-top:0; display: flex; justify-content: space-between; align-items: center;">
        ⚙️ AWA Settings
        <button id="awa-close-settings" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">✖</button>
      </h3>
      <p><strong>Welcome to the Arcade Web App!</strong></p>
      <p>This app runs in its own custom window. Use the header buttons to control the window.</p>
      <hr>
      <label>
        <input type="checkbox" id="awa-theme-toggle"> Dark Theme (experimental)
      </label>
      <hr>
      <p><strong>Instructions:</strong></p>
      <ul style="padding-left:20px;">
        <li><strong>Settings</strong> – opens this panel</li>
        <li><strong>Minimize</strong> – hides the content</li>
        <li><strong>Close</strong> – closes the app (if supported)</li>
      </ul>
      <p style="font-size:0.9rem; color:#666;">Version 2.0 | Made with ⚡</p>
    `;
    document.body.appendChild(settingsPanel);

    // 3. Event listeners for header buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'awa-settings' || e.target.closest('#awa-settings')) {
        e.preventDefault();
        settingsVisible = !settingsVisible;
        settingsPanel.style.display = settingsVisible ? 'block' : 'none';
      }
      if (e.target.id === 'awa-close-settings' || e.target.closest('#awa-close-settings')) {
        settingsVisible = false;
        settingsPanel.style.display = 'none';
      }
      if (e.target.id === 'awa-minimize' || e.target.closest('#awa-minimize')) {
        e.preventDefault();
        const allChildren = document.body.children;
        for (let child of allChildren) {
          if (child.id !== 'awa-header' && child.id !== 'awa-settings-panel') {
            child.style.display = child.style.display === 'none' ? '' : 'none';
          }
        }
      }
      if (e.target.id === 'awa-close' || e.target.closest('#awa-close')) {
        e.preventDefault();
        if (confirm('Close Arcade Web App?')) {
          window.close();
        }
      }
    });

    // 4. Theme toggle
    const themeToggle = document.getElementById('awa-theme-toggle');
    if (themeToggle) {
      const savedTheme = localStorage.getItem('awa-dark-theme');
      if (savedTheme === 'true') {
        document.body.classList.add('awa-dark-theme');
        themeToggle.checked = true;
      }
      themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          document.body.classList.add('awa-dark-theme');
          localStorage.setItem('awa-dark-theme', 'true');
        } else {
          document.body.classList.remove('awa-dark-theme');
          localStorage.setItem('awa-dark-theme', 'false');
        }
      });
    }

    // 5. Performance improvements
    if (CONFIG.enableLazyLoading) {
      const lazyImages = document.querySelectorAll('img[data-src]');
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              observer.unobserve(img);
            }
          });
        });
        lazyImages.forEach(img => observer.observe(img));
      } else {
        lazyImages.forEach(img => img.src = img.dataset.src);
      }
    }

    if (CONFIG.enablePreload) {
      const preloadLinks = [
        { rel: 'preload', as: 'image', href: '/icons/favicon.png' }
      ];
      preloadLinks.forEach(link => {
        const l = document.createElement('link');
        l.rel = link.rel;
        l.as = link.as;
        l.href = link.href;
        document.head.appendChild(l);
      });
    }

    document.body.classList.add('awa-enhanced');
  } else {
    // Not installed – show message on launcher.html if needed
    const statusMsg = $(CONFIG.statusMessageSelector);
    if (statusMsg && !installAttempted) {
      statusMsg.textContent = 'Click "Install AWA" to add this app to your device.';
    }
  }

  // ==================== ADDITIONAL FEATURES ====================
  if (document.referrer === '' && isStandalone) {
    console.log('[AWA] Launched from home screen.');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('[AWA] App hidden – you could pause game logic here.');
    } else {
      console.log('[AWA] App visible again.');
    }
  });

  // Expose API for other scripts
  window.AWA = {
    isStandalone: () => isStandalone,
    showSettings: () => { if (settingsPanel) settingsPanel.style.display = 'block'; },
    hideSettings: () => { if (settingsPanel) settingsPanel.style.display = 'none'; },
    triggerInstall: () => { if (deferredPrompt) deferredPrompt.prompt(); },
    config: CONFIG
  };

  console.log('[AWA] Enhancer initialized.');
})();
