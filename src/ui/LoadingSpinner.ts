/**
 * LoadingSpinner.ts
 * Reusable loading spinner component for async operations
 */

export interface LoadingSpinnerConfig {
  container?: HTMLElement;
  message?: string;
  size?: "small" | "medium" | "large";
  overlay?: boolean; // Full-screen overlay vs. inline
}

export class LoadingSpinner {
  private container: HTMLElement;
  private spinnerElement: HTMLElement | null = null;
  private message: string;
  private size: "small" | "medium" | "large";
  private overlay: boolean;
  private isVisible: boolean = false;

  constructor(config: LoadingSpinnerConfig = {}) {
    this.container = config.container || document.body;
    this.message = config.message || "Loading...";
    this.size = config.size || "medium";
    this.overlay = config.overlay !== undefined ? config.overlay : true;
  }

  /**
   * Show the loading spinner
   */
  public show(message?: string): void {
    if (this.isVisible) return;

    if (message) {
      this.message = message;
    }

    this.createSpinner();
    this.isVisible = true;

    // Animate entrance
    setTimeout(() => {
      this.spinnerElement?.classList.add("visible");
    }, 10);
  }

  /**
   * Hide the loading spinner
   */
  public hide(): void {
    if (!this.isVisible || !this.spinnerElement) return;

    this.spinnerElement.classList.remove("visible");

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.spinnerElement) {
        this.spinnerElement.remove();
        this.spinnerElement = null;
      }
      this.isVisible = false;
    }, 300);
  }

  /**
   * Update the loading message
   */
  public updateMessage(message: string): void {
    this.message = message;
    if (this.spinnerElement) {
      const messageEl = this.spinnerElement.querySelector(".spinner-message");
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  }

  /**
   * Check if spinner is currently visible
   */
  public isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * Create the spinner element
   */
  private createSpinner(): void {
    // Create container
    this.spinnerElement = document.createElement("div");
    this.spinnerElement.className = `loading-spinner ${this.overlay ? "overlay" : "inline"} ${this.size}`;

    // Create spinner animation
    const spinner = document.createElement("div");
    spinner.className = "spinner-animation";

    // Create message
    const messageEl = document.createElement("div");
    messageEl.className = "spinner-message";
    messageEl.textContent = this.message;

    // Assemble
    this.spinnerElement.appendChild(spinner);
    this.spinnerElement.appendChild(messageEl);

    // Add styles
    this.injectStyles();

    // Add to container
    this.container.appendChild(this.spinnerElement);
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    const styleId = "loading-spinner-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .loading-spinner.visible {
        opacity: 1;
      }

      /* Overlay mode - full screen */
      .loading-spinner.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 10000;
      }

      /* Inline mode - relative positioning */
      .loading-spinner.inline {
        position: relative;
        padding: 40px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 12px;
      }

      /* Spinner animation */
      .spinner-animation {
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #ff6b00;
        animation: spin 1s linear infinite;
      }

      /* Size variants */
      .loading-spinner.small .spinner-animation {
        width: 32px;
        height: 32px;
        border-width: 2px;
      }

      .loading-spinner.medium .spinner-animation {
        width: 48px;
        height: 48px;
        border-width: 3px;
      }

      .loading-spinner.large .spinner-animation {
        width: 64px;
        height: 64px;
        border-width: 4px;
      }

      /* Message */
      .spinner-message {
        color: white;
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        max-width: 80%;
        line-height: 1.5;
      }

      .loading-spinner.small .spinner-message {
        font-size: 14px;
      }

      .loading-spinner.large .spinner-message {
        font-size: 18px;
      }

      /* Spin animation */
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .spinner-message {
          font-size: 14px;
          max-width: 90%;
        }

        .loading-spinner.inline {
          padding: 30px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * Global singleton instance for convenience
 */
let globalSpinner: LoadingSpinner | null = null;

export function showGlobalSpinner(message?: string): void {
  if (!globalSpinner) {
    globalSpinner = new LoadingSpinner({
      overlay: true,
      size: "medium"
    });
  }
  globalSpinner.show(message);
}

export function hideGlobalSpinner(): void {
  if (globalSpinner) {
    globalSpinner.hide();
  }
}

export function updateGlobalSpinnerMessage(message: string): void {
  if (globalSpinner) {
    globalSpinner.updateMessage(message);
  }
}
