import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "blue";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fourOneTheme") as Theme;
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
      return saved || systemPreference;
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove("dark", "theme-blue");
    
    // Apply the correct theme immediately
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "blue") {
      root.classList.add("theme-blue");
    }
    // For light theme, no class needed as it's the default
    
    // Save to localStorage
    localStorage.setItem("fourOneTheme", theme);
  }, [theme]);

  // Initialize theme on first load
  useEffect(() => {
    const root = document.documentElement;
    
    // Immediately apply theme without waiting
    root.classList.remove("dark", "theme-blue");
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "blue") {
      root.classList.add("theme-blue");
    }
    
    // Mark as initialized and make visible
    root.dataset.themeInitialized = "true";
    
    // Force a repaint to ensure theme is applied
    root.style.visibility = "visible";
  }, [theme]);

  return { theme, setTheme };
}
