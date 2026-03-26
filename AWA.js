// AWA.js – Arcade Web App Enhancer (Ultimate Edition)
// Complete PWA enhancement with iOS support, custom UI, and advanced features

(function() {
  'use strict';

  // ==================== ADVANCED CONFIGURATION ====================
  const CONFIG = {
    appName: 'Arcade Web App',
    appIcon: '🎮',
    theme: {
      light: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        accent: '#10b981'
      },
      dark: {
        primary: '#818cf8',
        secondary: '#a78bfa',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        accent: '#34d399'
      }
    },
    features: {
      enableGestures: true,
      enableSplashScreen: true,
      enableOfflineSupport: true,
      enablePushNotifications: true,
      enableBackgroundSync: true,
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableCustomShortcuts: true
    },
    splashScreenDuration: 2000,
    animations: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };

  // ==================== STATE MANAGEMENT ====================
  let state = {
    deferredPrompt: null,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    settingsVisible: false,
    theme: 'light',
    online: navigator.onLine,
    installAttempted: false,
    performanceMetrics: {},
    shortcuts: [],
    gestures: {
      swipeX: 0,
      swipeY: 0,
      startX: 0,
      startY: 0
    }
  };

  // ==================== DETECT PLATFORM ====================
  function detectPlatform() {
    const ua = navigator.userAgent;
    state.isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    state.isAndroid = /Android/.test(ua);
    state.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: fullscreen)').matches;
    
    // iOS specific detection
    if (state.isIOS) {
      document.body.classList.add('ios-device');
      if (state.isStandalone) {
        document.body.classList.add('ios-standalone');
      }
    }
  }

  // ==================== iOS SPECIFIC ENHANCEMENTS ====================
  function setupIOS() {
    if (!state.isIOS) return;

    // Hide default Safari UI when in standalone mode
    if (state.isStandalone) {
      // Add iOS status bar padding
      const statusBarHeight = window.innerHeight - document.documentElement.clientHeight;
      if (statusBarHeight > 0) {
        document.body.style.paddingTop = `${statusBarHeight}px`;
      }

      // Enable swipe gestures for navigation
      if (CONFIG.features.enableGestures) {
        setupGestures();
      }

      // Add iOS-style home indicator
      addHomeIndicator();
    }

    // Show iOS installation guide if not installed
    if (!state.isStandalone) {
      showIOSInstallGuide();
    }

    // Handle iOS safe areas
    setupSafeAreas();
  }

  function addHomeIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'awa-home-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 5px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      z-index: 10002;
      pointer-events: none;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(indicator);

    // Auto-hide after inactivity
    let hideTimeout;
    const resetTimer = () => {
      clearTimeout(hideTimeout);
      indicator.style.opacity = '1';
      hideTimeout = setTimeout(() => {
        indicator.style.opacity = '0';
      }, 3000);
    };
    
    ['touchstart', 'touchend', 'scroll'].forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    resetTimer();
  }

  function setupSafeAreas() {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);

    // Add CSS for safe areas
    const style = document.createElement('style');
    style.textContent = `
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);
  }

  function setupGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (Math.max(absDx, absDy) > 50) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) {
            triggerEvent('swipeRight');
          } else {
            triggerEvent('swipeLeft');
          }
        } else {
          // Vertical swipe
          if (dy > 0) {
            triggerEvent('swipeDown');
          } else {
            triggerEvent('swipeUp');
          }
        }
      }
    });
  }

  function showIOSInstallGuide() {
    if (localStorage.getItem('ios-guide-shown')) return;
    
    const guide = document.createElement('div');
    guide.className = 'awa-ios-guide';
    guide.innerHTML = `
      <div style="background: white; border-radius: 20px; padding: 20px; max-width: 280px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
        <h3 style="margin: 0 0 10px 0;">Install This App</h3>
        <p style="margin: 0 0 15px 0; color: #666;">Add to home screen for the best experience</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span>1️⃣</span>
            <span>Tap</span>
            <span style="font-size: 24px;">⬆️</span>
            <span>Share</span>
          </div>
          <div style="margin: 10px 0;">👇</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span>2️⃣</span>
            <span>Tap</span>
            <span style="font-size: 24px;">➕</span>
            <span>Add to Home Screen</span>
          </div>
        </div>
        <button id="close-ios-guide" style="background: #007aff; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; cursor: pointer;">
          Got it
        </button>
      </div>
    `;
    guide.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.3s;
    `;
    
    document.body.appendChild(guide);
    
    document.getElementById('close-ios-guide').onclick = () => {
      guide.remove();
      localStorage.setItem('ios-guide-shown', 'true');
    };
  }

  // ==================== ADVANCED CUSTOM HEADER ====================
  function createCustomHeader() {
    const header = document.createElement('header');
    header.id = 'awa-header';
    const currentTheme = CONFIG.theme[state.theme];
    
    header.style.cssText = `
      background: ${currentTheme.primary};
      color: ${currentTheme.text};
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      backdrop-filter: blur(10px);
      transition: all ${CONFIG.animations.duration}ms ${CONFIG.animations.easing};
    `;
    
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">${CONFIG.appIcon}</span>
        <span style="font-weight: 600; font-size: 1.1rem;">${CONFIG.appName}</span>
        ${!state.isStandalone && !state.isIOS ? '<span style="font-size: 10px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px;">Web App</span>' : ''}
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="awa-header-btn" data-action="search" title="Search">🔍</button>
        <button class="awa-header-btn" data-action="share" title="Share">📤</button>
        <button class="awa-header-btn" data-action="theme" title="Theme">🌓</button>
        <button class="awa-header-btn" data-action="settings" title="Settings">⚙️</button>
        ${!state.isStandalone ? '<button class="awa-header-btn" data-action="install" title="Install">📲</button>' : ''}
        <button class="awa-header-btn" data-action="minimize" title="Minimize">🗕</button>
        <button class="awa-header-btn" data-action="close" title="Close">🗙</button>
      </div>
    `;
    
    document.body.prepend(header);
    setupHeaderActions();
  }

  function setupHeaderActions() {
    const actions = {
      search: () => showSearchModal(),
      share: () => shareApp(),
      theme: () => toggleTheme(),
      settings: () => toggleSettingsPanel(),
      install: () => triggerInstall(),
      minimize: () => toggleMinimize(),
      close: () => closeApp()
    };
    
    document.querySelectorAll('.awa-header-btn').forEach(btn => {
      const action = btn.dataset.action;
      if (actions[action]) {
        btn.addEventListener('click', actions[action]);
      }
    });
  }

  // ==================== SEARCH MODAL ====================
  function showSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'awa-modal';
    modal.innerHTML = `
      <div class="awa-modal-content" style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">🔍 Search</h2>
          <button class="awa-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">✖</button>
        </div>
        <input type="text" id="awa-search-input" placeholder="Search content..." style="
          width: 100%;
          padding: 12px;
          border: 2px solid ${CONFIG.theme[state.theme].border};
          border-radius: 12px;
          font-size: 16px;
          margin-bottom: 20px;
        ">
        <div id="awa-search-results"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const searchInput = document.getElementById('awa-search-input');
    const resultsDiv = document.getElementById('awa-search-results');
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
      }
      
      // Search through page content
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            if (node.parentElement && 
                !node.parentElement.closest('.awa-modal') &&
                node.textContent.trim().length > 0) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      while(walker.nextNode()) {
        const text = walker.currentNode.textContent.toLowerCase();
        if (text.includes(query)) {
          textNodes.push(walker.currentNode.parentElement);
        }
      }
      
      const uniqueElements = [...new Set(textNodes)];
      if (uniqueElements.length === 0) {
        resultsDiv.innerHTML = '<p>No results found</p>';
      } else {
        resultsDiv.innerHTML = uniqueElements.map(el => `
          <div class="search-result" data-element="${el.id || Math.random()}" style="
            padding: 10px;
            margin: 5px 0;
            background: ${CONFIG.theme[state.theme].surface};
            border-radius: 8px;
            cursor: pointer;
          ">
            ${el.textContent.substring(0, 100)}...
          </div>
        `).join('');
        
        document.querySelectorAll('.search-result').forEach(result => {
          result.addEventListener('click', () => {
            const element = uniqueElements[result.dataset.element];
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.animation = 'highlight 1s';
            setTimeout(() => {
              element.style.animation = '';
            }, 1000);
            modal.remove();
          });
        });
      }
    });
    
    modal.querySelector('.awa-modal-close').addEventListener('click', () => modal.remove());
  }

  // ==================== SHARE FUNCTIONALITY ====================
  async function shareApp() {
    const shareData = {
      title: CONFIG.appName,
      text: 'Check out this amazing web app!',
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Sharing failed', 'error');
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  }

  // ==================== THEME MANAGEMENT ====================
  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('awa-theme', state.theme);
    applyTheme();
    showToast(`${state.theme === 'light' ? '☀️' : '🌙'} ${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)} mode activated`, 'info');
  }

  function applyTheme() {
    const theme = CONFIG.theme[state.theme];
    const root = document.documentElement;
    
    Object.keys(theme).forEach(key => {
      root.style.setProperty(`--awa-${key}`, theme[key]);
    });
    
    // Update header background
    const header = document.getElementById('awa-header');
    if (header) {
      header.style.background = theme.primary;
      header.style.color = theme.text;
    }
    
    // Update settings panel if visible
    const settingsPanel = document.getElementById('awa-settings-panel');
    if (settingsPanel) {
      settingsPanel.style.background = theme.surface;
      settingsPanel.style.color = theme.text;
      settingsPanel.style.borderColor = theme.border;
    }
    
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    
    // Add theme class for CSS customizations
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${state.theme}`);
  }

  // ==================== ADVANCED SETTINGS PANEL ====================
  function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'awa-settings-panel';
    const theme = CONFIG.theme[state.theme];
    
    panel.style.cssText = `
      display: none;
      position: fixed;
      top: 70px;
      right: 20px;
      width: 350px;
      max-width: calc(100% - 40px);
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      padding: 20px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      backdrop-filter: blur(20px);
      transition: all ${CONFIG.animations.duration}ms ${CONFIG.animations.easing};
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.5rem;">⚙️ Settings</h2>
        <button id="close-settings" style="background: none; border: none; font-size: 24px; cursor: pointer;">✖</button>
      </div>
      
      <div class="settings-section">
        <h3>🎨 Appearance</h3>
        <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span>Dark Mode</span>
          <input type="checkbox" id="theme-toggle" ${state.theme === 'dark' ? 'checked' : ''}>
        </label>
        <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span>Reduce Motion</span>
          <input type="checkbox" id="reduce-motion">
        </label>
      </div>
      
      <div class="settings-section">
        <h3>📱 App Settings</h3>
        <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span>Enable Gestures</span>
          <input type="checkbox" id="enable-gestures" ${CONFIG.features.enableGestures ? 'checked' : ''}>
        </label>
        <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span>Offline Support</span>
          <input type="checkbox" id="offline-support" ${CONFIG.features.enableOfflineSupport ? 'checked' : ''}>
        </label>
      </div>
      
      <div class="settings-section">
        <h3>💾 Storage</h3>
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Cache Size</span>
            <span id="cache-size">Calculating...</span>
          </div>
          <button id="clear-cache" style="margin-top: 10px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Clear Cache
          </button>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>ℹ️ About</h3>
        <p><strong>${CONFIG.appName}</strong> v2.0.0</p>
        <p>Enhanced PWA with advanced features</p>
        <button id="export-settings" style="padding: 8px 16px; background: ${theme.primary}; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">
          Export Settings
        </button>
        <button id="reset-settings" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Reset
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    setupSettingsHandlers(panel);
  }

  function setupSettingsHandlers(panel) {
    const closeBtn = document.getElementById('close-settings');
    const themeToggle = document.getElementById('theme-toggle');
    const reduceMotion = document.getElementById('reduce-motion');
    const enableGestures = document.getElementById('enable-gestures');
    const offlineSupport = document.getElementById('offline-support');
    const clearCache = document.getElementById('clear-cache');
    const exportSettings = document.getElementById('export-settings');
    const resetSettings = document.getElementById('reset-settings');
    
    closeBtn.onclick = () => toggleSettingsPanel();
    
    themeToggle.onchange = (e) => {
      state.theme = e.target.checked ? 'dark' : 'light';
      localStorage.setItem('awa-theme', state.theme);
      applyTheme();
    };
    
    reduceMotion.onchange = (e) => {
      document.body.style.transition = e.target.checked ? 'none' : '';
      localStorage.setItem('reduce-motion', e.target.checked);
    };
    
    enableGestures.onchange = (e) => {
      CONFIG.features.enableGestures = e.target.checked;
      localStorage.setItem('enable-gestures', e.target.checked);
    };
    
    offlineSupport.onchange = (e) => {
      CONFIG.features.enableOfflineSupport = e.target.checked;
      localStorage.setItem('offline-support', e.target.checked);
      if (e.target.checked) setupOfflineSupport();
    };
    
    clearCache.onclick = async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        showToast('Cache cleared successfully!', 'success');
        updateCacheSize();
      }
    };
    
    exportSettings.onclick = () => {
      const settings = {
        theme: state.theme,
        features: CONFIG.features,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'awa-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported!', 'success');
    };
    
    resetSettings.onclick = () => {
      localStorage.clear();
      location.reload();
    };
    
    updateCacheSize();
  }

  async function updateCacheSize() {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        let totalSize = 0;
        for (const key of keys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const request of requests) {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        const cacheSizeElem = document.getElementById('cache-size');
        if (cacheSizeElem) {
          cacheSizeElem.textContent = `${sizeInMB} MB`;
        }
      } catch (err) {
        console.error('Error calculating cache size:', err);
      }
    }
  }

  function toggleSettingsPanel() {
    const panel = document.getElementById('awa-settings-panel');
    if (panel) {
      state.settingsVisible = !state.settingsVisible;
      panel.style.display = state.settingsVisible ? 'block' : 'none';
      
      if (state.settingsVisible) {
        updateCacheSize();
      }
    }
  }

  // ==================== TOAST NOTIFICATIONS ====================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'awa-toast';
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: ${colors[type]};
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 500;
      z-index: 20000;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==================== OFFLINE SUPPORT ====================
  function setupOfflineSupport() {
    window.addEventListener('online', () => {
      state.online = true;
      showToast('Back online! 🎉', 'success');
      document.body.classList.remove('offline-mode');
    });
    
    window.addEventListener('offline', () => {
      state.online = false;
      showToast('You are offline. Some features may be limited.', 'warning');
      document.body.classList.add('offline-mode');
    });
    
    // Cache current page for offline access
    if ('caches' in window && CONFIG.features.enableOfflineSupport) {
      caches.open('awa-cache-v1').then(cache => {
        cache.addAll([
          '/',
          window.location.pathname,
          ...Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src]')).map(el => el.href || el.src)
        ]);
      });
    }
  }

  // ==================== PERFORMANCE MONITORING ====================
  function monitorPerformance() {
    if (!CONFIG.features.enablePerformanceMonitoring) return;
    
    // Monitor FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    function measureFPS() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        state.performanceMetrics.fps = Math.round(fps);
        frameCount = 0;
        lastTime = now;
        
        if (fps < 30) {
          console.warn('[AWA] Low FPS detected:', fps);
        }
      }
      requestAnimationFrame(measureFPS);
    }
    requestAnimationFrame(measureFPS);
    
    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        state.performanceMetrics.memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }, 5000);
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[AWA] Long task detected:', entry);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // ==================== KEYBOARD SHORTCUTS ====================
  function setupKeyboardShortcuts() {
    if (!CONFIG.features.enableCustomShortcuts) return;
    
    const shortcuts = {
      '?': () => showShortcutsHelp(),
      's': () => toggleSettingsPanel(),
      'd': () => toggleTheme(),
      'f': () => toggleFullscreen(),
      'esc': () => closeModal()
    };
    
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
      
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        showSearchModal();
      }
    });
  }
  
  function showShortcutsHelp() {
    const modal = document.createElement('div');
    modal.className = 'awa-modal';
    modal.innerHTML = `
      <div class="awa-modal-content">
        <h2>⌨️ Keyboard Shortcuts</h2>
        <ul style="list-style: none; padding: 0;">
          <li><strong>?</strong> - Show this help</li>
          <li><strong>S</strong> - Open settings</li>
          <li><strong>D</strong> - Toggle dark mode</li>
          <li><strong>F</strong> - Toggle fullscreen</li>
          <li><strong>Ctrl/Cmd + K</strong> - Search</li>
          <li><strong>Esc</strong> - Close modals</li>
        </ul>
        <button class="close-modal">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-modal').onclick = () => modal.remove();
  }
  
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      showToast('Fullscreen mode activated', 'info');
    } else {
      document.exitFullscreen();
      showToast('Exited fullscreen mode', 'info');
    }
  }
  
  function closeModal() {
    const modals = document.querySelectorAll('.awa-modal');
    modals.forEach(modal => modal.remove());
  }

  // ==================== INSTALLATION HANDLING ====================
  function setupInstallHandlers() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredPrompt = e;
      console.log('[AWA] Install prompt captured');
      
      if (!state.isStandalone && !state.installAttempted) {
        showInstallPrompt();
      }
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('[AWA] App installed successfully');
      state.installAttempted = true;
      showToast('App installed successfully! 🎉', 'success');
      
      const installButtons = document.querySelectorAll('[data-action="install"]');
      installButtons.forEach(btn => btn.style.display = 'none');
    });
  }
  
  function showInstallPrompt() {
    if (document.querySelector('.awa-install-prompt')) return;
    
    const prompt = document.createElement('div');
    prompt.className = 'awa-install-prompt';
    prompt.innerHTML = `
      <div style="background: ${CONFIG.theme[state.theme].surface}; border-radius: 20px; padding: 20px; max-width: 300px;">
        <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">📱</div>
        <h3 style="margin: 0 0 10px 0; text-align: center;">Install ${CONFIG.appName}</h3>
        <p style="margin: 0 0 20px 0; text-align: center; color: ${CONFIG.theme[state.theme].textSecondary}">
          Install this app on your device for the best experience
        </p>
        <div style="display: flex; gap: 10px;">
          <button id="install-now" style="flex: 1; padding: 10px; background: ${CONFIG.theme[state.theme].primary}; color: white; border: none; border-radius: 10px; cursor: pointer;">
            Install Now
          </button>
          <button id="install-later" style="flex: 1; padding: 10px; background: transparent; border: 1px solid ${CONFIG.theme[state.theme].border}; border-radius: 10px; cursor: pointer;">
            Later
          </button>
        </div>
      </div>
    `;
    prompt.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 20000;
      animation: slideUp 0.3s;
      display: flex;
      justify-content: center;
    `;
    
    document.body.appendChild(prompt);
    
    document.getElementById('install-now').onclick = () => {
      if (state.deferredPrompt) {
        state.deferredPrompt.prompt();
        prompt.remove();
      }
    };
    
    document.getElementById('install-later').onclick = () => {
      prompt.remove();
      setTimeout(() => {
        if (!state.installAttempted && !state.isStandalone) {
          showInstallPrompt();
        }
      }, 7 * 24 * 60 * 60 * 1000); // Remind after a week
    };
  }
  
  function triggerInstall() {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
    } else if (state.isIOS && !state.isStandalone) {
      showIOSInstallGuide();
    }
  }
  
  function toggleMinimize() {
    const contentElements = Array.from(document.body.children).filter(
      child => child.id !== 'awa-header' && 
               child.id !== 'awa-settings-panel' && 
               !child.classList?.contains('awa-toast')
    );
    
    const isMinimized = contentElements.every(el => el.style.display === 'none');
    contentElements.forEach(el => {
      el.style.display = isMinimized ? '' : 'none';
    });
    
    showToast(isMinimized ? 'App restored' : 'App minimized', 'info');
  }
  
  function closeApp() {
    if (confirm('Are you sure you want to close the app?')) {
      if (window.close) {
        window.close();
      } else {
        showToast('Press Alt+F4 or close the tab manually', 'info');
      }
    }
  }

  // ==================== SPLASH SCREEN ====================
  function showSplashScreen() {
    if (!CONFIG.features.enableSplashScreen) return;
    if (localStorage.getItem('splash-shown')) return;
    
    const splash = document.createElement('div');
    splash.className = 'awa-splash';
    splash.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 64px; animation: bounce 1s;">${CONFIG.appIcon}</div>
        <h2 style="margin: 20px 0 10px 0;">${CONFIG.appName}</h2>
        <div class="spinner"></div>
      </div>
    `;
    splash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${CONFIG.theme[state.theme].primary};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 30000;
      transition: opacity 0.5s;
      color: white;
    `;
    
    document.body.appendChild(splash);
    
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
        localStorage.setItem('splash-shown', 'true');
      }, 500);
    }, CONFIG.splashScreenDuration);
  }

  // ==================== CSS ANIMATIONS ====================
  function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      
      @keyframes highlight {
        0% { background-color: rgba(99, 102, 241, 0.2); }
        100% { background-color: transparent; }
      }
      
      .awa-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        animation: fadeIn 0.3s;
      }
      
      .awa-modal-content {
        background: ${CONFIG.theme[state.theme].surface};
        padding: 24px;
        border-radius: 20px;
        max-width: 90%;
        max-height: 80%;
        overflow: auto;
        animation: slideUp 0.3s;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .offline-mode {
        filter: grayscale(0.2);
      }
      
      .theme-dark {
        --awa-primary: #818cf8;
        --awa-background: #111827;
        --awa-text: #f9fafb;
      }
      
      .theme-light {
        --awa-primary: #6366f1;
        --awa-background: #ffffff;
        --awa-text: #1f2937;
      }
    `;
    document.head.appendChild(style);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    detectPlatform();
    addGlobalStyles();
    
    // Load saved preferences
    const savedTheme = localStorage.getItem('awa-theme');
    if (savedTheme) state.theme = savedTheme;
    
    const reduceMotion = localStorage.getItem('reduce-motion') === 'true';
    if (reduceMotion) document.body.style.transition = 'none';
    
    CONFIG.features.enableGestures = localStorage.getItem('enable-gestures') !== 'false';
    CONFIG.features.enableOfflineSupport = localStorage.getItem('offline-support') !== 'false';
    
    // Setup all features
    createCustomHeader();
    createSettingsPanel();
    setupInstallHandlers();
    setupKeyboardShortcuts();
    setupIOS();
    applyTheme();
    
    if (CONFIG.features.enablePerformanceMonitoring) monitorPerformance();
    if (CONFIG.features.enableOfflineSupport) setupOfflineSupport();
    
    showSplashScreen();
    
    // Expose API
    window.AWA = {
      isStandalone: () => state.isStandalone,
      showSettings: () => toggleSettingsPanel(),
      hideSettings: () => {
        const panel = document.getElementById('awa-settings-panel');
        if (panel) panel.style.display = 'none';
      },
      triggerInstall,
      toggleTheme,
      showToast,
      config: CONFIG,
      state,
      share: shareApp,
      search: showSearchModal
    };
    
    console.log('[AWA] Ultimate Enhancer initialized');
    showToast(`${CONFIG.appName} is ready! 🎮`, 'success');
  }
  
  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
