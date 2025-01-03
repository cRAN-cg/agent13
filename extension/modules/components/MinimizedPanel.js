export class MinimizedPanel {
    #iconEl = null;
    #panelEl = null;
    #core = null;
    #dragState = null;
    #initialPosition = { x: 0, y: 0 };
    #currentPosition = { x: 0, y: 0 };
    #animationFrame = null;
    #onMaximize = null;
  
    constructor(core, panelEl, onMaximize) {
      this.#core = core;
      this.#panelEl = panelEl;
      this.#onMaximize = onMaximize;
      this.#initialPosition = {
        x: window.innerWidth - 60,
        y: window.innerHeight - 60,
      };
      this.#currentPosition = { ...this.#initialPosition };
    }
  
    minimize() {
      // Create the icon element
      this.#iconEl = document.createElement("div");
      this.#iconEl.className = "agent13-panel-icon";
  
      // Style the icon
      Object.assign(this.#iconEl.style, {
        position: "fixed",
        width: "var(--collapsed-icon-size)",
        height: "var(--collapsed-icon-size)",
        left: `${this.#currentPosition.x}px`,
        top: `${this.#currentPosition.y}px`,
        background: "var(--gradient-primary)",
        borderRadius: "50%",
        cursor: "grab",
        boxShadow:
          "var(--shadow-md), 0 0 20px hsla(var(--accent-hue), 70%, 50%, 0.2)",
        border: "2px solid hsla(var(--accent-hue), 70%, 95%, 0.25)",
        willChange: "transform",
        overflow: "hidden",
        userSelect: "none",
        opacity: "0.9",
        transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
        zIndex: "2147483647",
      });
  
      // Add the "13" text
      const textEl = document.createElement("div");
      Object.assign(textEl.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "white",
        fontSize: "calc(var(--collapsed-icon-size) * 0.5)",
        fontWeight: "700",
        fontFamily: "var(--font-mono)",
        textShadow: "0 2px 8px hsla(var(--accent-hue), 70%, 20%, 0.3)",
      });
      textEl.textContent = "13";
      this.#iconEl.appendChild(textEl);
  
      // Add hover effect
      this.#iconEl.addEventListener("mouseenter", () => {
        Object.assign(this.#iconEl.style, {
          opacity: "1",
          borderColor: "hsla(var(--accent-hue), 70%, 95%, 0.4)",
          boxShadow:
            "var(--shadow-lg), 0 0 25px hsla(var(--accent-hue), 70%, 50%, 0.3)",
        });
      });
  
      this.#iconEl.addEventListener("mouseleave", () => {
        Object.assign(this.#iconEl.style, {
          opacity: "0.9",
          borderColor: "hsla(var(--accent-hue), 70%, 95%, 0.25)",
          boxShadow:
            "var(--shadow-md), 0 0 20px hsla(var(--accent-hue), 70%, 50%, 0.2)",
        });
      });
  
      // Setup event handlers
      this.#setupDragHandlers();
      this.#iconEl.addEventListener("dblclick", () => {
        this.maximize();
      });
  
      // Add to DOM
      document.body.appendChild(this.#iconEl);
  
      // Detach panel from DOM but keep the reference
      this.#panelEl.remove();
    }
  
    maximize() {
      if (this.#onMaximize) {
        // Remove icon
        if (this.#iconEl) {
          this.#iconEl.remove();
          this.#iconEl = null;
        }
  
        // Reattach panel
        document.body.appendChild(this.#panelEl);
  
        // Call the maximize callback
        this.#onMaximize();
      }
    }
  
    #setupDragHandlers() {
      this.#dragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        velocity: { x: 0, y: 0 },
        lastX: 0,
        lastY: 0,
        lastTime: 0
      };
  
      const onDragStart = (e) => {
        if (!this.#iconEl || e.button !== 0) return;
        e.preventDefault();
  
        // Calculate offset from the current position
        const rect = this.#iconEl.getBoundingClientRect();
        this.#dragState.startX = e.clientX - rect.left;
        this.#dragState.startY = e.clientY - rect.top;
  
        this.#dragState.isDragging = true;
        
        // Momentum tracking
        this.#dragState.lastX = e.clientX;
        this.#dragState.lastY = e.clientY;
        this.#dragState.lastTime = performance.now();
  
        this.#iconEl.style.transition = "none";
        this.#iconEl.style.cursor = "grabbing";
  
        // Add subtle scale and rotation while dragging
        this.#iconEl.style.transform = "scale(1.05) rotate(0.5deg)";
      };
  
      const onDrag = (e) => {
        if (!this.#dragState.isDragging) return;
        e.preventDefault();
        
        // Momentum calculation
        const now = performance.now();
        const dt = now - this.#dragState.lastTime;
        const dx = e.clientX - this.#dragState.lastX;
        const dy = e.clientY - this.#dragState.lastY;
        const hasMoved = Math.sqrt(dx * dx + dy * dy) > 5;
  
        if (dt > 0 && hasMoved) {
          this.#dragState.velocity.x = dx / dt;
          this.#dragState.velocity.y = dy / dt;
          this.#dragState.lastX = e.clientX;
          this.#dragState.lastY = e.clientY;
          this.#dragState.lastTime = now;
        }
  
        // Update position with smooth animation
        if (this.#animationFrame) cancelAnimationFrame(this.#animationFrame);
        this.#animationFrame = requestAnimationFrame(() => {
          const x = e.clientX - this.#dragState.startX;
          const y = e.clientY - this.#dragState.startY;
          this.#updatePosition(x, y);
        });
      };
  
      const onDragEnd = () => {
        if (!this.#dragState.isDragging) return;
  
        this.#dragState.isDragging = false;
  
        // Momentum animation
        const velocityMagnitude = Math.sqrt(
          this.#dragState.velocity.x * this.#dragState.velocity.x +
          this.#dragState.velocity.y * this.#dragState.velocity.y
        );
  
        if (velocityMagnitude > 0.1) {
          let momentum = {
            x: this.#dragState.velocity.x * 1,
            y: this.#dragState.velocity.y * 1
          };
  
          const animate = () => {
            if (!this.#iconEl) return;
            if (Math.abs(momentum.x) < 0.1 && Math.abs(momentum.y) < 0.1) {
              this.#iconEl.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
              this.#iconEl.style.transform = this.#iconEl.style.transform.replace(' scale(1.05) rotate(0.5deg)', '');
              this.#iconEl.style.cursor = 'grab';
              return;
            }
  
            const x = this.#currentPosition.x + momentum.x;
            const y = this.#currentPosition.y + momentum.y;
            this.#updatePosition(x, y);
  
            momentum.x *= 0.9;
            momentum.y *= 0.95;
            requestAnimationFrame(animate);
          };
  
          animate();
        }
  
        // Reset visual state
        this.#iconEl.style.transition = "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)";
        this.#iconEl.style.transform = this.#iconEl.style.transform.replace(
          " scale(1.05) rotate(0.5deg)",
          ""
        );
        this.#iconEl.style.cursor = "grab";
      };
  
      // Add event listeners
      this.#iconEl.addEventListener("mousedown", onDragStart);
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", onDragEnd);
  
      // Store handlers for cleanup
      this.#dragState.cleanup = () => {
        this.#iconEl.removeEventListener("mousedown", onDragStart);
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", onDragEnd);
        if (this.#animationFrame) {
          cancelAnimationFrame(this.#animationFrame);
          this.#animationFrame = null;
        }
      };
    }
  
    #updatePosition(x, y) {
      if (!this.#iconEl) return;
  
      // Keep icon within viewport bounds with smooth edge bounce
      const bounds = this.#iconEl.getBoundingClientRect();
      const minX = -bounds.width + 20;
      const maxX = window.innerWidth - 20;
      const minY = -bounds.height + 20;
      const maxY = window.innerHeight - 20;
  
      // Add subtle bounce effect when hitting edges
      const bounceX = this.#calculateBounce(x, minX, maxX);
      const bounceY = this.#calculateBounce(y, minY, maxY);
  
      // Update element position
      this.#iconEl.style.left = `${bounceX}px`;
      this.#iconEl.style.top = `${bounceY}px`;
  
      // Update transform with scale and rotation during drag
      const transform = this.#dragState?.isDragging
        ? "scale(1.05) rotate(0.5deg)"
        : "";
      this.#iconEl.style.transform = transform;
  
      // Store the actual position without bounce
      this.#currentPosition = {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    }
  
    #calculateBounce(value, min, max) {
      if (value < min) {
        const overflow = min - value;
        return min - overflow * 0.2; // Subtle bounce
      }
      if (value > max) {
        const overflow = value - max;
        return max + overflow * 0.2; // Subtle bounce
      }
      return value;
    }
  
    destroy() {
      if (this.#dragState?.cleanup) {
        this.#dragState.cleanup();
        this.#dragState = null;
      }
      if (this.#animationFrame) {
        cancelAnimationFrame(this.#animationFrame);
        this.#animationFrame = null;
      }
      if (this.#iconEl) {
        this.#iconEl.remove();
        this.#iconEl = null;
      }
      this.#panelEl = null;
      this.#core = null;
    }
  }