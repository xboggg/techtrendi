import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

/**
 * Optimized image component with fade-in loading effect
 * Prevents flash of old cached images by hiding until fully loaded
 */
export function OptimizedImage({
  src,
  alt = '',
  className,
  fallbackIcon
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Check if image is already cached and loaded
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  if (!src || hasError) {
    return fallbackIcon ? <>{fallbackIcon}</> : null;
  }

  // Add cache buster for Unsplash URLs to force fresh load
  const imageSrc = src.includes('unsplash.com')
    ? `${src}&v=${Date.now()}`
    : src;

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
