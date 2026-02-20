/**
 * BootScreen Component Tests
 *
 * Tests for the boot screen shown while critical services initialize.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BootScreen } from '@/components/BootScreen';
import type { ServiceReadiness } from '@/hooks/useServiceReadiness';

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockServices(overrides: Partial<ServiceReadiness> = {}): ServiceReadiness {
  return {
    filesystem: { status: 'idle', retryCount: 0 },
    webcontainer: { status: 'idle', retryCount: 0 },
    git: { status: 'idle', retryCount: 0 },
    criticalReady: false,
    retry: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// RENDERING TESTS
// =============================================================================

describe('BootScreen - rendering', () => {
  it('should render the Browser IDE title', () => {
    const services = createMockServices();

    render(<BootScreen services={services} />);

    expect(screen.getByText('Browser IDE')).toBeInTheDocument();
  });

  it('should not render loading spinner when filesystem is idle', () => {
    const services = createMockServices({
      filesystem: { status: 'idle', retryCount: 0 },
    });

    render(<BootScreen services={services} />);

    expect(screen.queryByText('Initializing...')).not.toBeInTheDocument();
  });
});

// =============================================================================
// BOOTING STATE TESTS
// =============================================================================

describe('BootScreen - booting state', () => {
  it('should show loading spinner when filesystem is booting', () => {
    const services = createMockServices({
      filesystem: { status: 'booting', retryCount: 0 },
    });

    render(<BootScreen services={services} />);

    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('should show a spinning element during boot', () => {
    const services = createMockServices({
      filesystem: { status: 'booting', retryCount: 0 },
    });

    const { container } = render(<BootScreen services={services} />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// =============================================================================
// ERROR STATE TESTS
// =============================================================================

describe('BootScreen - error state', () => {
  it('should show error message when filesystem has an error', () => {
    const services = createMockServices({
      filesystem: { status: 'error', error: 'IndexedDB blocked', retryCount: 3 },
    });

    render(<BootScreen services={services} />);

    expect(screen.getByText(/Failed to initialize file system/)).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB blocked/)).toBeInTheDocument();
  });

  it('should show retry button when filesystem has an error', () => {
    const services = createMockServices({
      filesystem: { status: 'error', error: 'DB error', retryCount: 3 },
    });

    render(<BootScreen services={services} />);

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call retry with filesystem when retry button is clicked', () => {
    const mockRetry = vi.fn();
    const services = createMockServices({
      filesystem: { status: 'error', error: 'DB error', retryCount: 3 },
      retry: mockRetry,
    });

    render(<BootScreen services={services} />);

    fireEvent.click(screen.getByText('Retry'));

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledWith('filesystem');
  });

  it('should not show loading spinner during error state', () => {
    const services = createMockServices({
      filesystem: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<BootScreen services={services} />);

    expect(screen.queryByText('Initializing...')).not.toBeInTheDocument();
  });
});

// =============================================================================
// STATE EXCLUSIVITY TESTS
// =============================================================================

describe('BootScreen - state exclusivity', () => {
  it('should not show error UI when filesystem is booting', () => {
    const services = createMockServices({
      filesystem: { status: 'booting', retryCount: 0 },
    });

    render(<BootScreen services={services} />);

    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    expect(screen.queryByText(/Failed to initialize/)).not.toBeInTheDocument();
  });

  it('should not show loading UI when filesystem has error', () => {
    const services = createMockServices({
      filesystem: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<BootScreen services={services} />);

    expect(screen.queryByText('Initializing...')).not.toBeInTheDocument();
  });
});
