import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeDatabase } from '@/lib/database';
import { validateEnvironment } from '@/config/environment';
import { logger } from '@/utils/logger';
import { registerSW } from 'virtual:pwa-register';
import { Buffer } from 'buffer';
import './index.css';

// Polyfill Buffer for isomorphic-git
window.Buffer = Buffer;

// Validate environment configuration
try {
  validateEnvironment();
  logger.info('Environment validated successfully');
} catch (error) {
  logger.error('Environment validation failed', error);
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      logger.info('New version available');
      if (confirm('New version available! Reload to update?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      logger.info('App ready to work offline');
    },
    onRegistered() {
      logger.info('Service Worker registered');
    },
    onRegisterError(error) {
      logger.error('Service Worker registration failed', error);
    },
  });
}

// Initialize database
async function initializeApp() {
  try {
    logger.info('Initializing Browser IDE Pro...');
    await initializeDatabase();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', error);
  }
}

initializeApp();

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
  event.preventDefault();
});

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData && 'loadEventEnd' in perfData) {
      const loadTime = (perfData as PerformanceNavigationTiming).loadEventEnd -
                       (perfData as PerformanceNavigationTiming).fetchStart;
      logger.debug(`Page load time: ${loadTime.toFixed(2)}ms`);
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
