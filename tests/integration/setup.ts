/**
 * Integration Test Setup
 *
 * Polyfills IndexedDB using fake-indexeddb so that Dexie works
 * in the Node.js / happy-dom test environment.
 */
import 'fake-indexeddb/auto';
