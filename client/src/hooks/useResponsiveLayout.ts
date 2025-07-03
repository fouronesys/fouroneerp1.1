import { useState, useEffect } from 'react';

export interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  isTouch: boolean;
  containerPadding: string;
  gridCols: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
}

// Hook avanzado para detectar breakpoints, orientación y contexto del dispositivo
export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    width: 0,
    height: 0,
    isTouch: false,
    containerPadding: 'p-4',
    gridCols: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2',
      desktop: 'grid-cols-3'
    },
    spacing: {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    }
  });
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isLandscape = width > height;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setLayout({
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        width,
        height,
        isTouch,
        containerPadding: isMobile ? 'p-2 sm:p-3' : isTablet ? 'p-4' : 'p-6',
        gridCols: {
          mobile: isMobile ? 'grid-cols-1' : 'grid-cols-2',
          tablet: isTablet ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
          desktop: isDesktop ? 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-3'
        },
        spacing: {
          xs: isMobile ? 'gap-1' : 'gap-2',
          sm: isMobile ? 'gap-2' : 'gap-3',
          md: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-5',
          lg: isMobile ? 'gap-4' : isTablet ? 'gap-5' : 'gap-6'
        }
      });
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);
  
  return layout;
}

// Utility functions para clases CSS responsivas
export const getResponsiveClass = (layout: ResponsiveLayout, classes: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
}) => {
  if (layout.isMobile && classes.mobile) return classes.mobile;
  if (layout.isTablet && classes.tablet) return classes.tablet;
  if (layout.isDesktop && classes.desktop) return classes.desktop;
  return classes.default || '';
};

export const getFormLayoutClass = (layout: ResponsiveLayout) => {
  return getResponsiveClass(layout, {
    mobile: 'space-y-4',
    tablet: 'grid grid-cols-2 gap-4',
    desktop: 'grid grid-cols-3 gap-6',
    default: 'space-y-4'
  });
};

export const getCardGridClass = (layout: ResponsiveLayout, itemsPerRow?: { mobile?: number; tablet?: number; desktop?: number }) => {
  const mobile = itemsPerRow?.mobile || 1;
  const tablet = itemsPerRow?.tablet || 2;
  const desktop = itemsPerRow?.desktop || 3;
  
  if (layout.isMobile) {
    return mobile === 1 ? 'grid-cols-1' : mobile === 2 ? 'grid-cols-2' : 'grid-cols-3';
  }
  if (layout.isTablet) {
    return tablet === 1 ? 'grid-cols-1' : tablet === 2 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-3 lg:grid-cols-4';
  }
  return desktop === 1 ? 'grid-cols-1' : 
         desktop === 2 ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
         desktop === 3 ? 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
         'grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
};