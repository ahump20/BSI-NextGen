/**
 * ErrorToast.ts
 * Toast notification system for displaying errors and messages
 */

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number; // milliseconds (0 = no auto-dismiss)
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  dismissible?: boolean; // Show close button
}

interface ToastInstance {
  id: string;
  element: HTMLElement;
  timer?: number;
}

export class ErrorToast {
  private static activeToasts: ToastInstance[] = [];
  private static container: HTMLElement | null = null;
  private static stylesInjected: boolean = false;

  /**
   * Show a toast notification
   */
  public static show(config: ToastConfig): string {
    const toastId = this.generateId();

    // Ensure container exists
    if (!this.container) {
      this.createContainer(config.position || "top-right");
    }

    // Inject styles if needed
    if (!this.stylesInjected) {
      this.injectStyles();
      this.stylesInjected = true;
    }

    // Create toast element
    const toast = this.createToast(toastId, config);

    // Add to container
    this.container!.appendChild(toast);

    // Store instance
    const instance: ToastInstance = {
      id: toastId,
      element: toast
    };

    // Auto-dismiss after duration
    if (config.duration !== 0) {
      const duration = config.duration || 5000; // Default 5 seconds
      instance.timer = window.setTimeout(() => {
        this.dismiss(toastId);
      }, duration);
    }

    this.activeToasts.push(instance);

    // Animate entrance
    setTimeout(() => {
      toast.classList.add("visible");
    }, 10);

    return toastId;
  }

  /**
   * Dismiss a specific toast
   */
  public static dismiss(toastId: string): void {
    const instance = this.activeToasts.find(t => t.id === toastId);
    if (!instance) return;

    // Clear timer if exists
    if (instance.timer) {
      clearTimeout(instance.timer);
    }

    // Animate exit
    instance.element.classList.remove("visible");

    // Remove from DOM after animation
    setTimeout(() => {
      instance.element.remove();
      this.activeToasts = this.activeToasts.filter(t => t.id !== toastId);

      // Remove container if no toasts left
      if (this.activeToasts.length === 0 && this.container) {
        this.container.remove();
        this.container = null;
      }
    }, 300);
  }

  /**
   * Dismiss all active toasts
   */
  public static dismissAll(): void {
    const toastIds = this.activeToasts.map(t => t.id);
    toastIds.forEach(id => this.dismiss(id));
  }

  /**
   * Convenience methods for specific toast types
   */
  public static error(message: string, duration?: number): string {
    return this.show({ message, type: "error", duration });
  }

  public static success(message: string, duration?: number): string {
    return this.show({ message, type: "success", duration });
  }

  public static warning(message: string, duration?: number): string {
    return this.show({ message, type: "warning", duration });
  }

  public static info(message: string, duration?: number): string {
    return this.show({ message, type: "info", duration });
  }

  /**
   * Create toast container
   */
  private static createContainer(position: string): void {
    this.container = document.createElement("div");
    this.container.className = `toast-container ${position}`;
    document.body.appendChild(this.container);
  }

  /**
   * Create individual toast element
   */
  private static createToast(id: string, config: ToastConfig): HTMLElement {
    const toast = document.createElement("div");
    toast.className = `toast ${config.type || "error"}`;
    toast.dataset.toastId = id;

    // Icon based on type
    const icon = this.getIcon(config.type || "error");

    // Message
    const message = document.createElement("div");
    message.className = "toast-message";
    message.textContent = config.message;

    // Close button (if dismissible)
    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => this.dismiss(id);

    // Assemble
    if (icon) {
      const iconEl = document.createElement("div");
      iconEl.className = "toast-icon";
      iconEl.innerHTML = icon;
      toast.appendChild(iconEl);
    }

    toast.appendChild(message);

    if (config.dismissible !== false) {
      toast.appendChild(closeBtn);
    }

    return toast;
  }

  /**
   * Get icon for toast type
   */
  private static getIcon(type: ToastType): string {
    switch (type) {
      case "error":
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
      case "success":
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="8 12 11 15 16 9"></polyline>
        </svg>`;
      case "warning":
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
      case "info":
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
      default:
        return "";
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Inject CSS styles
   */
  private static injectStyles(): void {
    const styleId = "error-toast-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /* Toast container positioning */
      .toast-container {
        position: fixed;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 400px;
      }

      .toast-container.top-right {
        top: 20px;
        right: 20px;
      }

      .toast-container.top-left {
        top: 20px;
        left: 20px;
      }

      .toast-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .toast-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .toast-container.top-center {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast-container.bottom-center {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      /* Individual toast */
      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.95);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        pointer-events: auto;
        min-width: 300px;
        max-width: 100%;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Type-specific colors */
      .toast.error {
        border-left: 4px solid #ef4444;
      }

      .toast.error .toast-icon {
        color: #ef4444;
      }

      .toast.success {
        border-left: 4px solid #10b981;
      }

      .toast.success .toast-icon {
        color: #10b981;
      }

      .toast.warning {
        border-left: 4px solid #f59e0b;
      }

      .toast.warning .toast-icon {
        color: #f59e0b;
      }

      .toast.info {
        border-left: 4px solid #3b82f6;
      }

      .toast.info .toast-icon {
        color: #3b82f6;
      }

      /* Toast icon */
      .toast-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Toast message */
      .toast-message {
        flex: 1;
        color: white;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      /* Close button */
      .toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        transition: color 0.2s;
      }

      .toast-close:hover {
        color: white;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .toast-container {
          max-width: calc(100% - 40px);
          left: 20px !important;
          right: 20px !important;
          transform: none !important;
        }

        .toast {
          min-width: 0;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
