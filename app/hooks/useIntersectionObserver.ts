/**
 * Intersection Observer Hook - 用于懒加载和无限滚动
 */
import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): [React.RefObject<HTMLDivElement>, boolean] {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0px",
    freezeOnceVisible = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const frozen = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // 如果已经可见且设置了 freezeOnceVisible，不再观察
    if (frozen.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && freezeOnceVisible) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return [targetRef, isIntersecting];
}

/**
 * 无限滚动 Hook
 */
export function useInfiniteScroll(
  callback: () => void,
  options: UseIntersectionObserverOptions = {},
) {
  const [sentinelRef, isIntersecting] = useIntersectionObserver({
    ...options,
    freezeOnceVisible: false,
  });

  useEffect(() => {
    if (isIntersecting) {
      callback();
    }
  }, [isIntersecting, callback]);

  return sentinelRef;
}
