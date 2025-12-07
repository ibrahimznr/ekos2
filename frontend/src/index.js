import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Comprehensive ResizeObserver error suppression
// This is a known issue with React 18 + Radix UI (Shadcn)
const suppressResizeObserverErrors = () => {
  // Suppress window errors
  const errorHandler = (event) => {
    if (
      event.message?.includes('ResizeObserver loop') ||
      event.message?.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  };

  window.addEventListener('error', errorHandler, true);

  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('ResizeObserver loop') ||
      event.reason?.toString().includes('ResizeObserver loop')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  // Patch ResizeObserver to use requestAnimationFrame
  if (typeof ResizeObserver !== 'undefined') {
    const OriginalResizeObserver = window.ResizeObserver;
    
    window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
      constructor(callback) {
        super((entries, observer) => {
          // Use requestAnimationFrame to defer callback execution
          window.requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (error) {
              // Silently catch ResizeObserver errors
              if (!error?.message?.includes('ResizeObserver loop')) {
                console.error('ResizeObserver error:', error);
              }
            }
          });
        });
      }
    };
  }
};

// Apply suppression immediately
suppressResizeObserverErrors();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
