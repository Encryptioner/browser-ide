import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeDatabase } from '@/lib/database';
import { validateEnvironment } from '@/config/environment';
import { logger } from '@/utils/logger';
import { reportWebVitals } from '@/utils/web-vitals';
import { registerSW } from 'virtual:pwa-register';
import { Buffer } from 'buffer';
import { toast } from 'sonner';
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
      toast('New version available!', {
        action: {
          label: 'Reload to update',
          onClick: () => updateSW(true),
        },
      });
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
    logger.info('Initializing Browser IDE...');
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

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Report Core Web Vitals after render
reportWebVitals();
