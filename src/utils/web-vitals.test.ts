import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock web-vitals before importing the module under test
const mockOnCLS = vi.fn();
const mockOnINP = vi.fn();
const mockOnLCP = vi.fn();
const mockOnTTFB = vi.fn();

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onINP: mockOnINP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
}));

const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
}));

const mockIsSentryEnabled = vi.fn();
const mockReportMessage = vi.fn();

vi.mock('@/services/sentry', () => ({
  isSentryEnabled: mockIsSentryEnabled,
  reportMessage: mockReportMessage,
}));

describe('web-vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSentryEnabled.mockReturnValue(false);
  });

  it('registers all Core Web Vitals callbacks', async () => {
    const { reportWebVitals } = await import('@/utils/web-vitals');

    reportWebVitals();

    expect(mockOnCLS).toHaveBeenCalledOnce();
    expect(mockOnINP).toHaveBeenCalledOnce();
    expect(mockOnLCP).toHaveBeenCalledOnce();
    expect(mockOnTTFB).toHaveBeenCalledOnce();
  });

  it('logs metric via logger when Sentry is not available', async () => {
    const { reportWebVitals } = await import('@/utils/web-vitals');

    reportWebVitals();

    // Grab the callback that was passed to onLCP
    const lcpCallback = mockOnLCP.mock.calls[0][0];

    const fakeMetric = {
      name: 'LCP',
      value: 1234.56,
      rating: 'good',
      id: 'v1-1234',
      navigationType: 'navigate',
    };

    lcpCallback(fakeMetric);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Web Vital: LCP = 1234.56 (good)',
      {
        name: 'LCP',
        value: 1234.56,
        rating: 'good',
        id: 'v1-1234',
        navigationType: 'navigate',
      },
      'performance',
    );
  });

  it('reports metric to Sentry when Sentry is enabled', async () => {
    mockIsSentryEnabled.mockReturnValue(true);

    const { reportWebVitals } = await import('@/utils/web-vitals');

    reportWebVitals();

    const clsCallback = mockOnCLS.mock.calls[0][0];

    const fakeMetric = {
      name: 'CLS',
      value: 0.05,
      rating: 'good',
      id: 'v1-5678',
      navigationType: 'navigate',
    };

    clsCallback(fakeMetric);

    expect(mockReportMessage).toHaveBeenCalledWith('Web Vital: CLS', 'info', {
      metricName: 'CLS',
      metricValue: 0.05,
      metricRating: 'good',
      metricId: 'v1-5678',
      navigationType: 'navigate',
    });

    // Logger should NOT be called when Sentry handles it
    expect(mockLogger.info).not.toHaveBeenCalled();
  });
});
