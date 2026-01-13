/**
 * 性能优化工具集
 */
import React from "react";
import { logger } from "./logger";

// 防抖 Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流 Hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// 虚拟滚动 Hook
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight),
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// 懒加载图片 Hook
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.01 },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  React.useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => setIsLoading(false);
  }, [imageSrc]);

  return { imgRef, imageSrc, isLoading };
}

// 性能监控
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  logger.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
}

// 请求去重 Hook
export function useRequestDedup<T>(
  fetcher: () => Promise<T>,
  key: string,
  ttl: number = 60000,
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const cacheRef = React.useRef<Map<string, { data: T; timestamp: number }>>(
    new Map(),
  );

  const fetch = React.useCallback(async () => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetcher, key, ttl]);

  return { data, loading, error, fetch };
}

// 批量请求合并
export class RequestBatcher<T, R> {
  private queue: Array<{
    key: T;
    resolve: (value: R) => void;
    reject: (error: any) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private batchFn: (keys: T[]) => Promise<R[]>;
  private delay: number;

  constructor(batchFn: (keys: T[]) => Promise<R[]>, delay: number = 10) {
    this.batchFn = batchFn;
    this.delay = delay;
  }

  load(key: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.delay);
      }
    });
  }

  private async flush() {
    const queue = this.queue;
    this.queue = [];
    this.timer = null;

    if (queue.length === 0) return;

    try {
      const keys = queue.map((item) => item.key);
      const results = await this.batchFn(keys);

      queue.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      queue.forEach((item) => {
        item.reject(error);
      });
    }
  }
}

// 空闲时执行任务
export function scheduleIdleTask(task: () => void, timeout: number = 1000) {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(task, { timeout });
  } else {
    setTimeout(task, 1);
  }
}

// 组件懒加载包装器
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  const LazyComponent = React.lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;

  const preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
    return factoryPromise;
  };

  return Object.assign(LazyComponent, { preload });
}
