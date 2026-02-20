import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fileSystem } from '@/services/filesystem';
import { logger } from '@/utils/logger';

export type ServiceStatus = 'idle' | 'booting' | 'ready' | 'error' | 'degraded';

export interface ServiceState {
  status: ServiceStatus;
  error?: string;
  retryCount: number;
}

export interface ServiceReadiness {
  /** FileSystem + DB (critical - blocks render) */
  filesystem: ServiceState;
  /** WebContainer (important - boots early, shows progress) */
  webcontainer: ServiceState;
  /** Git service (lazy - boots on demand) */
  git: ServiceState;
  /** Whether critical services are ready (app can render) */
  criticalReady: boolean;
  /** Retry a specific service */
  retry: (service: 'filesystem' | 'webcontainer' | 'git') => void;
}

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

function initialState(): ServiceState {
  return { status: 'idle', retryCount: 0 };
}

export function useServiceReadiness(): ServiceReadiness {
  const [filesystem, setFilesystem] = useState<ServiceState>(initialState);
  const [webcontainer, setWebcontainer] = useState<ServiceState>(initialState);
  const [git, setGit] = useState<ServiceState>(initialState);
  const mountedRef = useRef(true);

  const bootWithRetry = useCallback(async (
    name: string,
    bootFn: () => Promise<void>,
    setState: React.Dispatch<React.SetStateAction<ServiceState>>,
  ) => {
    setState(prev => ({ ...prev, status: 'booting' }));

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await bootFn();
        if (mountedRef.current) {
          setState({ status: 'ready', retryCount: attempt });
        }
        logger.info(`${name} service ready (attempt ${attempt + 1})`);
        return;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`${name} boot attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errorMsg}`);

        if (attempt < MAX_RETRIES - 1) {
          const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          if (mountedRef.current) {
            setState({ status: 'error', error: errorMsg, retryCount: attempt + 1 });
          }
          logger.error(`${name} service failed after ${MAX_RETRIES} attempts`);
        }
      }
    }
  }, []);

  // Boot critical: filesystem + DB
  useEffect(() => {
    mountedRef.current = true;

    bootWithRetry('Filesystem', async () => {
      // LightningFS initializes synchronously in the constructor,
      // but we verify it works by attempting a readdir
      const fs = fileSystem.getFS();
      await fs.promises.readdir('/');
    }, setFilesystem);

    return () => { mountedRef.current = false; };
  }, [bootWithRetry]);

  // Boot important: WebContainer (after filesystem is ready)
  useEffect(() => {
    if (filesystem.status !== 'ready') return;

    const bootWebContainer = async () => {
      const { webContainer } = await import('@/services/webcontainer');
      const result = await webContainer.boot();
      if (!result.success) {
        throw new Error(result.error || 'WebContainer boot failed');
      }
    };

    bootWithRetry('WebContainer', bootWebContainer, setWebcontainer).catch(() => {
      // WebContainer failure is non-critical - degrade gracefully
      if (mountedRef.current) {
        setWebcontainer(prev => ({ ...prev, status: 'degraded' }));
      }
    });
  }, [filesystem.status, bootWithRetry]);

  const retry = useCallback((service: 'filesystem' | 'webcontainer' | 'git') => {
    const setters = { filesystem: setFilesystem, webcontainer: setWebcontainer, git: setGit };
    const setter = setters[service];
    setter(initialState());

    if (service === 'filesystem') {
      bootWithRetry('Filesystem', async () => {
        const fs = fileSystem.getFS();
        await fs.promises.readdir('/');
      }, setter);
    } else if (service === 'webcontainer') {
      (async () => {
        const { webContainer } = await import('@/services/webcontainer');
        await bootWithRetry('WebContainer', async () => {
          const result = await webContainer.boot();
          if (!result.success) throw new Error(result.error || 'WebContainer boot failed');
        }, setter);
      })();
    } else if (service === 'git') {
      (async () => {
        const { gitService: gs } = await import('@/services/git');
        await bootWithRetry('Git', async () => {
          const currentDir = fileSystem.getCurrentWorkingDirectory();
          const fs = fileSystem.getFS();
          const gitDir = await fs.promises.stat(`${currentDir}/.git`).catch(() => null);
          if (!gitDir) return; // No git repo - that's OK
          const result = await gs.initializeRepository(currentDir);
          if (!result.success) throw new Error(result.error || 'Git init failed');
        }, setter);
      })();
    }
  }, [bootWithRetry]);

  return {
    filesystem,
    webcontainer,
    git,
    criticalReady: filesystem.status === 'ready',
    retry,
  };
}
