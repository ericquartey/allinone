// ============================================================================
// EJLOG WMS - Web Vitals Performance Monitoring
// Tracks Core Web Vitals metrics for performance optimization
// ============================================================================

import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

// Performance thresholds (based on Google's recommendations)
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';

interface PerformanceReport {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
}

/**
 * Determines the performance rating based on metric value and thresholds
 */
function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Formats the metric for logging
 */
function formatMetric(metric: Metric): PerformanceReport {
  const name = metric.name as MetricName;
  return {
    name,
    value: metric.value,
    rating: getRating(name, metric.value),
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
  };
}

/**
 * Logs performance metrics to console (development mode)
 */
function logToConsole(report: PerformanceReport) {
  const emoji = report.rating === 'good' ? '✅' : report.rating === 'needs-improvement' ? '⚠️' : '❌';
  const color = report.rating === 'good' ? 'green' : report.rating === 'needs-improvement' ? 'orange' : 'red';

  console.groupCollapsed(
    `%c${emoji} ${report.name}: ${report.value.toFixed(2)}ms - ${report.rating}`,
    `color: ${color}; font-weight: bold;`
  );
  console.log('Value:', report.value);
  console.log('Delta:', report.delta);
  console.log('Rating:', report.rating);
  console.log('Timestamp:', new Date(report.timestamp).toISOString());
  console.groupEnd();
}

/**
 * Sends performance metrics to analytics (production mode)
 */
function sendToAnalytics(report: PerformanceReport) {
  // In production, send to your analytics service
  // Example: Google Analytics, Sentry, DataDog, etc.

  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Google Analytics 4 example
    (window as any).gtag('event', report.name, {
      event_category: 'Web Vitals',
      value: Math.round(report.value),
      event_label: report.id,
      non_interaction: true,
      metric_rating: report.rating,
    });
  }

  // You can also send to custom endpoint
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(console.error);
  }
}

/**
 * Main function to report Web Vitals
 * Call this function in your app's entry point
 */
export function reportWebVitals(onPerfEntry?: (metric: PerformanceReport) => void) {
  const handleMetric = (metric: Metric) => {
    const report = formatMetric(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logToConsole(report);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      sendToAnalytics(report);
    }

    // Call custom callback if provided
    if (onPerfEntry && typeof onPerfEntry === 'function') {
      onPerfEntry(report);
    }

    // Store in localStorage for debugging
    if (process.env.NODE_ENV === 'development') {
      const metrics = JSON.parse(localStorage.getItem('webVitals') || '[]');
      metrics.push(report);
      // Keep only last 50 metrics
      if (metrics.length > 50) metrics.shift();
      localStorage.setItem('webVitals', JSON.stringify(metrics));
    }
  };

  // Register all Web Vitals metrics
  onCLS(handleMetric);
  onFID(handleMetric);
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

/**
 * Get stored metrics from localStorage (development only)
 */
export function getStoredMetrics(): PerformanceReport[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('webVitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored metrics from localStorage
 */
export function clearStoredMetrics(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('webVitals');
  }
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  metrics: PerformanceReport[];
  summary: {
    good: number;
    needsImprovement: number;
    poor: number;
    total: number;
  };
} {
  const metrics = getStoredMetrics();
  const summary = metrics.reduce(
    (acc, metric) => {
      acc.total++;
      if (metric.rating === 'good') acc.good++;
      else if (metric.rating === 'needs-improvement') acc.needsImprovement++;
      else acc.poor++;
      return acc;
    },
    { good: 0, needsImprovement: 0, poor: 0, total: 0 }
  );

  return { metrics, summary };
}

export default reportWebVitals;
