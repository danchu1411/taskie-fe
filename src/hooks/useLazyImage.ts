import { useState, useCallback } from 'react';

interface UseLazyImageOptions {
  src: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
}

interface UseLazyImageReturn {
  imageSrc: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: boolean;
  ref: (node: HTMLElement | null) => void;
}

export function useLazyImage({
  src,
  fallback,
  threshold = 0.1,
  rootMargin = '50px'
}: UseLazyImageOptions): UseLazyImageReturn {
  const [imageSrc, setImageSrc] = useState<string | null>(fallback || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            setError(false);
            
            // Preload the image
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
              setIsLoaded(true);
            };
            img.onerror = () => {
              setError(true);
              setIsLoading(false);
              if (fallback) {
                setImageSrc(fallback);
              }
            };
            img.src = src;
            
            observer.unobserve(node);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [src, fallback, threshold, rootMargin]);

  return {
    imageSrc,
    isLoading,
    isLoaded,
    error,
    ref,
  };
}
