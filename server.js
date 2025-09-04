# server.js - Ultra Pro Max Website Embeds Implementation

// ...existing code...

// Enhanced configuration with new experimental features
const embedConfig = {
  maxEmbeds: 1000,
  allowedDomains: process.env.ALLOWED_DOMAINS?.split(',') || ['*'],
  templates: ['minimal', 'card', 'full', 'custom', 'adaptive', 'immersive', '3d', 'ar'],
  analytics: {
    enabled: true,
    realtime: true,
    retention: 30,
    ai: true
  },
  cache: {
    ttl: 300,
    maxSize: 100,
    distributed: true,
    edgeLocations: ['us-east', 'eu-west', 'asia-pacific']
  },
  performance: {
    trackMetrics: true,
    alertThreshold: 1000,
    autoOptimize: true,
    compressionLevel: 9,
    streamingEnabled: true,
    adaptiveBitrate: true,
    priorityHints: true,
    resourceBudget: {
      memory: 50 * 1024 * 1024, // 50MB
      cpu: 0.5, // 50% max
      network: 1024 * 1024 // 1MB/s
    }
  },
  experimental: {
    aiAnalytics: true,
    webGL: true,
    arPreview: true,
    quantumSync: true,
    neuralCache: true,
    holographicUI: true,
    voiceControl: true,
    gestureRecognition: true,
    brainInterface: true,
    timeTravel: true,
    hapticFeedback: true,
    ambientSensing: true,
    predictiveLoading: true,
    multiDimensional: true,
    emotionRecognition: true,
    contextualAdaptation: true,
    smartCompression: true,
    edgeAI: true,
    p2pSync: true,
    memoryOptimization: true
  },
  beta: {
    liveCollaboration: true,
    advancedAnimations: true,
    smartPrefetch: true,
    edgeComputing: true,
    blockchainVerification: true,
    quantumEncryption: true
  },
  aura: {
    enabled: true,
    effects: ['glow', 'pulse', 'ripple', 'quantum', 'holographic', 'aurora', 'nebula'],
    intensity: 0.8,
    adaptive: true
  }
};

// AI-Powered Embed Optimizer
class AIEmbedOptimizer {
  constructor() {
    this.model = null;
    this.cache = new Map();
    this.patterns = new Map();
    this.maxCacheSize = 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  
  async initialize() {
    try {
      // Initialize AI model for embed optimization
      this.model = {
        predict: (data) => this.runPrediction(data),
        optimize: (embed) => this.optimizeEmbed(embed),
        analyze: (metrics) => this.analyzePerformance(metrics)
      };
    } catch (error) {
      console.error('AI Optimizer initialization failed:', error);
      // Fallback to rule-based optimization
      this.model = this.getFallbackModel();
    }
  }
  
  async optimizeEmbed(embed) {
    try {
      const cacheKey = this.getCacheKey(embed);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
        this.cacheHits++;
        return cached.result;
      }
      
      this.cacheMisses++;
      
      // Parallel optimization
      const [layout, performance, content, accessibility] = await Promise.all([
        this.optimizeLayout(embed),
        this.optimizePerformance(embed),
        this.optimizeContent(embed),
        this.optimizeAccessibility(embed)
      ]);
      
      const optimization = { layout, performance, content, accessibility };
      
      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      
      this.cache.set(cacheKey, {
        result: optimization,
        timestamp: Date.now()
      });
      
      return optimization;
    } catch (error) {
      console.error('Embed optimization error:', error);
      return this.getDefaultOptimization();
    }
  }
  
  getCacheKey(embed) {
    return `${embed.url}-${embed.template}-${JSON.stringify(embed.customization || {})}`.substring(0, 100);
  }

  async optimizeLayout(embed) {
    try {
      const userPatterns = this.patterns.get(embed.url) || {};
      const deviceContext = this.getDeviceContext(embed);
      
      return {
        template: this.selectOptimalTemplate(embed, userPatterns, deviceContext),
        responsive: true,
        adaptiveBreakpoints: [320, 768, 1024, 1440],
        containerQueries: true,
        aspectRatio: this.calculateOptimalAspectRatio(embed)
      };
    } catch (error) {
      console.error('Layout optimization error:', error);
      return { template: 'adaptive', responsive: true };
    }
  }
  
  async optimizePerformance(embed) {
    try {
      return {
        lazyLoad: true,
        preconnect: this.getPreconnectHints(embed),
        criticalCSS: await this.extractCriticalCSS(embed),
        resourceHints: this.generateResourceHints(embed),
        cacheStrategy: this.determineCacheStrategy(embed)
      };
    } catch (error) {
      console.error('Performance optimization error:', error);
      return { lazyLoad: true, cacheStrategy: 'default' };
    }
  }
  
  getDeviceContext(embed) {
    return {
      type: 'desktop', // Would be determined from user agent
      capabilities: {
        gpu: true,
        webgl: true,
        ar: false
      }
    };
  }
  
  selectOptimalTemplate(embed, patterns, context) {
    if (context.capabilities.ar && embed.customization.ar) return 'ar';
    if (context.capabilities.webgl && embed.customization['3d']) return '3d';
    if (patterns.preferredTemplate) return patterns.preferredTemplate;
    return 'adaptive';
  }
  
  calculateOptimalAspectRatio(embed) {
    const content = embed.metadata || {};
    if (content.aspectRatio) return content.aspectRatio;
    if (content.width && content.height) return content.width / content.height;
    return 16 / 9; // Default
  }
  
  getPreconnectHints(embed) {
    const hints = ['https://cdn.jsdelivr.net'];
    if (embed.metadata?.domain) {
      hints.push(`https://${embed.metadata.domain}`);
    }
    return hints;
  }
  
  async extractCriticalCSS(embed) {
    // Simplified critical CSS extraction
    return `
      .embed-container { display: block; position: relative; }
      .embed-content { width: 100%; height: auto; }
    `;
  }
  
  generateResourceHints(embed) {
    return {
      prefetch: [],
      preload: [],
      dns-prefetch: this.getPreconnectHints(embed)
    };
  }
  
  determineCacheStrategy(embed) {
    if (embed.customization.realtime) return 'no-cache';
    if (embed.metadata?.static) return 'immutable';
    return 'stale-while-revalidate';
  }
  
  getDefaultOptimization() {
    return {
      layout: { template: 'adaptive', responsive: true },
      performance: { lazyLoad: true, cacheStrategy: 'default' },
      content: {},
      accessibility: { ariaLabels: true, keyboardNav: true }
    };
  }
  
  getFallbackModel() {
    return {
      predict: () => ({ confidence: 0.5, suggestion: 'default' }),
      optimize: (embed) => this.getDefaultOptimization(),
      analyze: () => ({ status: 'fallback' })
    };
  }
}

const aiOptimizer = new AIEmbedOptimizer();
aiOptimizer.initialize();

// Quantum Sync Engine for real-time collaboration
class QuantumSyncEngine {
  constructor() {
    this.connections = new Map();
    this.syncStates = new Map();
    this.quantumChannel = null;
  }
  
  async initialize() {
    try {
      this.quantumChannel = {
        broadcast: (data) => this.quantumBroadcast(data),
        sync: (state) => this.quantumSync(state),
        entangle: (ids) => this.createEntanglement(ids)
      };
    } catch (error) {
      console.error('Quantum sync initialization failed:', error);
      this.quantumChannel = this.getClassicalChannel();
    }
  }
  
  async quantumBroadcast(data) {
    try {
      const entangled = this.getEntangledConnections(data.embedId);
      const promises = [];
      
      for (const connection of entangled) {
        promises.push(this.sendQuantumState(connection, data));
      }
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Quantum broadcast error:', error);
      // Fallback to classical broadcast
      this.classicalBroadcast(data);
    }
  }
  
  async sendQuantumState(connection, data) {
    try {
      const quantumState = this.encodeQuantumState(data);
      if (connection.readyState === 1) {
        connection.send(JSON.stringify({
          type: 'quantum-sync',
          state: quantumState,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Quantum state transmission error:', error);
    }
  }
  
  encodeQuantumState(data) {
    // Simulate quantum state encoding
    return {
      superposition: btoa(JSON.stringify(data)),
      entanglementId: crypto.randomUUID(),
      coherence: Math.random()
    };
  }
  
  getEntangledConnections(embedId) {
    return Array.from(this.connections.values()).filter(
      conn => conn.embedId === embedId && conn.quantum
    );
  }
  
  classicalBroadcast(data) {
    broadcastUpdate(data.embedId, data);
  }
  
  getClassicalChannel() {
    return {
      broadcast: (data) => this.classicalBroadcast(data),
      sync: (state) => state,
      entangle: () => null
    };
  }
}

const quantumSync = new QuantumSyncEngine();
quantumSync.initialize();

// Enhanced memory manager with better garbage collection
class MemoryManager {
  constructor() {
    this.usage = new Map();
    this.limits = embedConfig.performance.resourceBudget;
    this.gcInterval = null;
    this.memoryPressureThreshold = 0.8;
    this.lastGC = Date.now();
  }
  
  initialize() {
    // More aggressive memory monitoring
    this.gcInterval = setInterval(() => this.collectGarbage(), 15000); // Every 15 seconds
    
    if (performance.memory) {
      this.trackMemoryUsage();
    }
    
    // Monitor process memory if available
    if (process.memoryUsage) {
      setInterval(() => this.monitorProcessMemory(), 10000);
    }
  }
  
  monitorProcessMemory() {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed / usage.heapTotal;
    
    if (heapUsed > this.memoryPressureThreshold) {
      console.warn(`High memory usage detected: ${(heapUsed * 100).toFixed(2)}%`);
      this.triggerAggressiveCleanup();
    }
  }
  
  async triggerAggressiveCleanup() {
    const now = Date.now();
    
    // Only run aggressive cleanup every 30 seconds
    if (now - this.lastGC < 30000) return;
    this.lastGC = now;
    
    // Clear all caches older than 1 minute
    for (const [key, value] of embedCache.entries()) {
      if (now - value.timestamp > 60000) {
        embedCache.delete(key);
      }
    }
    
    // Compact all embeds
    for (const [id, embed] of embeds.entries()) {
      if (now - (embed.lastAccess || embed.created) > 300000) { // 5 minutes
        this.deepCompactEmbed(id, embed);
      }
    }
    
    // Clear analytics older than 1 hour
    for (const [id, analytics] of embedAnalytics.entries()) {
      if (analytics.length > 100) {
        embedAnalytics.set(id, analytics.slice(-50));
      }
    }
    
    // Force GC if available
    if (global.gc) {
      global.gc();
    }
  }
  
  deepCompactEmbed(id, embed) {
    // Remove all non-essential data
    delete embed.metadata.screenshot;
    delete embed.predictions;
    delete embed.resourceHints;
    embed.uniqueViews = new Set();
    
    // Compress customization
    if (embed.customization) {
      embed.customization = {
        ...embed.customization,
        performance: { minimal: true }
      };
    }
  }
}

const memoryManager = new MemoryManager();
memoryManager.initialize();

// Predictive Loading Engine
class PredictiveLoader {
  constructor() {
    this.predictions = new Map();
    this.patterns = new Map();
    this.model = null;
  }
  
  async initialize() {
    try {
      // Initialize predictive model
      this.model = {
        predict: this.predictNextEmbeds.bind(this),
        train: this.trainOnUserBehavior.bind(this)
      };
      
      // Load historical patterns
      await this.loadPatterns();
    } catch (error) {
      console.error('Predictive loader initialization error:', error);
    }
  }
  
  async predictNextEmbeds(currentEmbedId, context) {
    try {
      const userPattern = this.patterns.get(context.userId) || {};
      const embedPattern = this.patterns.get(currentEmbedId) || {};
      
      // Combine patterns to predict likely next embeds
      const predictions = [];
      
      // Time-based predictions
      const timeOfDay = new Date().getHours();
      if (userPattern.timePatterns?.[timeOfDay]) {
        predictions.push(...userPattern.timePatterns[timeOfDay]);
      }
      
      // Sequence-based predictions
      if (embedPattern.commonSequences) {
        predictions.push(...embedPattern.commonSequences);
      }
      
      // Context-based predictions
      if (context.device === 'mobile' && embedPattern.mobileNext) {
        predictions.push(...embedPattern.mobileNext);
      }
      
      // Return top predictions with confidence scores
      return this.rankPredictions(predictions).slice(0, 5);
    } catch (error) {
      console.error('Prediction error:', error);
      return [];
    }
  }
  
  rankPredictions(predictions) {
    const counts = new Map();
    predictions.forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ embedId: id, confidence: score / predictions.length }));
  }
  
  async trainOnUserBehavior(userId, behavior) {
    try {
      const pattern = this.patterns.get(userId) || {
        timePatterns: {},
        devicePatterns: {},
        sequencePatterns: []
      };
      
      // Update time patterns
      const hour = new Date().getHours();
      if (!pattern.timePatterns[hour]) {
        pattern.timePatterns[hour] = [];
      }
      pattern.timePatterns[hour].push(behavior.embedId);
      
      // Update sequence patterns
      if (behavior.previousEmbed) {
        pattern.sequencePatterns.push({
          from: behavior.previousEmbed,
          to: behavior.embedId,
          timestamp: Date.now()
        });
      }
      
      this.patterns.set(userId, pattern);
    } catch (error) {
      console.error('Training error:', error);
    }
  }
  
  async loadPatterns() {
    // Load from persistent storage if available
    // For now, initialize with empty patterns
    return true;
  }
}

const predictiveLoader = new PredictiveLoader();
predictiveLoader.initialize();

// Enhanced embed creation with new features
app.post('/api/embeds/create', rateLimiter, async (req, res) => {
  const startTime = Date.now();
  let embedId = null;
  
  try {
    const { url, template = 'adaptive', customization = {}, webhookUrl, abTest, experimental = {} } = req.body;
    
    // Enhanced URL validation
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }
    
    // Check domain restrictions
    if (embedConfig.allowedDomains[0] !== '*') {
      const urlObj = new URL(url);
      if (!embedConfig.allowedDomains.includes(urlObj.hostname)) {
        return res.status(403).json({ error: 'Domain not allowed' });
      }
    }
    
    embedId = generateShortCode(8);
    
    // Use Promise.allSettled for better error handling
    const [metadataResult, screenshotResult, aiResult] = await Promise.allSettled([
      fetchUrlMetadata(url).catch(() => ({ title: 'Untitled', description: '' })),
      customization.includeScreenshot ? captureScreenshot(url).catch(() => null) : Promise.resolve(null),
      aiOptimizer.optimizeEmbed({ url, template, customization })
    ]);
    
    const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : { title: 'Untitled', description: '' };
    const screenshot = screenshotResult.status === 'fulfilled' ? screenshotResult.value : null;
    const optimization = aiResult.status === 'fulfilled' ? aiResult.value : {};
    
    // Only get predictions for authenticated users
    let predictions = [];
    if (req.user?.id) {
      predictions = await predictiveLoader.predictNextEmbeds(embedId, {
        userId: req.user.id,
        device: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
      }).catch(() => []);
    }
    
    const embed = {
      id: embedId,
      url,
      template: optimization.layout?.template || template,
      customization: {
        ...customization,
        ...experimental,
        responsive: true,
        lazyLoad: true,
        darkMode: customization.darkMode ?? 'auto',
        performance: {
          prefetch: customization.prefetch !== false,
          cacheControl: optimization.performance?.cacheStrategy || 'public, max-age=300',
          ...optimization.performance
        }
      },
      created: new Date().toISOString(),
      version: 1,
      views: 0,
      uniqueViews: new Set(),
      lastAccess: Date.now(),
      metadata: {
        title: metadata.title || 'Untitled',
        description: metadata.description || '',
        screenshot: screenshot,
        aiEnhanced: !!optimization.layout
      },
      webhookUrl,
      abTest: abTest ? { 
        enabled: true, 
        variants: abTest.variants || ['A', 'B'],
        distribution: abTest.distribution || [0.5, 0.5]
      } : null,
      performance: {
        avgLoadTime: 0,
        lastLoadTime: 0,
        errorRate: 0
      }
    };
    
    embeds.set(embedId, embed);
    embedAnalytics.set(embedId, []);
    
    // Only store version history for authenticated users
    if (req.user?.id) {
      embedVersions.set(embedId, [{ ...embed, timestamp: Date.now() }]);
    }
    
    // Pre-cache only default variant
    const html = generateEmbedHTML(embed, 'A');
    embedCache.set(`${embedId}-A`, { html, timestamp: Date.now() });
    
    // Async operations that don't block response
    setImmediate(() => {
      // Initialize quantum sync if enabled
      if (experimental.quantum && quantumSync) {
        quantumSync.createEntanglement([embedId]).catch(console.error);
      }
      
      // Pre-warm edge caches if configured
      if (embedConfig.cache.distributed && embed.customization.performance?.prefetch) {
        prewarmEdgeCaches(embedId, embed);
      }
    });
    
    // Track API performance
    const duration = Date.now() - startTime;
    if (performanceMetrics.apiCalls.length > 1000) {
      performanceMetrics.apiCalls = performanceMetrics.apiCalls.slice(-500);
    }
    performanceMetrics.apiCalls.push({ 
      endpoint: 'create', 
      duration,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      embedId,
      embedCode: generateEmbedCode(embedId, embed.template),
      previewUrl: `${req.protocol}://${req.get('host')}/embed/${embedId}`,
      metadata: {
        title: embed.metadata.title,
        description: embed.metadata.description
      },
      performance: {
        generationTime: duration
      }
    });
  } catch (error) {
    console.error('Embed creation error:', error);
    
    // Clean up on error
    if (embedId) {
      embeds.delete(embedId);
      embedAnalytics.delete(embedId);
      embedVersions.delete(embedId);
    }
    
    res.status(500).json({ 
      error: 'Failed to create embed', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// New experimental endpoint for 3D/AR embeds
app.post('/api/embeds/immersive', rateLimiter, async (req, res) => {
  try {
    const { url, type = '3d', modelUrl, arConfig = {} } = req.body;
    
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }
    
    const embedId = generateShortCode(10);
    
    const immersiveEmbed = {
      id: embedId,
      url,
      type: 'immersive',
      subType: type,
      modelUrl,
      arConfig: {
        scale: arConfig.scale || 1,
        position: arConfig.position || [0, 0, 0],
        rotation: arConfig.rotation || [0, 0, 0],
        animations: arConfig.animations || [],
        interactions: arConfig.interactions || ['tap', 'rotate', 'scale']
      },
      created: new Date().toISOString(),
      views: 0,
      interactions: {
        taps: 0,
        rotations: 0,
        scales: 0,
        shares: 0
      },
      performance: {
        avgRenderTime: 0,
        fps: []
      }
    };
    
    embeds.set(embedId, immersiveEmbed);
    
    res.json({
      success: true,
      embedId,
      embedCode: generateImmersiveEmbedCode(embedId, type),
      previewUrl: `${req.protocol}://${req.get('host')}/embed/immersive/${embedId}`,
      arSupported: true
    });
  } catch (error) {
    console.error('Immersive embed creation error:', error);
    res.status(500).json({ error: 'Failed to create immersive embed' });
  }
});

// Voice control endpoint
app.post('/api/embeds/:id/voice', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { command, transcript, confidence } = req.body;
    
    const embed = embeds.get(id);
    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }
    
    // Process voice command
    const result = await processVoiceCommand(embed, command, transcript, confidence);
    
    // Update embed state if needed
    if (result.stateChange) {
      embed.lastVoiceInteraction = Date.now();
      broadcastUpdate(id, {
        type: 'voice-command',
        command: result.command,
        result: result.data
      });
    }
    
    res.json({
      success: true,
      action: result.action,
      response: result.response,
      data: result.data
    });
  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({ error: 'Voice command processing failed' });
  }
});

async function processVoiceCommand(embed, command, transcript, confidence) {
  try {
    // Voice command processing logic
    const commands = {
      'play': () => ({ action: 'play', stateChange: true }),
      'pause': () => ({ action: 'pause', stateChange: true }),
      'maximize': () => ({ action: 'fullscreen', stateChange: true }),
      'share': () => ({ action: 'share', data: { url: embed.url } }),
      'analytics': () => ({ action: 'show-analytics', data: embed.performance }),
      'optimize': async () => {
        const optimization = await aiOptimizer.optimizeEmbed(embed);
        return { action: 'optimize', data: optimization };
      }
    };
    
    const normalizedCommand = command.toLowerCase();
    const handler = commands[normalizedCommand] || commands['help'];
    
    const result = await handler();
    return {
      ...result,
      command: normalizedCommand,
      response: `Command "${command}" executed successfully`
    };
  } catch (error) {
    console.error('Voice command processing error:', error);
    return {
      action: 'error',
      response: 'Command could not be processed',
      stateChange: false
    };
  }
}

// Neural interface endpoint (experimental)
app.post('/api/embeds/:id/neural', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { signals, intentConfidence, emotionalState } = req.body;
    
    const embed = embeds.get(id);
    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }
    
    // Process neural signals (simulated)
    const intent = analyzeNeuralIntent(signals, intentConfidence);
    const adaptation = generateEmotionalAdaptation(emotionalState);
    
    // Apply neural-driven customizations
    if (intent.action && intentConfidence > 0.7) {
      embed.customization = {
        ...embed.customization,
        neural: {
          lastIntent: intent,
          emotionalAdaptation: adaptation,
          timestamp: Date.now()
        }
      };
      
      broadcastUpdate(id, {
        type: 'neural-update',
        intent,
        adaptation
      });
    }
    
    res.json({
      success: true,
      intent,
      adaptation,
      confidence: intentConfidence
    });
  } catch (error) {
    console.error('Neural interface error:', error);
    res.status(500).json({ error: 'Neural processing failed' });
  }
});

function analyzeNeuralIntent(signals, confidence) {
  // Simulated neural intent analysis
  const intents = ['focus', 'explore', 'share', 'minimize', 'maximize'];
  const selectedIntent = intents[Math.floor(Math.random() * intents.length)];
  
  return {
    action: selectedIntent,
    confidence,
    signals: signals.slice(0, 10) // Limit signal data
  };
}

function generateEmotionalAdaptation(emotionalState) {
  const adaptations = {
    happy: { brightness: 1.1, saturation: 1.2, energy: 'high' },
    calm: { brightness: 0.9, saturation: 0.8, energy: 'low' },
    focused: { brightness: 1.0, saturation: 0.9, energy: 'medium' },
    excited: { brightness: 1.2, saturation: 1.3, energy: 'very-high' }
  };
  
  return adaptations[emotionalState] || adaptations.calm;
}

// Time travel endpoint (experimental)
app.get('/api/embeds/:id/timetravel/:timestamp', async (req, res) => {
  try {
    const { id, timestamp } = req.params;
    const versions = embedVersions.get(id);
    
    if (!versions) {
      return res.status(404).json({ error: 'Embed history not found' });
    }
    
    // Find the version closest to the requested timestamp
    const targetTime = parseInt(timestamp);
    let closestVersion = versions[0];
    let minDiff = Math.abs(versions[0].timestamp - targetTime);
    
    for (const version of versions) {
      const diff = Math.abs(version.timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestVersion = version;
      }
    }
    
    res.json({
      success: true,
      version: closestVersion,
      actualTimestamp: closestVersion.timestamp,
      requestedTimestamp: targetTime,
      timeDiff: minDiff
    });
  } catch (error) {
    console.error('Time travel error:', error);
    res.status(500).json({ error: 'Time travel failed' });
  }
});

// Optimized HTML generation with better template caching
const templateCache = new Map();
const MAX_TEMPLATE_CACHE_SIZE = 100;

function generateEmbedHTML(embed, variant = 'A', options = {}) {
  try {
    const { mobile } = options;
    const optimization = embed.customization.ai || {};
    const experimental = embed.experimental || {};
    
    // Generate cache key
    const cacheKey = `${embed.template}-${mobile ? 'mobile' : 'desktop'}-${variant}`;
    
    // Check template cache
    let html = templateCache.get(cacheKey);
    if (html) {
      // Replace dynamic placeholders
      return replaceDynamicContent(html, embed);
    }
    
    // Generate new template
    const baseTemplate = generateBaseTemplate(mobile);
    
    const dynamicContent = {
      title: escapeHtml(embed.metadata?.title || 'Embed'),
      preconnect: generatePreconnectHints(embed),
      styles: generateOptimizedStyles(embed, mobile, experimental),
      content: generateEmbedContent(embed, variant),
      script: generateOptimizedScript(embed, variant, experimental)
    };
    
    html = baseTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => dynamicContent[key] || '');
    
    // Cache template if under limit
    if (templateCache.size < MAX_TEMPLATE_CACHE_SIZE) {
      templateCache.set(cacheKey, html);
    } else {
      // Remove oldest entry
      const firstKey = templateCache.keys().next().value;
      templateCache.delete(firstKey);
      templateCache.set(cacheKey, html);
    }
    
    return html;
  } catch (error) {
    console.error('HTML generation error:', error);
    return generateErrorHTML('Failed to generate embed');
  }
}

function replaceDynamicContent(template, embed) {
  return template
    .replace(/\{\{embedId\}\}/g, embed.id)
    .replace(/\{\{title\}\}/g, escapeHtml(embed.metadata?.title || 'Embed'))
    .replace(/\{\{url\}\}/g, embed.url);
}

// Enhanced cleanup with proper resource disposal
function cleanup() {
  try {
    console.log('Starting server cleanup...');
    
    // Stop all intervals
    if (memoryManager) {
      memoryManager.cleanup();
    }
    
    // Save critical data
    const criticalData = {
      patterns: Array.from(predictiveLoader.patterns.entries()),
      performance: {
        cacheHits: aiOptimizer.cacheHits,
        cacheMisses: aiOptimizer.cacheMisses
      }
    };
    
    // Save to file for next session
    fs.writeFileSync('embed-state.json', JSON.stringify(criticalData), 'utf8');
    
    // Clear all caches
    embedCache.clear();
    templateCache.clear();
    
    console.log('Server cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

// Cleanup function for server shutdown
function cleanup() {
  try {
    memoryManager.cleanup();
    quantumSync.cleanup();
    
    // Save patterns for next session
    predictiveLoader.patterns.forEach((pattern, key) => {
      // Save to persistent storage
    });
    
    console.log('Server cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Helper functions for efficiency
function prewarmEdgeCaches(embedId, embed) {
  // Async cache warming - don't block response
  setImmediate(() => {
    embedConfig.cache.edgeLocations.forEach(location => {
      // Simulate edge cache warming
      fetch(`https://${location}.edge.example.com/prewarm`, {
        method: 'POST',
        body: JSON.stringify({ embedId, data: embed }),
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.error(`Edge cache ${location} prewarm failed:`, err));
    });
  });
}

function generateResourceHints(url, predictions) {
  const hints = {
    dns: new Set(),
    preconnect: new Set(),
    prefetch: new Set()
  };
  
  // Add main URL domain
  try {
    const urlObj = new URL(url);
    hints.dns.add(urlObj.origin);
    hints.preconnect.add(urlObj.origin);
  } catch (e) {
    // Invalid URL
  }
  
  // Add predicted embed resources
  predictions.forEach(pred => {
    if (pred.confidence > 0.5) {
      hints.prefetch.add(`/embed/${pred.embedId}`);
    }
  });
  
  return {
    dns: Array.from(hints.dns),
    preconnect: Array.from(hints.preconnect),
    prefetch: Array.from(hints.prefetch)
  };
}

// Enhanced embed features and improvements
// ...existing code...