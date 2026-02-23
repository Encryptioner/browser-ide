/**
 * useServiceReadiness Hook Tests
 *
 * Tests for the progressive boot hook with retry logic.
 *
 * The hook uses exponential backoff (1s, 2s) between retry attempts.
 * For tests involving retries, we use longer waitFor timeouts to
 * accommodate the real backoff delays.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockReaddir = vi.fn();
const mockStat = vi.fn();
const mockGetFS = vi.fn(() => ({
  promises: {
    readdir: mockReaddir,
    stat: mockStat,
  },
}));
const mockGetCurrentWorkingDirectory = vi.fn(() => '/');

vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    getFS: mockGetFS,
    getCurrentWorkingDirectory: mockGetCurrentWorkingDirectory,
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockWebContainerBoot = vi.fn();

vi.mock('@/services/webcontainer', () => ({
  webContainer: {
    boot: mockWebContainerBoot,
  },
}));

vi.mock('@/services/git', () => ({
  gitService: {
    initializeRepository: vi.fn(),
  },
}));

const { useServiceReadiness } = await import('@/hooks/useServiceReadiness');

// =============================================================================
// SETUP
// =============================================================================

// Timeout for waitFor calls that need to wait through backoff delays
// MAX_RETRIES=3, backoff = 1s + 2s = 3s between attempts, plus buffer
const RETRY_TIMEOUT = { timeout: 5000 };
const FAST_TIMEOUT = { timeout: 2000 };

beforeEach(() => {
  mockReaddir.mockReset();
  mockStat.mockReset();
  mockGetFS.mockClear();
  mockGetCurrentWorkingDirectory.mockReturnValue('/');
  mockWebContainerBoot.mockReset();

  // Default: filesystem boots successfully, webcontainer boots successfully
  mockReaddir.mockResolvedValue([]);
  mockWebContainerBoot.mockResolvedValue({ success: true });
});

// =============================================================================
// INITIAL STATE TESTS
// =============================================================================

describe('useServiceReadiness - initial state', () => {
  it('should start with filesystem in booting status', () => {
    const { result } = renderHook(() => useServiceReadiness());

    expect(result.current.filesystem.status).toBe('booting');
  });

  it('should start with webcontainer in idle status', () => {
    const { result } = renderHook(() => useServiceReadiness());

    expect(result.current.webcontainer.status).toBe('idle');
  });

  it('should start with git in idle status', () => {
    const { result } = renderHook(() => useServiceReadiness());

    expect(result.current.git.status).toBe('idle');
  });

  it('should start with criticalReady as false', () => {
    const { result } = renderHook(() => useServiceReadiness());

    expect(result.current.criticalReady).toBe(false);
  });

  it('should expose a retry function', () => {
    const { result } = renderHook(() => useServiceReadiness());

    expect(typeof result.current.retry).toBe('function');
  });
});

// =============================================================================
// FILESYSTEM BOOT TESTS
// =============================================================================

describe('useServiceReadiness - filesystem boot', () => {
  it('should set filesystem to ready after successful boot', async () => {
    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('ready');
    }, FAST_TIMEOUT);
  });

  it('should set criticalReady to true when filesystem is ready', async () => {
    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.criticalReady).toBe(true);
    }, FAST_TIMEOUT);
  });

  it('should set retryCount to 0 on first-attempt success', async () => {
    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('ready');
      expect(result.current.filesystem.retryCount).toBe(0);
    }, FAST_TIMEOUT);
  });

  it('should set filesystem to error after all retries fail', async () => {
    mockReaddir.mockRejectedValue(new Error('FS init failed'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('error');
    }, RETRY_TIMEOUT);
  });

  it('should include error message on filesystem failure', async () => {
    mockReaddir.mockRejectedValue(new Error('IndexedDB unavailable'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.error).toBe('IndexedDB unavailable');
    }, RETRY_TIMEOUT);
  });

  it('should set retryCount to 3 after max retries exceeded', async () => {
    mockReaddir.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.retryCount).toBe(3);
    }, RETRY_TIMEOUT);
  });

  it('should succeed on second attempt after first failure', async () => {
    mockReaddir
      .mockRejectedValueOnce(new Error('temporary error'))
      .mockResolvedValue([]);

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('ready');
      expect(result.current.filesystem.retryCount).toBe(1);
    }, RETRY_TIMEOUT);
  });

  it('should convert non-Error objects to string for error message', async () => {
    mockReaddir.mockRejectedValue('string error');

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('error');
      expect(result.current.filesystem.error).toBe('string error');
    }, RETRY_TIMEOUT);
  });
});

// =============================================================================
// WEBCONTAINER BOOT TESTS
// =============================================================================

describe('useServiceReadiness - webcontainer boot', () => {
  it('should boot webcontainer after filesystem is ready', async () => {
    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.webcontainer.status).toBe('ready');
    }, FAST_TIMEOUT);
  });

  it('should not boot webcontainer if filesystem is not ready', async () => {
    mockReaddir.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('error');
    }, RETRY_TIMEOUT);

    expect(result.current.webcontainer.status).toBe('idle');
  });

  it('should handle webcontainer boot failure gracefully', async () => {
    mockWebContainerBoot.mockResolvedValue({ success: false, error: 'Not supported' });

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      const status = result.current.webcontainer.status;
      expect(status === 'degraded' || status === 'error').toBe(true);
    }, RETRY_TIMEOUT);
  });
});

// =============================================================================
// RETRY TESTS
// =============================================================================

describe('useServiceReadiness - retry', () => {
  it('should retry filesystem and succeed after previous failure', async () => {
    mockReaddir.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('error');
    }, RETRY_TIMEOUT);

    // Fix the mock and retry
    mockReaddir.mockResolvedValue([]);

    act(() => {
      result.current.retry('filesystem');
    });

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('ready');
    }, FAST_TIMEOUT);
  });

  it('should retry webcontainer service', async () => {
    mockWebContainerBoot.mockResolvedValue({ success: false, error: 'fail' });

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      const status = result.current.webcontainer.status;
      expect(status === 'degraded' || status === 'error').toBe(true);
    }, RETRY_TIMEOUT);

    // Fix the mock and retry
    mockWebContainerBoot.mockResolvedValue({ success: true });

    act(() => {
      result.current.retry('webcontainer');
    });

    await waitFor(() => {
      expect(result.current.webcontainer.status).toBe('ready');
    }, FAST_TIMEOUT);
  });
});

// =============================================================================
// CRITICALREADY DERIVATION
// =============================================================================

describe('useServiceReadiness - criticalReady', () => {
  it('should be true when filesystem status is ready', async () => {
    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.criticalReady).toBe(true);
    }, FAST_TIMEOUT);
  });

  it('should be false when filesystem is in error state', async () => {
    mockReaddir.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('error');
    }, RETRY_TIMEOUT);

    expect(result.current.criticalReady).toBe(false);
  });

  it('should be independent of webcontainer status', async () => {
    mockWebContainerBoot.mockResolvedValue({ success: false, error: 'fail' });

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => {
      expect(result.current.filesystem.status).toBe('ready');
    }, FAST_TIMEOUT);

    expect(result.current.criticalReady).toBe(true);
  });
});
