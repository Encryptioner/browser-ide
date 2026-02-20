/**
 * ServiceBanner Component Tests
 *
 * Tests for the dismissible banner shown when non-critical services fail.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ServiceBanner } from '@/components/ServiceBanner';
import type { ServiceReadiness } from '@/hooks/useServiceReadiness';

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockServices(overrides: Partial<ServiceReadiness> = {}): ServiceReadiness {
  return {
    filesystem: { status: 'ready', retryCount: 0 },
    webcontainer: { status: 'ready', retryCount: 0 },
    git: { status: 'idle', retryCount: 0 },
    criticalReady: true,
    retry: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// RENDERING - NO BANNERS
// =============================================================================

describe('ServiceBanner - no banners', () => {
  it('should render nothing when all services are ready', () => {
    const services = createMockServices();

    const { container } = render(<ServiceBanner services={services} />);

    expect(container.innerHTML).toBe('');
  });

  it('should render nothing when services are idle', () => {
    const services = createMockServices({
      webcontainer: { status: 'idle', retryCount: 0 },
      git: { status: 'idle', retryCount: 0 },
    });

    const { container } = render(<ServiceBanner services={services} />);

    expect(container.innerHTML).toBe('');
  });

  it('should render nothing when webcontainer is booting', () => {
    const services = createMockServices({
      webcontainer: { status: 'booting', retryCount: 0 },
    });

    const { container } = render(<ServiceBanner services={services} />);

    expect(container.innerHTML).toBe('');
  });
});

// =============================================================================
// WEBCONTAINER BANNER
// =============================================================================

describe('ServiceBanner - webcontainer', () => {
  it('should show banner when webcontainer has error status', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'Not supported', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/WebContainer unavailable/)).toBeInTheDocument();
  });

  it('should show banner when webcontainer has degraded status', () => {
    const services = createMockServices({
      webcontainer: { status: 'degraded', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/WebContainer unavailable/)).toBeInTheDocument();
  });

  it('should mention browser requirements in webcontainer banner', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/Chrome, Edge, or Brave/)).toBeInTheDocument();
  });

  it('should show retry button for webcontainer failure', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call retry with webcontainer when retry button is clicked', () => {
    const mockRetry = vi.fn();
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
      retry: mockRetry,
    });

    render(<ServiceBanner services={services} />);

    fireEvent.click(screen.getByText('Retry'));

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledWith('webcontainer');
  });
});

// =============================================================================
// GIT BANNER
// =============================================================================

describe('ServiceBanner - git', () => {
  it('should show banner when git has error status', () => {
    const services = createMockServices({
      git: { status: 'error', error: 'Git init failed', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/Git service failed/)).toBeInTheDocument();
    expect(screen.getByText(/Git init failed/)).toBeInTheDocument();
  });

  it('should not show git banner when git status is degraded', () => {
    const services = createMockServices({
      git: { status: 'degraded', retryCount: 1 },
    });

    const { container } = render(<ServiceBanner services={services} />);

    expect(container.innerHTML).toBe('');
  });

  it('should call retry with git when retry button is clicked', () => {
    const mockRetry = vi.fn();
    const services = createMockServices({
      git: { status: 'error', error: 'fail', retryCount: 3 },
      retry: mockRetry,
    });

    render(<ServiceBanner services={services} />);

    fireEvent.click(screen.getByText('Retry'));

    expect(mockRetry).toHaveBeenCalledWith('git');
  });
});

// =============================================================================
// MULTIPLE BANNERS
// =============================================================================

describe('ServiceBanner - multiple banners', () => {
  it('should show both banners when webcontainer and git fail', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
      git: { status: 'error', error: 'Git init failed', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/WebContainer unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Git service failed/)).toBeInTheDocument();
  });

  it('should show two retry buttons when both services fail', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
      git: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    const retryButtons = screen.getAllByText('Retry');
    expect(retryButtons).toHaveLength(2);
  });
});

// =============================================================================
// DISMISS FUNCTIONALITY
// =============================================================================

describe('ServiceBanner - dismiss', () => {
  it('should show dismiss button on each banner', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText('x')).toBeInTheDocument();
  });

  it('should hide webcontainer banner after dismiss is clicked', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/WebContainer unavailable/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('x'));

    expect(screen.queryByText(/WebContainer unavailable/)).not.toBeInTheDocument();
  });

  it('should hide git banner after dismiss is clicked', () => {
    const services = createMockServices({
      git: { status: 'error', error: 'Git init failed', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    expect(screen.getByText(/Git service failed/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('x'));

    expect(screen.queryByText(/Git service failed/)).not.toBeInTheDocument();
  });

  it('should only dismiss the clicked banner when multiple banners are shown', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
      git: { status: 'error', error: 'Git fail', retryCount: 3 },
    });

    render(<ServiceBanner services={services} />);

    // Dismiss the first banner (webcontainer comes first in the list)
    const dismissButtons = screen.getAllByText('x');
    fireEvent.click(dismissButtons[0]);

    // Webcontainer banner should be gone
    expect(screen.queryByText(/WebContainer unavailable/)).not.toBeInTheDocument();

    // Git banner should remain
    expect(screen.getByText(/Git service failed/)).toBeInTheDocument();
  });

  it('should render nothing after all banners are dismissed', () => {
    const services = createMockServices({
      webcontainer: { status: 'error', error: 'fail', retryCount: 3 },
    });

    const { container } = render(<ServiceBanner services={services} />);

    fireEvent.click(screen.getByText('x'));

    expect(container.innerHTML).toBe('');
  });
});
