/**
 * Image optimization utilities for next-gen format conversion
 * Provides client-side and server-side image optimization
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
}

/**
 * Check if browser supports AVIF format
 */
export function supportsAvif(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('image/avif') === 0;
}

/**
 * Convert image to WebP format using Canvas API (client-side)
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to WebP
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image if it exceeds maximum dimensions
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.9
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => resolve(blob),
          file.type,
          quality
        );
      };
      
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  basePath: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map(width => {
      const path = basePath.replace(/(\.[^.]+)$/, `_${width}w$1`);
      return `${path} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: { maxWidth?: number; size: string }[]
): string {
  return breakpoints
    .map(({ maxWidth, size }) => {
      if (maxWidth) {
        return `(max-width: ${maxWidth}px) ${size}`;
      }
      return size;
    })
    .join(', ');
}

/**
 * Optimize image for upload
 * Converts to WebP and resizes if necessary
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<{ original: File; webp?: Blob; resized?: Blob }> {
  const {
    quality = 0.85,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'auto'
  } = options;
  
  const result: { original: File; webp?: Blob; resized?: Blob } = {
    original: file
  };
  
  // Check if resizing is needed
  if (file.type.startsWith('image/') && (maxWidth || maxHeight)) {
    const resized = await resizeImage(file, maxWidth, maxHeight, quality);
    if (resized) {
      result.resized = resized;
    }
  }
  
  // Convert to WebP if supported and not already WebP
  if (
    file.type !== 'image/webp' &&
    file.type.startsWith('image/') &&
    (format === 'webp' || (format === 'auto' && supportsWebP()))
  ) {
    const webp = await convertToWebP(
      result.resized ? new File([result.resized], file.name) : file,
      quality
    );
    if (webp) {
      result.webp = webp;
    }
  }
  
  return result;
}

/**
 * Get optimized image URL with format detection
 */
export function getOptimizedImageUrl(
  basePath: string,
  supportsWebP: boolean = false,
  supportsAvif: boolean = false
): string {
  // Don't optimize SVGs or data URLs
  if (basePath.includes('.svg') || basePath.startsWith('data:')) {
    return basePath;
  }
  
  // Try next-gen formats
  if (supportsAvif && !basePath.includes('.gif')) {
    return basePath.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }
  
  if (supportsWebP) {
    return basePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  return basePath;
}

/**
 * Preload critical images
 */
export function preloadImage(
  url: string,
  options: {
    as?: 'image';
    type?: string;
    media?: string;
  } = {}
): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = options.as || 'image';
  
  if (options.type) {
    link.type = options.type;
  }
  
  if (options.media) {
    link.media = options.media;
  }
  
  document.head.appendChild(link);
}