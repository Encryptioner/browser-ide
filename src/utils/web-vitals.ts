/**
 * Web Vitals Performance Monitoring
 *
 * Reports Core Web Vitals metrics (CLS, INP, LCP, TTFB).
 * If Sentry is available, metrics are forwarded there.
 * Otherwise they are logged via the centralized logger.
 */

import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';
import { logger } from '@/utils/logger';
import { isSentryEnabled, reportMessage } from '@/services/sentry';

function handleMetric(metric: Metric): void {
  const { name, value, rating, id, navigationType } = metric;

  if (isSentryEnabled()) {
    reportMessage(`Web Vital: ${name}`, 'info', {
      metricName: name,
      metricValue: value,
      metricRating: rating,
      metricId: id,
      navigationType,
    });
  } else {
    logger.info(
      `Web Vital: ${name} = ${value.toFixed(2)} (${rating})`,
      { name, value, rating, id, navigationType },
      'performance',
    );
  }
}

/**
 * Start reporting all Core Web Vitals.
 * Call once after the application has rendered.
 */
export function reportWebVitals(): void {
  onCLS(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}
