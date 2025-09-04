add new experimental features in embeds only.
enhance all embeds features only.

Example of a Structured response:
   - Input: anything.
      - Expected Output: code written with errorhandling.

```javascript
// Gesture Control System
(function() {
  class GestureControl {
    constructor() {
      this.activeGestures = new Map();
      this.listeners = new Map();
      this.recognizers = {
        swipe: new SwipeRecognizer(),
        pinch: new PinchRecognizer(),
        rotate: new RotateRecognizer(),
        tap: new TapRecognizer(),
        longPress: new LongPressRecognizer()
      };
    }
    
    initialize(container, embedId) {
      const overlay = document.createElement('div');
      overlay.className = 'gesture-overlay';
      overlay.dataset.embedId = embedId;
      container.appendChild(overlay);
      
      // Touch events for mobile
      overlay.addEventListener('touchstart', (e) => this.handleTouchStart(e, embedId));
      overlay.addEventListener('touchmove', (e) => this.handleTouchMove(e, embedId));
      overlay.addEventListener('touchend', (e) => this.handleTouchEnd(e, embedId));
      overlay.addEventListener('touchcancel', (e) => this.handleTouchEnd(e, embedId));
      
      // Pointer events for unified handling
      overlay.addEventListener('pointerdown', (e) => this.handlePointerDown(e, embedId));
      overlay.addEventListener('pointermove', (e) => this.handlePointerMove(e, embedId));
      overlay.addEventListener('pointerup', (e) => this.handlePointerUp(e, embedId));
      overlay.addEventListener('pointercancel', (e) => this.handlePointerCancel(e, embedId));
      
      // Wheel events for zoom
      overlay.addEventListener('wheel', (e) => this.handleWheel(e, embedId), { passive: false });
      
      this.activeGestures.set(embedId, {
        overlay,
        touches: new Map(),
        pointers: new Map(),
        startTime: 0,
        lastEvent: null
      });
      
      // Visual feedback system
      this.createFeedbackSystem(overlay);
    }
    
    createFeedbackSystem(overlay) {
      const feedback = document.createElement('div');
      feedback.className = 'gesture-feedback';
      feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        z-index: 1001;
      `;
      overlay.appendChild(feedback);
      overlay.feedback = feedback;
    }
    
    showFeedback(embedId, message, duration = 1000) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture || !gesture.overlay.feedback) return;
        
        const feedback = gesture.overlay.feedback;
        feedback.textContent = message;
        feedback.style.opacity = '1';
        
        setTimeout(() => {
          feedback.style.opacity = '0';
        }, duration);
      } catch (error) {
        console.error('Gesture feedback error:', error);
      }
    }
    
    handleTouchStart(e, embedId) {
      try {
        e.preventDefault();
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        gesture.startTime = Date.now();
        
        for (const touch of e.changedTouches) {
          gesture.touches.set(touch.identifier, {
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            startTime: Date.now()
          });
        }
        
        // Check for recognizable gestures
        this.detectGesture(embedId, 'start');
      } catch (error) {
        console.error('Touch start error:', error);
      }
    }
    
    handleTouchMove(e, embedId) {
      try {
        e.preventDefault();
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        for (const touch of e.changedTouches) {
          const touchData = gesture.touches.get(touch.identifier);
          if (touchData) {
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;
          }
        }
        
        this.detectGesture(embedId, 'move');
      } catch (error) {
        console.error('Touch move error:', error);
      }
    }
    
    handleTouchEnd(e, embedId) {
      try {
        e.preventDefault();
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        for (const touch of e.changedTouches) {
          gesture.touches.delete(touch.identifier);
        }
        
        this.detectGesture(embedId, 'end');
        
        if (gesture.touches.size === 0) {
          gesture.startTime = 0;
        }
      } catch (error) {
        console.error('Touch end error:', error);
      }
    }
    
    handlePointerDown(e, embedId) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        gesture.pointers.set(e.pointerId, {
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY,
          startTime: Date.now(),
          type: e.pointerType
        });
        
        this.detectGesture(embedId, 'start');
      } catch (error) {
        console.error('Pointer down error:', error);
      }
    }
    
    handlePointerMove(e, embedId) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        const pointer = gesture.pointers.get(e.pointerId);
        if (pointer) {
          pointer.currentX = e.clientX;
          pointer.currentY = e.clientY;
          this.detectGesture(embedId, 'move');
        }
      } catch (error) {
        console.error('Pointer move error:', error);
      }
    }
    
    handlePointerUp(e, embedId) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        gesture.pointers.delete(e.pointerId);
        this.detectGesture(embedId, 'end');
      } catch (error) {
        console.error('Pointer up error:', error);
      }
    }
    
    handlePointerCancel(e, embedId) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        gesture.pointers.delete(e.pointerId);
      } catch (error) {
        console.error('Pointer cancel error:', error);
      }
    }
    
    handleWheel(e, embedId) {
      try {
        e.preventDefault();
        
        const scale = e.deltaY > 0 ? 0.9 : 1.1;
        this.emit(embedId, 'zoom', {
          scale,
          centerX: e.clientX,
          centerY: e.clientY
        });
        
        this.showFeedback(embedId, e.deltaY > 0 ? 'Zoom Out' : 'Zoom In');
      } catch (error) {
        console.error('Wheel error:', error);
      }
    }
    
    detectGesture(embedId, phase) {
      try {
        const gesture = this.activeGestures.get(embedId);
        if (!gesture) return;
        
        const touches = Array.from(gesture.touches.values());
        const pointers = Array.from(gesture.pointers.values());
        const inputs = touches.length > 0 ? touches : pointers;
        
        // Single touch/pointer gestures
        if (inputs.length === 1) {
          const input = inputs[0];
          
          // Swipe detection
          const swipe = this.recognizers.swipe.recognize(input, phase);
          if (swipe) {
            this.emit(embedId, 'swipe', swipe);
            this.showFeedback(embedId, `Swipe ${swipe.direction}`);
          }
          
          // Tap detection
          const tap = this.recognizers.tap.recognize(input, phase);
          if (tap) {
            this.emit(embedId, 'tap', tap);
            this.showFeedback(embedId, 'Tap');
          }
          
          // Long press detection
          const longPress = this.recognizers.longPress.recognize(input, phase);
          if (longPress) {
            this.emit(embedId, 'longPress', longPress);
            this.showFeedback(embedId, 'Long Press');
          }
        }
        
        // Multi-touch gestures
        else if (inputs.length === 2) {
          // Pinch detection
          const pinch = this.recognizers.pinch.recognize(inputs, phase);
          if (pinch) {
            this.emit(embedId, 'pinch', pinch);
            this.showFeedback(embedId, pinch.scale > 1 ? 'Zoom In' : 'Zoom Out');
          }
          
          // Rotate detection
          const rotate = this.recognizers.rotate.recognize(inputs, phase);
          if (rotate) {
            this.emit(embedId, 'rotate', rotate);
            this.showFeedback(embedId, `Rotate ${rotate.angle > 0 ? 'CW' : 'CCW'}`);
          }
        }
      } catch (error) {
        console.error('Gesture detection error:', error);
      }
    }
    
    on(embedId, event, callback) {
      if (!this.listeners.has(embedId)) {
        this.listeners.set(embedId, new Map());
      }
      
      const embedListeners = this.listeners.get(embedId);
      if (!embedListeners.has(event)) {
        embedListeners.set(event, []);
      }
      
      embedListeners.get(event).push(callback);
    }
    
    emit(embedId, event, data) {
      try {
        const embedListeners = this.listeners.get(embedId);
        if (!embedListeners) return;
        
        const callbacks = embedListeners.get(event);
        if (!callbacks) return;
        
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Gesture callback error for ${event}:`, error);
          }
        });
        
        // Send to server
        fetch(`/api/embeds/${embedId}/gesture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gesture: event,
            ...data
          })
        }).catch(console.error);
      } catch (error) {
        console.error('Gesture emit error:', error);
      }
    }
    
    destroy(embedId) {
      const gesture = this.activeGestures.get(embedId);
      if (gesture && gesture.overlay) {
        gesture.overlay.remove();
      }
      
      this.activeGestures.delete(embedId);
      this.listeners.delete(embedId);
    }
  }
  
  // Gesture Recognizers
  class SwipeRecognizer {
    constructor() {
      this.threshold = 50;
      this.velocity = 0.5;
    }
    
    recognize(input, phase) {
      if (phase !== 'end') return null;
      
      const dx = input.currentX - input.startX;
      const dy = input.currentY - input.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.threshold) return null;
      
      const time = Date.now() - input.startTime;
      const speed = distance / time;
      
      if (speed < this.velocity) return null;
      
      let direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      
      return {
        direction,
        distance,
        velocity: speed,
        angle: Math.atan2(dy, dx) * 180 / Math.PI
      };
    }
  }
  
  class PinchRecognizer {
    constructor() {
      this.threshold = 0.1;
    }
    
    recognize(inputs, phase) {
      if (inputs.length !== 2) return null;
      if (phase !== 'move') return null;
      
      const [a, b] = inputs;
      
      const startDistance = Math.sqrt(
        Math.pow(b.startX - a.startX, 2) + 
        Math.pow(b.startY - a.startY, 2)
      );
      
      const currentDistance = Math.sqrt(
        Math.pow(b.currentX - a.currentX, 2) + 
        Math.pow(b.currentY - a.currentY, 2)
      );
      
      const scale = currentDistance / startDistance;
      
      if (Math.abs(scale - 1) < this.threshold) return null;
      
      return {
        scale,
        centerX: (a.currentX + b.currentX) / 2,
        centerY: (a.currentY + b.currentY) / 2
      };
    }
  }
  
  class RotateRecognizer {
    constructor() {
      this.threshold = 5; // degrees
    }
    
    recognize(inputs, phase) {
      if (inputs.length !== 2) return null;
      if (phase !== 'move') return null;
      
      const [a, b] = inputs;
      
      const startAngle = Math.atan2(
        b.startY - a.startY,
        b.startX - a.startX
      ) * 180 / Math.PI;
      
      const currentAngle = Math.atan2(
        b.currentY - a.currentY,
        b.currentX - a.currentX
      ) * 180 / Math.PI;
      
      let angle = currentAngle - startAngle;
      
      // Normalize angle
      if (angle > 180) angle -= 360;
      if (angle < -180) angle += 360;
      
      if (Math.abs(angle) < this.threshold) return null;
      
      return {
        angle,
        centerX: (a.currentX + b.currentX) / 2,
        centerY: (a.currentY + b.currentY) / 2
      };
    }
  }
  
  class TapRecognizer {
    constructor() {
      this.threshold = 10;
      this.maxDuration = 200;
    }
    
    recognize(input, phase) {
      if (phase !== 'end') return null;
      
      const duration = Date.now() - input.startTime;
      if (duration > this.maxDuration) return null;
      
      const distance = Math.sqrt(
        Math.pow(input.currentX - input.startX, 2) + 
        Math.pow(input.currentY - input.startY, 2)
      );
      
      if (distance > this.threshold) return null;
      
      return {
        x: input.currentX,
        y: input.currentY,
        duration
      };
    }
  }
  
  class LongPressRecognizer {
    constructor() {
      this.minDuration = 500;
      this.threshold = 10;
    }
    
    recognize(input, phase) {
      if (phase !== 'move' && phase !== 'end') return null;
      
      const duration = Date.now() - input.startTime;
      if (duration < this.minDuration) return null;
      
      const distance = Math.sqrt(
        Math.pow(input.currentX - input.startX, 2) + 
        Math.pow(input.currentY - input.startY, 2)
      );
      
      if (distance > this.threshold) return null;
      
      return {
        x: input.currentX,
        y: input.currentY,
        duration
      };
    }
  }
  
  // Initialize gesture control
  window.gestureControl = new GestureControl();
  
  // Auto-initialize gesture overlays
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.gesture-overlay').forEach(overlay => {
      const embedId = overlay.dataset.embedId;
      if (embedId) {
        window.gestureControl.initialize(overlay.parentElement, embedId);
      }
    });
  });
})();
```