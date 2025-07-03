import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "black" | "adaptive";
  showText?: boolean;
}

export function Logo({ 
  className, 
  size = "md", 
  variant = "adaptive",
  showText = true 
}: LogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16", 
    xl: "w-24 h-24"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  // Determine logo color based on variant and theme
  const getLogoColor = () => {
    switch (variant) {
      case "white":
        return "text-white";
      case "black":
        return "text-black";
      case "adaptive":
        return isDark ? "text-white" : "text-black";
      default:
        return "text-primary";
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "white":
        return "bg-black";
      case "black":
        return "bg-white";
      case "adaptive":
        return isDark ? "bg-black" : "bg-white";
      default:
        return "bg-transparent";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo Icon */}
      <div className={cn(
        "rounded-lg flex items-center justify-center font-bold transition-colors",
        sizeClasses[size],
        getBackgroundColor(),
        getLogoColor()
      )}>
        <span className={cn("font-black", textSizeClasses[size])}>
          F1
        </span>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold leading-none",
            textSizeClasses[size],
            getLogoColor()
          )}>
            Four One
          </span>
          <span className={cn(
            "text-xs text-muted-foreground leading-none",
            size === "sm" && "text-[10px]",
            size === "lg" && "text-sm",
            size === "xl" && "text-base"
          )}>
            Solutions
          </span>
        </div>
      )}
    </div>
  );
}

// Mobile App Icon Component - Always uses adaptive contrast
export function MobileAppIcon({ 
  className,
  size = "lg"
}: { 
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detect system theme for mobile app icon
    const checkSystemTheme = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkSystemTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', checkSystemTheme);
    };
  }, []);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20",
    xl: "w-32 h-32"
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl"
  };

  return (
    <div className={cn(
      "rounded-2xl flex items-center justify-center font-bold shadow-lg transition-all duration-300",
      sizeClasses[size],
      isDark ? "bg-black text-white border-2 border-gray-800" : "bg-white text-black border-2 border-gray-200",
      className
    )}>
      <span className={cn("font-black", textSizeClasses[size])}>
        F1
      </span>
    </div>
  );
}

// PWA Icon Component for web app manifest
export function PWAIcon({ size = 192 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 192 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background with rounded corners */}
      <rect width="192" height="192" rx="24" fill="#000000"/>
      
      {/* F1 Text */}
      <text
        x="96"
        y="120"
        textAnchor="middle"
        fontSize="80"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        F1
      </text>
      
      {/* Small accent dot */}
      <circle cx="140" cy="60" r="8" fill="#FFFFFF"/>
    </svg>
  );
}