/**
 * 优化的状态管理 Hooks
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

/**
 * 带防抖的状态 Hook
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300,
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const debouncedSetValue = useDebouncedCallback((newValue: T) => {
    setDebouncedValue(newValue);
  }, delay);

  const handleSetValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      debouncedSetValue(newValue);
    },
    [debouncedSetValue],
  );

  return [value, debouncedValue, handleSetValue];
}

/**
 * 带节流的状态 Hook
 */
export function useThrottledState<T>(
  initialValue: T,
  limit: number = 100,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const lastUpdate = useRef<number>(Date.now());

  const handleSetValue = useCallback(
    (newValue: T) => {
      const now = Date.now();
      if (now - lastUpdate.current >= limit) {
        setValue(newValue);
        lastUpdate.current = now;
      }
    },
    [limit],
  );

  return [value, handleSetValue];
}

/**
 * 批量状态更新 Hook
 */
export function useBatchedState<T extends Record<string, any>>(
  initialState: T,
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

  const scheduleUpdate = useCallback(() => {
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }

    updateTimer.current = setTimeout(() => {
      setState((prev) => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
      updateTimer.current = null;
    }, 16); // 一帧的时间
  }, []);

  const batchUpdate = useCallback(
    (updates: Partial<T>) => {
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const flushUpdates = useCallback(() => {
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
      updateTimer.current = null;
    }
    if (Object.keys(pendingUpdates.current).length > 0) {
      setState((prev) => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }
  }, []);

  useEffect(() => {
    return () => {
      if (updateTimer.current) {
        clearTimeout(updateTimer.current);
      }
    };
  }, []);

  return [state, batchUpdate, flushUpdates];
}

/**
 * 带缓存的计算 Hook
 */
export function useMemoizedComputation<T, R>(
  compute: (input: T) => R,
  input: T,
  cacheSize: number = 10,
): R {
  const cache = useRef<Map<string, R>>(new Map());

  const result = useCallback(() => {
    const key = JSON.stringify(input);

    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }

    const computed = compute(input);

    // 限制缓存大小
    if (cache.current.size >= cacheSize) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey !== undefined) {
        cache.current.delete(firstKey);
      }
    }

    cache.current.set(key, computed);
    return computed;
  }, [input, compute, cacheSize]);

  return result();
}
