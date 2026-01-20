/**
 * Performance Utilities
 * Helpers for optimizing app performance
 */

/**
 * Debounce function for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for scroll handlers, etc.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measure component render time
 */
export function measurePerformance(componentName: string): {
  start: () => void;
  end: () => void;
} {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16.67) { // More than 1 frame at 60fps
        console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    },
  };
}

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(path: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.allSettled(srcs.map(preloadImage));
}

/**
 * Check if device is low-end
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check hardware concurrency (number of CPU cores)
  const cores = navigator.hardwareConcurrency || 1;
  
  // Check device memory (if available)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  
  // Check connection type
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';

  return cores < 4 || memory < 4 || isSlowConnection;
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  return window.setTimeout(callback, options?.timeout || 1);
}

/**
 * Cancel idle callback polyfill
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

/**
 * Intersection Observer for lazy loading
 */
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
}

/**
 * Web Vitals reporter (simplified)
 */
export function reportWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Report LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('[Web Vitals] LCP:', lastEntry.startTime.toFixed(0), 'ms');
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

  // Report FID (via first input)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: PerformanceEntry) => {
      const fidEntry = entry as PerformanceEventTiming;
      if ('processingStart' in fidEntry) {
        console.log('[Web Vitals] FID:', (fidEntry.processingStart - fidEntry.startTime).toFixed(0), 'ms');
      }
    });
  });
  fidObserver.observe({ type: 'first-input', buffered: true });

  // Report CLS
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!layoutShift.hadRecentInput && layoutShift.value) {
        clsValue += layoutShift.value;
      }
    }
    console.log('[Web Vitals] CLS:', clsValue.toFixed(3));
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });
}
