/**
 * 性能监控工具 - 用于测量和优化虚拟滚动性能
 */

interface PerformanceMetrics {
  renderTime: number;
  scrollTime: number;
  memoryUsage?: number;
  frameRate?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === "development";

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 测量组件渲染时间
   */
  measureRender<T>(componentName: string, renderFn: () => T): T {
    if (!this.isEnabled) return renderFn();

    const start = performance.now();
    const result = renderFn();
    const end = performance.now();

    this.recordMetric(componentName, "renderTime", end - start);

    if (end - start > 16) {
      // 超过一帧的时间
      console.warn(
        `[Performance] ${componentName} 渲染耗时: ${(end - start).toFixed(
          2,
        )}ms`,
      );
    }

    return result;
  }

  /**
   * 测量滚动性能
   */
  measureScroll(componentName: string): (scrollTop: number) => void {
    if (!this.isEnabled) return () => {};

    let lastScrollTime = performance.now();
    let frameCount = 0;
    let totalScrollTime = 0;

    return (scrollTop: number) => {
      const now = performance.now();
      const scrollTime = now - lastScrollTime;

      frameCount++;
      totalScrollTime += scrollTime;

      // 每100帧记录一次平均性能
      if (frameCount >= 100) {
        const avgScrollTime = totalScrollTime / frameCount;
        this.recordMetric(componentName, "scrollTime", avgScrollTime);

        if (avgScrollTime > 16) {
          console.warn(
            `[Performance] ${componentName} 平均滚动耗时: ${avgScrollTime.toFixed(
              2,
            )}ms`,
          );
        }

        frameCount = 0;
        totalScrollTime = 0;
      }

      lastScrollTime = now;
    };
  }

  /**
   * 测量内存使用情况
   */
  measureMemory(componentName: string): void {
    if (!this.isEnabled || !("memory" in performance)) return;

    const memory = (performance as any).memory;
    if (memory) {
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      this.recordMetric(componentName, "memoryUsage", memoryUsage);

      if (memoryUsage > 100) {
        // 超过100MB
        console.warn(
          `[Performance] ${componentName} 内存使用: ${memoryUsage.toFixed(
            2,
          )}MB`,
        );
      }
    }
  }

  /**
   * 测量帧率
   */
  measureFrameRate(
    componentName: string,
    duration: number = 5000,
  ): Promise<number> {
    if (!this.isEnabled) return Promise.resolve(60);

    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;

        if (elapsed < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = (frameCount / elapsed) * 1000;
          this.recordMetric(componentName, "frameRate", fps);

          if (fps < 30) {
            console.warn(
              `[Performance] ${componentName} 帧率过低: ${fps.toFixed(2)}fps`,
            );
          }

          resolve(fps);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  /**
   * 记录性能指标
   */
  private recordMetric(
    componentName: string,
    metricType: keyof PerformanceMetrics,
    value: number,
  ): void {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    const componentMetrics = this.metrics.get(componentName)!;
    const lastMetric = componentMetrics[componentMetrics.length - 1] || {};

    const newMetric = {
      ...lastMetric,
      [metricType]: value,
    };

    componentMetrics.push(newMetric);

    // 只保留最近100条记录
    if (componentMetrics.length > 100) {
      componentMetrics.shift();
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(componentName?: string): Record<string, any> {
    if (componentName) {
      const metrics = this.metrics.get(componentName) || [];
      return this.calculateStats(componentName, metrics);
    }

    const report: Record<string, any> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      report[name] = this.calculateStats(name, metrics);
    }

    return report;
  }

  /**
   * 计算统计信息
   */
  private calculateStats(
    componentName: string,
    metrics: PerformanceMetrics[],
  ): any {
    if (metrics.length === 0) return null;

    const stats: any = {
      componentName,
      sampleCount: metrics.length,
    };

    // 计算各项指标的统计信息
    const metricTypes: (keyof PerformanceMetrics)[] = [
      "renderTime",
      "scrollTime",
      "memoryUsage",
      "frameRate",
    ];

    for (const metricType of metricTypes) {
      const values = metrics
        .map((m) => m[metricType])
        .filter((v) => v !== undefined) as number[];

      if (values.length > 0) {
        values.sort((a, b) => a - b);

        stats[metricType] = {
          min: values[0],
          max: values[values.length - 1],
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          p50: values[Math.floor(values.length * 0.5)],
          p90: values[Math.floor(values.length * 0.9)],
          p95: values[Math.floor(values.length * 0.95)],
        };
      }
    }

    return stats;
  }

  /**
   * 清除性能数据
   */
  clearMetrics(componentName?: string): void {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 启用/禁用性能监控
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 导出性能数据
   */
  exportMetrics(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 便捷的装饰器函数
export function measurePerformance(componentName: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const method = descriptor.value!;

    descriptor.value = ((...args: any[]) => {
      return performanceMonitor.measureRender(
        `${componentName}.${propertyName}`,
        () => method.apply(target, args),
      );
    }) as T;

    return descriptor;
  };
}

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const measureRender = (renderFn: () => any) => {
    return performanceMonitor.measureRender(componentName, renderFn);
  };

  const measureScroll = () => {
    return performanceMonitor.measureScroll(componentName);
  };

  const measureMemory = () => {
    performanceMonitor.measureMemory(componentName);
  };

  const getReport = () => {
    return performanceMonitor.getPerformanceReport(componentName);
  };

  return {
    measureRender,
    measureScroll,
    measureMemory,
    getReport,
  };
}
