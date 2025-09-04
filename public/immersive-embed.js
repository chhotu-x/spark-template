(function() {
  'use strict';
  
  // Immersive Embed Loader
  window.ImmersiveEmbed = {
    version: '1.0.0',
    scenes: new Map(),
    
    init: function() {
      try {
        // Load required libraries
        this.loadDependencies().then(() => {
          // Initialize all immersive embeds
          const containers = document.querySelectorAll('[data-upm-immersive]');
          containers.forEach(container => {
            const embedId = container.dataset.upmImmersive;
            const type = container.dataset.type || '3d';
            this.createScene(embedId, container, type);
          });
        });
      } catch (error) {
        console.error('Immersive embed initialization error:', error);
      }
    },
    
    loadDependencies: async function() {
      const dependencies = [];
      
      // Load Three.js if not present
      if (!window.THREE) {
        dependencies.push(this.loadScript('https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js'));
      }
      
      // Load additional libraries as needed
      if (!window.GLTFLoader) {
        dependencies.push(this.loadScript('https://cdn.jsdelivr.net/npm/three@0.150.0/examples/js/loaders/GLTFLoader.js'));
      }
      
      return Promise.all(dependencies);
    },
    
    loadScript: function(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
    
    createScene: function(embedId, container, type) {
      try {
        if (!window.THREE) {
          console.error('Three.js not loaded');
          return;
        }
        
        // Create scene components
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 10, 50);
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 2, 5);
        
        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add canvas to container
        container.appendChild(renderer.domElement);
        
        // Lighting
        this.setupLighting(scene);
        
        // Create content based on type
        const content = this.createContent(type, scene);
        
        // Controls
        const controls = this.setupControls(camera, renderer.domElement);
        
        // Post-processing
        const composer = this.setupPostProcessing(renderer, scene, camera);
        
        // Store scene data
        const sceneData = {
          embedId,
          container,
          scene,
          camera,
          renderer,
          controls,
          composer,
          content,
          animations: [],
          particles: null,
          isAnimating: true,
          lastFrameTime: 0,
          isMobile: /Mobi|Android/i.test(navigator.userAgent)
        };
        
        this.scenes.set(embedId, sceneData);
        
        // Start animation loop
        this.animate(embedId);
        
        // Handle resize
        this.handleResize(embedId);
        
        // Add interactivity
        this.addInteractivity(embedId);
        this.setupVisibilityHandling(embedId);
        
      } catch (error) {
        console.error('Scene creation error:', error);
      }
    },
    
    setupLighting: function(scene) {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      scene.add(ambientLight);
      
      // Directional light with shadows
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 10, 5);
      dirLight.castShadow = true;
      dirLight.shadow.camera.near = 0.1;
      dirLight.shadow.camera.far = 50;
      dirLight.shadow.camera.left = -10;
      dirLight.shadow.camera.right = 10;
      dirLight.shadow.camera.top = 10;
      dirLight.shadow.camera.bottom = -10;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      scene.add(dirLight);
      
      // Point lights for atmosphere
      const colors = [0xff0000, 0x00ff00, 0x0000ff];
      colors.forEach((color, i) => {
        const pointLight = new THREE.PointLight(color, 0.5, 10);
        pointLight.position.set(
          Math.cos(i * Math.PI * 2 / 3) * 5,
          2,
          Math.sin(i * Math.PI * 2 / 3) * 5
        );
        scene.add(pointLight);
      });
    },
    
    createContent: function(type, scene) {
      switch (type) {
        case '3d':
          return this.create3DContent(scene);
        case 'ar':
          return this.createARContent(scene);
        case 'holographic':
          return this.createHolographicContent(scene);
        case 'neural':
          return this.createNeuralContent(scene);
        default:
          return this.create3DContent(scene);
      }
    },
    
    create3DContent: function(scene) {
      const group = new THREE.Group();
      
      // Create animated geometries
      const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.TorusGeometry(0.5, 0.2, 16, 100),
        new THREE.ConeGeometry(0.5, 1, 32),
        new THREE.TetrahedronGeometry(0.5)
      ];
      
      geometries.forEach((geometry, i) => {
        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color().setHSL(i / geometries.length, 1, 0.5),
          metalness: 0.7,
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          emissive: new THREE.Color().setHSL(i / geometries.length, 1, 0.2),
          emissiveIntensity: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          (i - 2) * 2,
          Math.sin(i) * 0.5,
          0
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        group.add(mesh);
      });
      
      scene.add(group);
      
      // Add particle system
      const particles = this.createParticleSystem(scene);
      
      return { group, particles };
    },
    
    createParticleSystem: function(scene) {
      const particleCount = 1000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 20;
        positions[i3 + 1] = (Math.random() - 0.5) * 20;
        positions[i3 + 2] = (Math.random() - 0.5) * 20;
        
        colors[i3] = Math.random();
        colors[i3 + 1] = Math.random();
        colors[i3 + 2] = Math.random();
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8
      });
      
      const particles = new THREE.Points(geometry, material);
      scene.add(particles);
      
      return particles;
    },
    
    setupControls: function(camera, domElement) {
      if (window.THREE && window.THREE.OrbitControls) {
        const controls = new THREE.OrbitControls(camera, domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.maxDistance = 20;
        controls.minDistance = 2;
        return controls;
      }
      
      // Fallback manual controls
      return {
        update: () => {}
      };
    },
    
    setupPostProcessing: function(renderer, scene, camera) {
      // Post-processing would be set up here if EffectComposer is available
      return null;
    },
    
    animate: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData || !sceneData.isAnimating) return;
      
      const { scene, camera, renderer, controls, content } = sceneData;
      
      // Throttle animation on mobile
      const now = Date.now();
      const deltaTime = now - sceneData.lastFrameTime;
      const targetFPS = sceneData.isMobile ? 30 : 60;
      const frameInterval = 1000 / targetFPS;
      
      if (deltaTime < frameInterval) {
        requestAnimationFrame(() => this.animate(embedId));
        return;
      }
      
      sceneData.lastFrameTime = now - (deltaTime % frameInterval);
      
      const animateFrame = () => {
        if (!sceneData.isAnimating) return;
        
        requestAnimationFrame(() => this.animate(embedId));
        
        // Update controls
        if (controls && controls.update) {
          controls.update();
        }
        
        // Animate content with reduced complexity on mobile
        if (content && content.group) {
          const rotationSpeed = sceneData.isMobile ? 0.002 : 0.005;
          content.group.rotation.y += rotationSpeed;
          
          if (!sceneData.isMobile) {
            content.group.children.forEach((child, i) => {
              child.rotation.x += 0.01 * (i + 1);
              child.rotation.y += 0.01 * (i + 1);
              child.position.y = Math.sin(now * 0.001 + i) * 0.5;
            });
          }
        }
        
        // Animate particles only on desktop
        if (content && content.particles && !sceneData.isMobile) {
          content.particles.rotation.y += 0.001;
        }
        
        // Render scene
        renderer.render(scene, camera);
      };
      
      animateFrame();
    },
    
    handleResize: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      let resizeTimeout;
      
      const resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const { container, camera, renderer } = sceneData;
          
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          
          renderer.setSize(container.clientWidth, container.clientHeight);
        }, 250); // Debounce resize
      };
      
      window.addEventListener('resize', resizeHandler);
      
      // Store handler for cleanup
      sceneData.resizeHandler = resizeHandler;
    },
    
    setupVisibilityHandling: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            sceneData.isAnimating = entry.isIntersecting;
            
            if (!entry.isIntersecting) {
              // Pause rendering when not visible
              console.log(`Pausing scene ${embedId}`);
            } else {
              // Resume rendering
              console.log(`Resuming scene ${embedId}`);
              this.animate(embedId);
            }
          });
        }, { threshold: 0.1 });
        
        observer.observe(sceneData.container);
        sceneData.visibilityObserver = observer;
      }
      
      // Also handle tab visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          sceneData.isAnimating = false;
        } else if (this.isElementVisible(sceneData.container)) {
          sceneData.isAnimating = true;
          this.animate(embedId);
        }
      });
    },
    
    addInteractivity: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      const { renderer, scene, camera } = sceneData;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // Debounced click handler
      let clickTimeout;
      const handleClick = (event) => {
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          raycaster.setFromCamera(mouse, camera);
          
          const intersectableObjects = scene.children.filter(child => 
            child.type === 'Mesh' || child.type === 'Group'
          );
          
          const intersects = raycaster.intersectObjects(intersectableObjects, true);
          
          if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Simple animation
            if (object.material) {
              const originalEmissive = object.material.emissive ? object.material.emissive.clone() : new THREE.Color(0x000000);
              object.material.emissive = new THREE.Color(0xffffff);
              
              setTimeout(() => {
                object.material.emissive = originalEmissive;
              }, 200);
            }
            
            // Track interaction
            this.trackInteraction(embedId, 'click', {
              objectType: object.geometry?.type || 'unknown'
            });
          }
        }, 100); // Debounce clicks
      };
      
      renderer.domElement.addEventListener('click', handleClick);
      sceneData.clickHandler = handleClick;
    },
    
    trackInteraction: function(embedId, type, data) {
      // Send to main embed tracking if available
      if (window.UPMEmbed && window.UPMEmbed.trackEvent) {
        window.UPMEmbed.trackEvent(embedId, `immersive-${type}`, data);
      }
    },
    
    // Public API methods
    updateScene: function(embedId, updates) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      if (updates.background !== undefined) {
        sceneData.scene.background = new THREE.Color(updates.background);
      }
      
      if (updates.fog !== undefined) {
        if (updates.fog) {
          sceneData.scene.fog = new THREE.Fog(
            updates.fog.color || 0x000000,
            updates.fog.near || 10,
            updates.fog.far || 50
          );
        } else {
          sceneData.scene.fog = null;
        }
      }
      
      if (updates.quality !== undefined) {
        this.updateRenderQuality(embedId, updates.quality);
      }
    },
    
    updateRenderQuality: function(embedId, quality) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      const { renderer, scene } = sceneData;
      
      switch (quality) {
        case 'low':
          renderer.setPixelRatio(1);
          renderer.shadowMap.enabled = false;
          scene.traverse(child => {
            if (child.material && child.material.quality) {
              child.material.quality = 'low';
            }
          });
          break;
        case 'medium':
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.BasicShadowMap;
          break;
        case 'high':
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          break;
      }
    },
    
    pauseScene: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (sceneData) {
        sceneData.isAnimating = false;
      }
    },
    
    resumeScene: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (sceneData && this.isElementVisible(sceneData.container)) {
        sceneData.isAnimating = true;
        this.animate(embedId);
      }
    },
    
    dispose: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return;
      
      // Stop animation
      sceneData.isAnimating = false;
      
      // Dispose Three.js resources
      const { scene, renderer, controls } = sceneData;
      
      // Dispose geometries and materials
      scene.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      // Dispose textures
      renderer.dispose();
      
      // Remove event listeners
      if (sceneData.resizeHandler) {
        window.removeEventListener('resize', sceneData.resizeHandler);
      }
      
      if (sceneData.clickHandler) {
        renderer.domElement.removeEventListener('click', sceneData.clickHandler);
      }
      
      if (controls && controls.dispose) {
        controls.dispose();
      }
      
      // Disconnect observers
      if (sceneData.visibilityObserver) {
        sceneData.visibilityObserver.disconnect();
      }
      
      // Remove canvas
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      
      // Clear references
      this.scenes.delete(embedId);
      
      console.log(`Disposed immersive scene ${embedId}`);
    },
    
    // Batch disposal for memory management
    disposeAll: function() {
      const embedIds = Array.from(this.scenes.keys());
      embedIds.forEach(embedId => this.dispose(embedId));
    },
    
    // Get scene statistics
    getStats: function(embedId) {
      const sceneData = this.scenes.get(embedId);
      if (!sceneData) return null;
      
      const { scene, renderer } = sceneData;
      
      let triangles = 0;
      let materials = new Set();
      let textures = new Set();
      
      scene.traverse(child => {
        if (child.geometry) {
          const geometry = child.geometry;
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => materials.add(mat));
          } else {
            materials.add(child.material);
          }
        }
      });
      
      return {
        triangles,
        materials: materials.size,
        textures: textures.size,
        memory: renderer.info.memory,
        render: renderer.info.render
      };
    }
  };
  
  // Auto-initialize with proper error handling
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        window.ImmersiveEmbed.init();
      } catch (error) {
        console.error('Failed to initialize ImmersiveEmbed:', error);
      }
    });
  } else {
    try {
      window.ImmersiveEmbed.init();
    } catch (error) {
      console.error('Failed to initialize ImmersiveEmbed:', error);
    }
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.ImmersiveEmbed) {
      window.ImmersiveEmbed.disposeAll();
    }
  });
})();
