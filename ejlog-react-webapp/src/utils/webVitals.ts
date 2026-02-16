// ============================================================================
// EJLOG WMS - Web Vitals Monitoring
// Performance tracking con Core Web Vitals
// ============================================================================

import type { Metric } from 'web-vitals';

/**
 * Web Vitals thresholds (Google recommendations)
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP) - Loading performance
  LCP: {
    good: 2500, // ms
    needsImprovement: 4000, // ms
  },
  // First Input Delay (FID) - Interactivity
  FID: {
    good: 100, // ms
    needsImprovement: 300, // ms
  },
  // Cumulative Layout Shift (CLS) - Visual stability
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800, // ms
    needsImprovement: 3000, // ms
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800, // ms
    needsImprovement: 1800, // ms
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200, // ms
    needsImprovement: 500, // ms
  },
};

/**
 * Rating basato su threshold
 */
export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];

  if (!thresholds) {
    return 'good';
  }

  if (value <= thresholds.good) {
    return 'good';
  }

  if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  }

  return 'poor';
}

/**
 * Formato valore metrica per display
 */
export function formatMetricValue(metric: Metric): string {
  if (metric.name === 'CLS') {
    return metric.value.toFixed(3);
  }

  // FID, LCP, FCP, TTFB, INP in ms
  return `${Math.round(metric.value)}ms`;
}

/**
 * Callback handler per metriche
 */
export function onWebVitalsReport(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);
  const value = formatMetricValue(metric);

  console.log(
    `[Web Vitals] ${metric.name}:`,
    value,
    `(${rating})`,
    metric
  );

  // Invia a analytics service (es. Google Analytics)
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: rating,
      non_interaction: true,
    });
  }

  // Invia a custom analytics endpoint
  if (import.meta.env.PROD) {
    sendToAnalytics(metric, rating);
  }
}

/**
 * Invia metriche a endpoint analytics custom
 */
async function sendToAnalytics(metric: Metric, rating: string): Promise<void> {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });

  try {
    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body);
    } else {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send analytics:', error);
  }
}

/**
 * Report all Web Vitals metrics
 */
export async function reportWebVitals(onPerfEntry?: (metric: Metric) => void): Promise<void> {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    try {
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);

      // INP disponibile dalla versione 3.x di web-vitals
      if (onINP) {
        onINP(onPerfEntry);
      }
    } catch (error) {
      console.error('[Web Vitals] Failed to import web-vitals library:', error);
    }
  }
}

/**
 * Custom Performance Observer per metriche aggiuntive
 */
export class PerformanceMonitor {
  private static observers: PerformanceObserver[] = [];

  /**
   * Monitor Long Tasks (> 50ms)
   */
  static monitorLongTasks(callback: (entry: PerformanceEntry) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] Long Tasks not supported');
    }
  }

  /**
   * Monitor Resource Loading
   */
  static monitorResources(callback: (entry: PerformanceResourceTiming) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry as PerformanceResourceTiming);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] Resource timing not supported');
    }
  }

  /**
   * Monitor Navigation Timing
   */
  static getNavigationTiming(): PerformanceNavigationTiming | null {
    try {
      const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return navigation || null;
    } catch (e) {
      console.warn('[Performance] Navigation timing not supported');
      return null;
    }
  }

  /**
   * Monitor Paint Timing
   */
  static getPaintTiming(): { fcp: number; lcp: number } {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1];

      return {
        fcp: fcp?.startTime || 0,
        lcp: lcp?.startTime || 0,
      };
    } catch (e) {
      console.warn('[Performance] Paint timing not supported');
      return { fcp: 0, lcp: 0 };
    }
  }

  /**
   * Get Memory Info (Chrome only)
   */
  static getMemoryInfo(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    const memory = (performance as any).memory;

    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return null;
  }

  /**
   * Clear all observers
   */
  static disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Performance Budget Checker
 */
export class PerformanceBudget {
  private budgets = {
    totalPageSize: 1.5 * 1024 * 1024, // 1.5 MB
    jsSize: 500 * 1024, // 500 KB
    cssSize: 150 * 1024, // 150 KB
    imageSize: 800 * 1024, // 800 KB
    resourceCount: 100,
  };

  /**
   * Check if budget is exceeded
   */
  check(): {
    passed: boolean;
    violations: string[];
    stats: Record<string, number>;
  } {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;

      const name = resource.name.toLowerCase();

      if (name.endsWith('.js')) {
        jsSize += size;
      } else if (name.endsWith('.css')) {
        cssSize += size;
      } else if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        imageSize += size;
      }
    });

    const violations: string[] = [];

    if (totalSize > this.budgets.totalPageSize) {
      violations.push(
        `Total page size (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds budget (${(this.budgets.totalPageSize / 1024 / 1024).toFixed(2)} MB)`
      );
    }

    if (jsSize > this.budgets.jsSize) {
      violations.push(
        `JavaScript size (${(jsSize / 1024).toFixed(2)} KB) exceeds budget (${(this.budgets.jsSize / 1024).toFixed(2)} KB)`
      );
    }

    if (cssSize > this.budgets.cssSize) {
      violations.push(
        `CSS size (${(cssSize / 1024).toFixed(2)} KB) exceeds budget (${(this.budgets.cssSize / 1024).toFixed(2)} KB)`
      );
    }

    if (imageSize > this.budgets.imageSize) {
      violations.push(
        `Image size (${(imageSize / 1024).toFixed(2)} KB) exceeds budget (${(this.budgets.imageSize / 1024).toFixed(2)} KB)`
      );
    }

    if (resources.length > this.budgets.resourceCount) {
      violations.push(
        `Resource count (${resources.length}) exceeds budget (${this.budgets.resourceCount})`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
      stats: {
        totalSize,
        jsSize,
        cssSize,
        imageSize,
        resourceCount: resources.length,
      },
    };
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  if (import.meta.env.PROD) {
    // Report Core Web Vitals
    reportWebVitals(onWebVitalsReport);

    // Monitor Long Tasks
    PerformanceMonitor.monitorLongTasks((entry) => {
      if (entry.duration > 50) {
        console.warn('[Performance] Long Task detected:', entry.duration.toFixed(2), 'ms');
      }
    });

    // Check Performance Budget
    window.addEventListener('load', () => {
      setTimeout(() => {
        const budget = new PerformanceBudget();
        const result = budget.check();

        if (!result.passed) {
          console.warn('[Performance Budget] Violations detected:', result.violations);
        }

        console.log('[Performance Budget] Stats:', result.stats);
      }, 5000);
    });
  } else {
    console.log('[Web Vitals] Development mode - monitoring disabled');
  }
}

export default {
  reportWebVitals,
  onWebVitalsReport,
  getRating,
  formatMetricValue,
  PerformanceMonitor,
  PerformanceBudget,
  initWebVitals,
};
