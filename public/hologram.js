(function() {
  'use strict';
  
  class HologramDisplay {
    constructor() {
      this.activeHolograms = new Map();
      this.shaders = {
        vertex: `
          attribute vec3 position;
          attribute vec3 normal;
          attribute vec2 uv;
          
          uniform mat4 projectionMatrix;
          uniform mat4 modelViewMatrix;
          uniform float time;
          
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normal;
            vUv = uv;
            
            vec3 pos = position;
            pos.y += sin(time + position.x * 5.0) * 0.02;
            pos.x += cos(time + position.z * 3.0) * 0.01;
            
            vPosition = pos;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragment: `
          precision highp float;
          
          uniform float time;
          uniform vec3 color;
          uniform sampler2D texture;
          
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vec3 light = normalize(vec3(0.5, 1.0, 0.3));
            float brightness = dot(vNormal, light) * 0.5 + 0.5;
            
            vec3 hologramColor = color;
            hologramColor += vec3(0.0, sin(time) * 0.1 + 0.1, sin(time * 1.5) * 0.1 + 0.1);
            
            // Scan lines
            float scanline = sin(vPosition.y * 100.0 + time * 10.0) * 0.04;
            hologramColor += vec3(scanline);
            
            // Glitch effect
            float glitch = step(0.98, sin(time * 20.0)) * 0.2;
            hologramColor.r += glitch;
            
            // Edge glow
            float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
            hologramColor += vec3(0.0, 0.5, 1.0) * pow(edge, 2.0);
            
            gl_FragColor = vec4(hologramColor * brightness, 0.8);
          }
        `
      };
    }
    
    async initialize(container, hologramId) {
      try {
        const canvas = document.createElement('canvas');
        canvas.className = 'hologram-canvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          throw new Error('WebGL not supported');
        }
        
        const hologram = {
          canvas,
          gl,
          program: this.createShaderProgram(gl),
          buffers: this.createBuffers(gl),
          uniforms: {},
          startTime: Date.now(),
          animationId: null
        };
        
        this.activeHolograms.set(hologramId, hologram);
        this.setupHologram(hologram);
        this.animate(hologramId);
        
        return hologram;
      } catch (error) {
        console.error('Hologram initialization failed:', error);
        throw error;
      }
    }
    
    createShaderProgram(gl) {
      const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, this.shaders.vertex);
      const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, this.shaders.fragment);
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Shader program failed to link');
      }
      
      return program;
    }
    
    compileShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Shader compilation failed: ' + gl.getShaderInfoLog(shader));
      }
      
      return shader;
    }
    
    createBuffers(gl) {
      // Create a simple cube geometry
      const positions = new Float32Array([
        // Front face
        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
        // Back face
        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
        // Top face
        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
        // Bottom face
        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
        // Right face
         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
        // Left face
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
      ]);
      
      const normals = new Float32Array([
        // Front face
         0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
        // Back face
         0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
        // Top face
         0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
        // Bottom face
         0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
        // Right face
         1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
        // Left face
        -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0
      ]);
      
      const indices = new Uint16Array([
        0,  1,  2,    0,  2,  3,    // front
        4,  5,  6,    4,  6,  7,    // back
        8,  9, 10,    8, 10, 11,    // top
       12, 13, 14,   12, 14, 15,    // bottom
       16, 17, 18,   16, 18, 19,    // right
       20, 21, 22,   20, 22, 23     // left
      ]);
      
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
      
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      
      return {
        position: positionBuffer,
        normal: normalBuffer,
        index: indexBuffer,
        count: indices.length
      };
    }
    
    setupHologram(hologram) {
      const { gl, program } = hologram;
      
      gl.useProgram(program);
      
      // Get attribute and uniform locations
      hologram.attributes = {
        position: gl.getAttribLocation(program, 'position'),
        normal: gl.getAttribLocation(program, 'normal')
      };
      
      hologram.uniforms = {
        projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
        time: gl.getUniformLocation(program, 'time'),
        color: gl.getUniformLocation(program, 'color')
      };
      
      // Enable depth testing and blending
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Set clear color
      gl.clearColor(0, 0, 0, 0);
    }
    
    animate(hologramId) {
      const hologram = this.activeHolograms.get(hologramId);
      if (!hologram) return;
      
      const render = () => {
        this.renderHologram(hologram);
        hologram.animationId = requestAnimationFrame(render);
      };
      
      render();
    }
    
    renderHologram(hologram) {
      const { gl, program, buffers, uniforms, canvas, startTime } = hologram;
      
      // Resize canvas if needed
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      
      // Calculate matrices
      const time = (Date.now() - startTime) / 1000;
      const projectionMatrix = this.createProjectionMatrix(canvas.width / canvas.height);
      const modelViewMatrix = this.createModelViewMatrix(time);
      
      // Set uniforms
      gl.uniformMatrix4fv(uniforms.projectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, modelViewMatrix);
      gl.uniform1f(uniforms.time, time);
      gl.uniform3f(uniforms.color, 0.0, 1.0, 0.5);
      
      // Bind buffers and draw
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(hologram.attributes.position);
      gl.vertexAttribPointer(hologram.attributes.position, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.enableVertexAttribArray(hologram.attributes.normal);
      gl.vertexAttribPointer(hologram.attributes.normal, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
    }
    
    createProjectionMatrix(aspect) {
      const fov = 45 * Math.PI / 180;
      const near = 0.1;
      const far = 100;
      const f = 1.0 / Math.tan(fov / 2);
      
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
      ]);
    }
    
    createModelViewMatrix(time) {
      const distance = 5;
      const rotationY = time * 0.5;
      const rotationX = Math.sin(time * 0.3) * 0.3;
      
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      
      return new Float32Array([
        cosY, sinX * sinY, cosX * sinY, 0,
        0, cosX, -sinX, 0,
        -sinY, sinX * cosY, cosX * cosY, 0,
        0, 0, -distance, 1
      ]);
    }
    
    destroy(hologramId) {
      const hologram = this.activeHolograms.get(hologramId);
      if (!hologram) return;
      
      if (hologram.animationId) {
        cancelAnimationFrame(hologram.animationId);
      }
      
      const { gl, program, buffers } = hologram;
      
      gl.deleteProgram(program);
      gl.deleteBuffer(buffers.position);
      gl.deleteBuffer(buffers.normal);
      gl.deleteBuffer(buffers.index);
      
      hologram.canvas.remove();
      this.activeHolograms.delete(hologramId);
    }
  }
  
  // Initialize hologram displays on page load
  document.addEventListener('DOMContentLoaded', () => {
    window.hologramDisplay = new HologramDisplay();
    
    // Auto-initialize hologram containers
    document.querySelectorAll('.hologram-container').forEach(container => {
      const hologramId = container.dataset.hologramId;
      if (hologramId) {
        window.hologramDisplay.initialize(container, hologramId).catch(error => {
          console.error('Failed to initialize hologram:', error);
          container.innerHTML = '<div class="hologram-fallback">Holographic display not available</div>';
        });
      }
    });
  });
})();
