// AWA.js – Arcade Web App Enhancer

(function() {
  // Store the install prompt event
  let deferredPrompt;

  // 1. Capture the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // Prevent the mini-infobar from appearing
    deferredPrompt = e;           // Save it for later use

    // Show your custom install button (if on launcher.html)
    const installContainer = document.getElementById('installContainer');
    if (installContainer) {
      installContainer.style.display = 'block';
    }
  });

  // 2. Handle the custom install button click
  document.addEventListener('click', async (event) => {
    if (event.target.id === 'installButton' && deferredPrompt) {
      deferredPrompt.prompt();    // Show the browser's install dialog
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      deferredPrompt = null;       // We can only use it once
    }
  });

  // 3. Detect standalone mode (app is installed)
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true; // iOS Safari
  }

  // 4. Enhance the app when running standalone
  if (isStandalone()) {
    // Add a custom title bar with buttons
    const header = document.createElement('header');
    header.id = 'awa-header';
    header.style.cssText = `
      background: #333; color: white; padding: 8px 16px;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 1000;
    `;
    header.innerHTML = `
      <span>Arcade Web App</span>
      <div>
        <button id="awa-settings">⚙️ Settings</button>
        <button id="awa-minimize">🗕</button>
        <button id="awa-close">🗙</button>
      </div>
    `;
    document.body.prepend(header);

    // Settings panel (hidden by default)
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'awa-settings-panel';
    settingsPanel.style.cssText = `
      display: none; background: #f0f0f0; padding: 16px;
      border: 1px solid #ccc; margin: 8px;
    `;
    settingsPanel.innerHTML = `
      <h3>AWA Settings</h3>
      <p>Welcome to the Arcade Web App!</p>
      <p><strong>Instructions:</strong> This app runs in its own window. Use the buttons above to navigate.</p>
      <button id="awa-close-settings">Close</button>
    `;
    document.body.appendChild(settingsPanel);

    // Event listeners for custom controls
    document.getElementById('awa-settings').addEventListener('click', () => {
      settingsPanel.style.display = 'block';
    });
    document.getElementById('awa-close-settings').addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
    document.getElementById('awa-minimize').addEventListener('click', () => {
      // Minimize is not possible via web APIs – you can only hide the window content
      alert('Minimize is handled by the OS (click the window title bar)');
    });
    document.getElementById('awa-close').addEventListener('click', () => {
      window.close(); // May not work in all browsers; otherwise just suggest closing.
    });

    // 5. Performance improvements (example: lazy loading images)
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
      // Fallback
      lazyImages.forEach(img => img.src = img.dataset.src);
    }

    // 6. Preload critical resources (optional)
    // You can add <link rel="preload"> tags dynamically.
  } else {
    // Not installed – maybe show a message on launcher.html
    const status = document.getElementById('statusMessage');
    if (status) {
      status.textContent = 'Click "Install AWA" to add this app to your device.';
    }
  }

  // 7. Listen for the app being successfully installed
  window.addEventListener('appinstalled', (evt) => {
    console.log('AWA was installed.');
    // Optionally redirect to the main app
    if (window.location.pathname.includes('launcher.html')) {
      window.location.href = '/';   // Go to the main site
    }
  });
})();
