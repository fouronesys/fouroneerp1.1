import { ReactNode } from 'react';
import { useResponsiveLayout, getResponsiveClass } from '@/hooks/useResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponsiveFormProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export function ResponsiveForm({ 
  children, 
  title, 
  subtitle, 
  icon, 
  className = '', 
  maxWidth = '4xl' 
}: ResponsiveFormProps) {
  const layout = useResponsiveLayout();

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  }[maxWidth];

  return (
    <div className={`${maxWidthClass} mx-auto ${layout.containerPadding} ${layout.spacing.lg} ${className}`}>
      {title && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              {icon && <span className="mr-3">{icon}</span>}
              <div>
                <h1>{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">{subtitle}</p>}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      )}
      {children}
    </div>
  );
}

interface ResponsiveFieldGroupProps {
  children: ReactNode;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
}

export function ResponsiveFieldGroup({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className = '' 
}: ResponsiveFieldGroupProps) {
  const layout = useResponsiveLayout();

  const gridClass = getResponsiveClass(layout, {
    mobile: `grid-cols-${columns.mobile || 1}`,
    tablet: `grid-cols-${columns.tablet || 2}`,
    desktop: `grid-cols-${columns.desktop || 3}`,
    default: 'grid-cols-1'
  });

  return (
    <div className={`grid ${gridClass} ${layout.spacing.md} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveFieldProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveField({ children, className = '' }: ResponsiveFieldProps) {
  const layout = useResponsiveLayout();

  return (
    <div className={`${layout.spacing.xs} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  className?: string;
}

export function ResponsiveCard({ children, title, icon, className = '' }: ResponsiveCardProps) {
  const layout = useResponsiveLayout();

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={layout.spacing.lg}>
        {children}
      </CardContent>
    </Card>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  spacing = 'md',
  className = '' 
}: ResponsiveGridProps) {
  const layout = useResponsiveLayout();

  const gridClass = getResponsiveClass(layout, {
    mobile: `grid-cols-${columns.mobile || 1}`,
    tablet: `grid-cols-${columns.tablet || 2}`,
    desktop: `grid-cols-${columns.desktop || 3}`,
    default: 'grid-cols-1'
  });

  return (
    <div className={`grid ${gridClass} ${layout.spacing[spacing]} ${className}`}>
      {children}
    </div>
  );
}