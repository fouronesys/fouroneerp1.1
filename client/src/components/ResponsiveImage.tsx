import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  breakpoints?: { [size: number]: { webp?: string; png?: string; jpg?: string } };
  sizes?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  width,
  height,
  breakpoints,
  sizes = '100vw',
  loading = 'lazy',
  objectFit = 'cover',
  fallback,
  onLoad,
  onError
}: ResponsiveImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Generate srcSet for different formats and breakpoints
  const generateSrcSet = (format: 'webp' | 'png' | 'jpg') => {
    if (!breakpoints) return '';
    
    return Object.entries(breakpoints)
      .filter(([, formats]) => formats[format])
      .map(([size, formats]) => `${formats[format]} ${size}w`)
      .join(', ');
  };

  // Use fallback image if main image fails and fallback is provided
  const displaySrc = imageError && fallback ? fallback : src;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{ 
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto'
          }}
        />
      )}

      {/* Progressive enhancement: try WebP first, fallback to PNG/JPG */}
      <picture>
        {/* WebP sources for different breakpoints */}
        {breakpoints && generateSrcSet('webp') && (
          <source
            srcSet={generateSrcSet('webp')}
            sizes={sizes}
            type="image/webp"
          />
        )}

        {/* PNG sources for different breakpoints */}
        {breakpoints && generateSrcSet('png') && (
          <source
            srcSet={generateSrcSet('png')}
            sizes={sizes}
            type="image/png"
          />
        )}

        {/* JPG sources for different breakpoints */}
        {breakpoints && generateSrcSet('jpg') && (
          <source
            srcSet={generateSrcSet('jpg')}
            sizes={sizes}
            type="image/jpeg"
          />
        )}

        {/* Fallback img element */}
        <img
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto'
          }}
        />
      </picture>

      {/* Error state */}
      {imageError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Error loading image</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for generating responsive image configurations
export function useResponsiveImage(baseName: string, assetManifest?: any) {
  const generateResponsiveConfig = (breakpoints: number[] = [320, 480, 768, 1024, 1200, 1920]) => {
    const config: { [size: number]: { webp?: string; png?: string; jpg?: string } } = {};
    
    breakpoints.forEach(breakpoint => {
      config[breakpoint] = {
        webp: `/assets/${baseName}-${breakpoint}w.webp`,
        png: `/assets/${baseName}-${breakpoint}w.png`,
        jpg: `/assets/${baseName}-${breakpoint}w.jpg`
      };
    });

    return config;
  };

  const generateSizes = (customSizes?: string) => {
    if (customSizes) return customSizes;
    
    return [
      '(max-width: 320px) 320px',
      '(max-width: 480px) 480px', 
      '(max-width: 768px) 768px',
      '(max-width: 1024px) 1024px',
      '(max-width: 1200px) 1200px',
      '1920px'
    ].join(', ');
  };

  return {
    generateResponsiveConfig,
    generateSizes
  };
}

// Utility component for common responsive image patterns
export function ResponsiveHeroImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { generateResponsiveConfig, generateSizes } = useResponsiveImage(src.split('/').pop()?.split('.')[0] || 'image');
  
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={className}
      breakpoints={generateResponsiveConfig()}
      sizes={generateSizes()}
      objectFit="cover"
      loading="eager"
    />
  );
}

export function ResponsiveProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { generateResponsiveConfig, generateSizes } = useResponsiveImage(src.split('/').pop()?.split('.')[0] || 'product');
  
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={className}
      breakpoints={generateResponsiveConfig([256, 512, 768, 1024])}
      sizes="(max-width: 768px) 256px, (max-width: 1024px) 512px, 768px"
      objectFit="contain"
      loading="lazy"
    />
  );
}

export function ResponsiveThumbnail({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { generateResponsiveConfig } = useResponsiveImage(src.split('/').pop()?.split('.')[0] || 'thumb');
  
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={className}
      breakpoints={generateResponsiveConfig([64, 128, 256])}
      sizes="(max-width: 768px) 64px, 128px"
      objectFit="cover"
      loading="lazy"
    />
  );
}