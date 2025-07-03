/**
 * Logo utility functions for adaptive resizing based on usage context
 */

export interface LogoSizeConfig {
  maxSize: number;
  quality: number;
  format: 'png' | 'jpeg';
}

export const LOGO_CONFIGS = {
  // For 58mm thermal printers (small receipts) - adaptive from source
  thermal58mm: {
    maxSize: 128,
    quality: 0.9,
    format: 'png' as const
  },
  
  // For 80mm thermal printers (standard receipts) - adaptive from source
  thermal80mm: {
    maxSize: 200,
    quality: 0.9,
    format: 'png' as const
  },
  
  // For A4 PDF invoices (high quality) - adaptive from source
  pdf: {
    maxSize: 600,
    quality: 0.95,
    format: 'png' as const
  },
  
  // For web display (responsive) - adaptive from source
  web: {
    maxSize: 400,
    quality: 0.85,
    format: 'png' as const
  },
  
  // For email signatures - adaptive from source
  email: {
    maxSize: 150,
    quality: 0.8,
    format: 'png' as const
  },
  
  // For high-resolution displays and large screens
  highRes: {
    maxSize: 1024,
    quality: 0.95,
    format: 'png' as const
  }
};

/**
 * Resizes a logo for specific usage context
 */
export function resizeLogoForContext(
  logoDataUrl: string, 
  context: keyof typeof LOGO_CONFIGS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = LOGO_CONFIGS[context];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxSize = config.maxSize;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Output with specified format and quality
      const outputDataUrl = config.format === 'png' 
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', config.quality);
        
      resolve(outputDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = logoDataUrl;
  });
}

/**
 * Gets the optimal logo size for a given print width
 */
export function getOptimalLogoSize(printWidthMm: number): LogoSizeConfig {
  if (printWidthMm <= 58) {
    return LOGO_CONFIGS.thermal58mm;
  } else if (printWidthMm <= 80) {
    return LOGO_CONFIGS.thermal80mm;
  } else {
    return LOGO_CONFIGS.pdf;
  }
}