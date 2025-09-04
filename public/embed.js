(function() {
  'use strict';
  
  // Enhanced Ultra Pro Max Embed Loader with Optimizations
  const UPMEmbed = {
    version: '4.1.0',
    embeds: new Map(),
    performance: new Map(),
    cache: new Map(),
    config: {
      retryAttempts: 3,
      retryDelay: 1000,
      throttleDelay: 100,
      prefetch: true,
      collaboration: true,
      batchSize: 10,
      cacheExpiry: 300000,
      maxEmbeds: 50, // Limit concurrent embeds
      experimental: {
        webGL: null,
        arSupport: false,
        quantumEngine: null,
        neuralPredictor: null,
        holographicRenderer: null,
        gestureController: null,
        voiceRecognition: null,
        biometricAuth: null,
        blockchainVerifier: null,
        hapticFeedback: true,
        ambientAwareness: true,
        predictiveLoading: true,
        multiDimensional: false, // Disabled by default for performance
        smartCompression: true,
        p2pSync: false // Disabled by default for performance
      },
      performance: {
        useWorkers: true,
        useWASM: false, // Disabled by default
        useGPU: false, // Disabled by default
        memoryLimit: 50 * 1024 * 1024, // 50MB
        asyncRendering: true,
        virtualScrolling: true,
        debounceDelay: 250
      }
    },
    workers: {
      render: null,
      analytics: null,
      compression: null
    },
    
    init: function() {
      try {
        performance.mark('upm-embed-init-start');
        
        // Check browser support
        if (!this.checkBrowserSupport()) {
          console.warn('Browser does not support all features');
        }
        
        // Initialize only essential features
        this.initializeEssentials();
        
        // Defer non-critical initialization
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => this.initializeNonCritical());
        } else {
          setTimeout(() => this.initializeNonCritical(), 100);
        }
        
        performance.mark('upm-embed-init-end');
        performance.measure('upm-embed-init', 'upm-embed-init-start', 'upm-embed-init-end');
      } catch (error) {
        console.error('UPM Embed initialization error:', error);
        this.fallbackInit();
      }
    },
    
    checkBrowserSupport: function() {
      const features = {
        intersectionObserver: 'IntersectionObserver' in window,
        serviceWorker: 'serviceWorker' in navigator,
        webWorker: typeof Worker !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        customElements: 'customElements' in window
      };
      
      this.support = features;
      return Object.values(features).every(v => v);
    },
    
    initializeEssentials: function() {
      // Load visible embeds immediately
      const scripts = document.querySelectorAll('script[src*="/embed.js"]');
      const visibleEmbeds = [];
      
      scripts.forEach(script => {
        const url = new URL(script.src);
        const embedId = url.searchParams.get('id');
        
        if (embedId && !this.embeds.has(embedId)) {
          const container = document.getElementById(`upm-embed-${embedId}`);
          if (container && this.isElementVisible(container)) {
            visibleEmbeds.push(embedId);
          }
        }
      });
      
      // Load visible embeds first
      visibleEmbeds.forEach(embedId => this.loadEmbed(embedId));
      
      // Setup essential event listeners
      this.setupEssentialListeners();
    },
    
    initializeNonCritical: function() {
      // Initialize workers
      if (this.config.performance.useWorkers && this.support.webWorker) {
        this.initializeWorkers();
      }
      
      // Initialize experimental features selectively
      this.initExperimentalFeatures();
      
      // Setup lazy loading for remaining embeds
      this.setupLazyLoading();
      
      // Setup advanced listeners
      this.setupAdvancedListeners();
      
      // Initialize offline mode
      if (this.config.experimental.offlineMode && this.support.serviceWorker) {
        this.initOfflineMode();
      }
    },
    
    isElementVisible: function(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );
    },
    
    initializeWorkers: function() {
      try {
        // Create a shared worker code
        const workerCode = `
          const handlers = {
            render: (data) => ({ processed: true, data }),
            analytics: (data) => ({ aggregated: true, count: data.length }),
            compress: (data) => ({ compressed: true, size: data.length * 0.7 })
          };
          
          self.addEventListener('message', function(e) {
            const { type, data, id } = e.data;
            if (handlers[type]) {
              const result = handlers[type](data);
              self.postMessage({ type: type + '-complete', result, id });
            }
          });
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        // Create single worker for all tasks
        this.workers.main = new Worker(workerUrl);
        this.workers.main.addEventListener('message', this.handleWorkerMessage.bind(this));
        
        // Clean up blob URL
        URL.revokeObjectURL(workerUrl);
      } catch (error) {
        console.error('Worker initialization error:', error);
        this.config.performance.useWorkers = false;
      }
    },
    
    handleWorkerMessage: function(e) {
      const { type, result, id } = e.data;
      
      // Handle different worker responses
      if (type === 'render-complete' && id) {
        const container = document.getElementById(`upm-embed-${id}`);
        if (container) {
          this.applyRenderedContent(id, container, result);
        }
      }
    },
    
    setupLazyLoading: function() {
      if (!this.support.intersectionObserver) return;
      
      // Create a single observer for all embeds
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const embedId = entry.target.dataset.embedId;
            if (embedId && !this.embeds.has(embedId)) {
              // Debounce loading
              if (this.loadingQueue) {
                clearTimeout(this.loadingQueue);
              }
              this.loadingQueue = setTimeout(() => {
                this.loadEmbed(embedId);
              }, 50);
              this.lazyLoadObserver.unobserve(entry.target);
            }
          }
        });
      }, {
        rootMargin: '100px',
        threshold: 0.01
      });
      
      // Observe all embed containers
      document.querySelectorAll('[data-embed-id]:not([data-loaded])').forEach(el => {
        this.lazyLoadObserver.observe(el);
      });
    },
    
    loadEmbed: function(embedId) {
      try {
        // Check embed limit
        if (this.embeds.size >= this.config.maxEmbeds) {
          this.removeOldestEmbed();
        }
        
        // Check memory before loading
        if (!this.checkMemoryAvailable()) {
          this.freeMemory();
        }
        
        const container = document.getElementById(`upm-embed-${embedId}`);
        if (!container || container.dataset.loaded) return;
        
        // Mark as loading
        container.dataset.loaded = 'loading';
        container.innerHTML = '<div class="embed-loading">Loading...</div>';
        
        // Create embed data
        const embedData = {
          id: embedId,
          container,
          loadTime: Date.now(),
          lastInteraction: Date.now(),
          eventListeners: new Map()
        };
        
        this.embeds.set(embedId, embedData);
        
        // Load embed content
        this.fetchEmbedContent(embedId)
          .then(content => {
            container.innerHTML = content;
            container.dataset.loaded = 'true';
            this.initializeEmbedFeatures(embedId);
            this.trackEvent(embedId, 'load', { success: true });
          })
          .catch(error => {
            console.error(`Failed to load embed ${embedId}:`, error);
            container.innerHTML = '<div class="embed-error">Failed to load content</div>';
            container.dataset.loaded = 'error';
            this.trackEvent(embedId, 'load', { success: false, error: error.message });
          });
      } catch (error) {
        console.error(`Error loading embed ${embedId}:`, error);
      }
    },
    
    removeOldestEmbed: function() {
      let oldestId = null;
      let oldestTime = Date.now();
      
      for (const [id, embed] of this.embeds.entries()) {
        if (embed.lastInteraction < oldestTime) {
          oldestTime = embed.lastInteraction;
          oldestId = id;
        }
      }
      
      if (oldestId) {
        this.disposeEmbed(oldestId);
      }
    },
    
    fetchEmbedContent: async function(embedId) {
      // Check cache first
      const cached = this.cache.get(embedId);
      if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
        return cached.content;
      }
      
      // Fetch from server
      const response = await fetch(`/embed/${embedId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      
      // Cache the content
      this.cache.set(embedId, {
        content,
        timestamp: Date.now()
      });
      
      // Manage cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return content;
    },
    
    initializeEmbedFeatures: function(embedId) {
      const embed = this.embeds.get(embedId);
      if (!embed) return;
      
      // Add essential event listeners
      this.addEmbedEventListeners(embedId);
      
      // Initialize interactive features if visible
      if (this.isElementVisible(embed.container)) {
        this.enableInteractiveFeatures(embedId);
      }
    },
    
    addEmbedEventListeners: function(embedId) {
      const embed = this.embeds.get(embedId);
      if (!embed) return;
      
      // Click tracking
      const clickHandler = this.debounce((e) => {
        embed.lastInteraction = Date.now();
        this.trackEvent(embedId, 'click', {
          target: e.target.tagName,
          x: e.clientX,
          y: e.clientY
        });
      }, 250);
      
      embed.container.addEventListener('click', clickHandler);
      embed.eventListeners.set('click', clickHandler);
      
      // Visibility tracking
      if (this.support.intersectionObserver) {
        const visibilityObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.trackEvent(embedId, 'view', {
                viewportPercentage: entry.intersectionRatio
              });
            }
          });
        }, { threshold: [0.25, 0.5, 0.75, 1.0] });
        
        visibilityObserver.observe(embed.container);
        embed.visibilityObserver = visibilityObserver;
      }
    },
    
    enableInteractiveFeatures: function(embedId) {
      const embed = this.embeds.get(embedId);
      if (!embed) return;
      
      // Enable features based on configuration
      if (this.config.experimental.hapticFeedback && this.hapticEngine) {
        this.enableHapticFeedback(embedId);
      }
      
      if (this.config.experimental.gestureController && this.experimental.gestureController) {
        this.enableGestures(embedId);
      }
    },
    
    // Debounce utility
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // Experimental features initialization (selective)
    initExperimentalFeatures: function() {
      try {
        const experimental = this.config.experimental;
        this.experimental = {};
        
        // Only initialize enabled features
        if (experimental.webGL) {
          this.experimental.webGL = this.checkWebGLSupport();
        }
        
        if (experimental.hapticFeedback && 'vibrate' in navigator) {
          this.initHapticFeedback();
        }
        
        if (experimental.voiceRecognition && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
          this.experimental.voiceController = new VoiceController();
        }
        
        if (experimental.gestureController && window.PointerEvent) {
          this.experimental.gestureController = new GestureController();
        }
      } catch (error) {
        console.error('Experimental features initialization error:', error);
      }
    },
    
    checkWebGLSupport: function() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },
    
    // Memory management
    checkMemoryAvailable: function() {
      try {
        if (performance.memory) {
          const used = performance.memory.usedJSHeapSize;
          const limit = performance.memory.jsHeapSizeLimit;
          return used / limit < 0.7; // More aggressive threshold
        }
        return true;
      } catch (error) {
        return true;
      }
    },
    
    freeMemory: function() {
      try {
        const now = Date.now();
        
        // Clear old cache entries
        for (const [key, value] of this.cache.entries()) {
          if (now - value.timestamp > 180000) { // 3 minutes
            this.cache.delete(key);
          }
        }
        
        // Remove inactive embeds
        const inactiveThreshold = 300000; // 5 minutes
        for (const [id, embed] of this.embeds.entries()) {
          if (embed.lastInteraction && now - embed.lastInteraction > inactiveThreshold) {
            if (!this.isElementVisible(embed.container)) {
              this.disposeEmbed(id);
            }
          }
        }
        
        // Clear analytics queue if too large
        if (this.analyticsQueue.length > 100) {
          this.flushAnalytics();
        }
      } catch (error) {
        console.error('Memory cleanup error:', error);
      }
    },
    
    disposeEmbed: function(embedId) {
      const embed = this.embeds.get(embedId);
      if (!embed) return;
      
      // Remove event listeners
      embed.eventListeners.forEach((handler, event) => {
        embed.container.removeEventListener(event, handler);
      });
      
      // Disconnect observers
      if (embed.visibilityObserver) {
        embed.visibilityObserver.disconnect();
      }
      
      // Clear container
      embed.container.innerHTML = '';
      embed.container.dataset.loaded = 'false';
      
      // Remove from map
      this.embeds.delete(embedId);
    },
    
    // Analytics with improved batching
    analyticsQueue: [],
    analyticsTimer: null,
    
    trackEvent: function(embedId, event, data = {}) {
      try {
        const eventData = {
          embedId,
          event,
          data,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
          page: window.location.href
        };
        
        this.analyticsQueue.push(eventData);
        
        // Batch analytics more aggressively
        if (this.analyticsQueue.length >= 20) {
          this.flushAnalytics();
        } else if (!this.analyticsTimer) {
          this.analyticsTimer = setTimeout(() => this.flushAnalytics(), 10000); // 10 seconds
        }
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    },
    
    flushAnalytics: function() {
      if (this.analyticsQueue.length === 0) return;
      
      const events = [...this.analyticsQueue];
      this.analyticsQueue = [];
      
      if (this.analyticsTimer) {
        clearTimeout(this.analyticsTimer);
        this.analyticsTimer = null;
      }
      
      // Use beacon API for reliability
      const data = JSON.stringify({ events });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/embeds/analytics/batch', data);
      } else {
        // Fallback to fetch with keepalive
        fetch('/api/embeds/analytics/batch', {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {
          // Store failed analytics for retry
          if (this.support.serviceWorker && 'sync' in self.registration) {
            // Queue for background sync
            this.queueForSync(events);
          }
        });
      }
    },
    
    queueForSync: async function(events) {
      if (!this.support.serviceWorker) return;
      
      try {
        const cache = await caches.open('analytics-queue');
        const request = new Request('/api/embeds/analytics/batch', {
          method: 'POST',
          body: JSON.stringify({ events }),
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(request, new Response());
        
        // Register sync
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('analytics-sync');
      } catch (error) {
        console.error('Failed to queue for sync:', error);
      }
    },
    
    getSessionId: function() {
      if (!this.sessionId) {
        this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      return this.sessionId;
    },
    
    // Service worker management
    initOfflineMode: function() {
      navigator.serviceWorker.register('/embed-sw.js').then(reg => {
        this.serviceWorker = reg;
        
        // Handle updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && this.serviceWorker.active) {
              this.notifyUpdate();
            }
          });
        });
        
        // Communicate with service worker
        if (reg.active) {
          this.setupServiceWorkerComm();
        }
      }).catch(error => {
        console.error('Service worker registration failed:', error);
      });
      
      // Handle online/offline events
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    },
    
    setupServiceWorkerComm: function() {
      // Create message channel for communication
      const channel = new MessageChannel();
      
      // Send message to SW with port
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_STATUS'
      }, [channel.port2]);
      
      // Listen for response
      channel.port1.onmessage = (event) => {
        console.log('Cache status:', event.data);
      };
    },
    
    handleOffline: function() {
      this.isOffline = true;
      document.body.classList.add('upm-offline');
      
      // Notify embeds
      this.embeds.forEach((embed, id) => {
        if (embed.container) {
          embed.container.classList.add('offline-mode');
        }
      });
    },
    
    handleOnline: function() {
      this.isOffline = false;
      document.body.classList.remove('upm-offline');
      
      // Sync offline changes
      this.flushAnalytics();
      
      // Notify embeds
      this.embeds.forEach((embed, id) => {
        if (embed.container) {
          embed.container.classList.remove('offline-mode');
        }
      });
    },
    
    notifyUpdate: function() {
      // Notify user about update
      if (this.onUpdate) {
        this.onUpdate();
      } else {
        console.log('New version available. Refresh to update.');
      }
    },
    
    // Essential event listeners
    setupEssentialListeners: function() {
      // Page visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flushAnalytics();
        }
      });
      
      // Before unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    },
    
    // Advanced event listeners (non-critical)
    setupAdvancedListeners: function() {
      // Network status
      if ('connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
          this.handleConnectionChange();
        });
      }
      
      // Memory pressure (if available)
      if ('memory' in performance) {
        setInterval(() => {
          if (!this.checkMemoryAvailable()) {
            this.freeMemory();
          }
        }, 30000); // Check every 30 seconds
      }
    },
    
    handleConnectionChange: function() {
      const connection = navigator.connection;
      
      // Adjust quality based on connection
      if (connection.effectiveType === '2g' || connection.saveData) {
        this.config.performance.asyncRendering = false;
        this.config.experimental.multiDimensional = false;
      }
    },
    
    // Cleanup method
    cleanup: function() {
      try {
        // Flush any pending analytics
        this.flushAnalytics();
        
        // Dispose all embeds
        this.embeds.forEach((embed, id) => {
          this.disposeEmbed(id);
        });
        
        // Terminate workers
        if (this.workers.main) {
          this.workers.main.terminate();
        }
        
        // Disconnect observers
        if (this.lazyLoadObserver) {
          this.lazyLoadObserver.disconnect();
        }
        
        // Clear caches
        this.cache.clear();
        this.embeds.clear();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    },
    
    // Fallback initialization
    fallbackInit: function() {
      // Basic initialization for older browsers
      const scripts = document.querySelectorAll('script[src*="/embed.js"]');
      
      scripts.forEach(script => {
        const url = new URL(script.src);
        const embedId = url.searchParams.get('id');
        
        if (embedId) {
          const container = document.getElementById(`upm-embed-${embedId}`);
          if (container) {
            // Simple iframe fallback
            container.innerHTML = `<iframe src="/embed/${embedId}" frameborder="0" width="100%" height="400"></iframe>`;
          }
        }
      });
    }
  };

  // Experimental feature classes (stubs for demonstration)
  class WebGLRenderer {
    constructor() {
      this.gl = null;
      this.programs = new Map();
    }
  }
  
  class QuantumEngine {
    constructor() {
      this.states = new Map();
    }
    
    async entangle(id) {
      return {
        id: `quantum-${id}-${Date.now()}`,
        entangled: true,
        superposition: Math.random()
      };
    }
    
    cleanup() {
      this.states.clear();
    }
  }
  
  class NeuralPredictor {
    constructor() {
      this.model = null;
    }
    
    async predict(input) {
      // Simulate prediction
      return {
        profile: 'optimized',
        optimalHeight: '450px',
        preferences: {
          animations: true,
          quality: 'high'
        }
      };
    }
  }
  
  class HolographicRenderer {
    constructor() {
      this.holograms = new Map();
    }
    
    async create(config) {
      const hologram = {
        id: `holo-${Date.now()}`,
        config
      };
      this.holograms.set(hologram.id, hologram);
      return hologram;
    }
    
    cleanup() {
      this.holograms.clear();
    }
  }
  
  class ARController {
    constructor() {
      this.sessions = new Map();
    }
  }
  
  class GestureController {
    constructor() {
      this.currentGesture = null;
    }
    
    startGesture(data) {
      this.currentGesture = data;
    }
    
    updateGesture(data) {
      if (!this.currentGesture) return null;
      
      const dx = data.x - this.currentGesture.startX;
      const dy = data.y - this.currentGesture.startY;
      
      if (Math.abs(dx) > 50) {
        return {
          recognized: true,
          type: dx > 0 ? 'swipe-right' : 'swipe-left',
          embedId: this.currentGesture.embedId
        };
      }
      
      return null;
    }
    
    endGesture(data) {
      const gesture = this.updateGesture(data);
      this.currentGesture = null;
      return gesture;
    }
  }
  
  class VoiceController {
    constructor() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }
    }
    
    start(config) {
      if (!this.recognition) return;
      
      this.recognition.lang = config.language || 'en-US';
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (config.onResult) config.onResult(transcript);
      };
      
      this.recognition.onerror = (event) => {
        if (config.onError) config.onError(event.error);
      };
      
      try {
        this.recognition.start();
      } catch (error) {
        if (config.onError) config.onError(error);
      }
    }
    
    stop() {
      if (this.recognition) {
        this.recognition.stop();
      }
    }
  }
  
  class GestureController {
    constructor() {
      this.gestures = new Map();
      this.threshold = 50;
    }
    
    track(element, config) {
      let startX = 0;
      let startY = 0;
      let startTime = 0;
      
      const pointerDown = (e) => {
        startX = e.clientX;
        startY = e.clientY;
        startTime = Date.now();
      };
      
      const pointerUp = (e) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const deltaTime = Date.now() - startTime;
        
        if (deltaTime < 500) { // Quick gesture
          if (Math.abs(deltaX) > this.threshold) {
            const direction = deltaX > 0 ? 'right' : 'left';
            if (config.onSwipe) config.onSwipe(direction);
          } else if (Math.abs(deltaY) > this.threshold) {
            const direction = deltaY > 0 ? 'down' : 'up';
            if (config.onSwipe) config.onSwipe(direction);
          }
        }
      };
      
      element.addEventListener('pointerdown', pointerDown);
      element.addEventListener('pointerup', pointerUp);
      
      this.gestures.set(element, { pointerDown, pointerUp });
    }
    
    untrack(element) {
      const handlers = this.gestures.get(element);
      if (handlers) {
        element.removeEventListener('pointerdown', handlers.pointerDown);
        element.removeEventListener('pointerup', handlers.pointerUp);
        this.gestures.delete(element);
      }
    }
  }
  
  // Auto-initialization with proper timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      UPMEmbed.init();
    });
  } else {
    // Already loaded, initialize immediately
    UPMEmbed.init();
  }
  
  // Expose to global scope
  window.UPMEmbed = UPMEmbed;
})();
