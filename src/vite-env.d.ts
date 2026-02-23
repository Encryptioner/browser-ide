/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_WEBCONTAINER: string;
  readonly VITE_FEATURE_AI: string;
  readonly VITE_FEATURE_GIT_REMOTE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Buffer: typeof import('buffer').Buffer;
}
