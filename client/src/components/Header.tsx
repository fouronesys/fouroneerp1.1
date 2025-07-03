import { Plus, ChevronDown, LogOut, User, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "./NotificationCenter";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useThemeContext();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getUserName = () => {
    if (user && typeof user === 'object' && 'email' in user) {
      return (user as any).email || "Usuario";
    }
    return "Usuario";
  };

  const handleLogout = async () => {
    try {
      // Clear React Query cache first
      queryClient.clear();
      
      // Call logout endpoint
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker cache if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (cacheError) {
          console.log('Cache cleanup skipped');
        }
      }
      
      // Force hard reload and redirect
      window.location.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/auth";
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 theme-blue:bg-gradient-to-r theme-blue:from-blue-600 theme-blue:to-blue-700 border-b border-gray-200 dark:border-gray-700 theme-blue:border-blue-500 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white theme-blue:text-white truncate">
            {title}
          </h1>
          {subtitle && !isMobile && (
            <p className="text-sm text-gray-500 dark:text-gray-400 theme-blue:text-blue-100 truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Actions Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle - Hidden on mobile */}
          {!isMobile && (
            <div className="hidden sm:flex gap-1 lg:gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="text-xs px-2 lg:px-3"
              >
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="text-xs px-2 lg:px-3"
              >
                Oscuro
              </Button>
              <Button
                variant={theme === "blue" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("blue")}
                className="text-xs px-2 lg:px-3"
              >
                Azul
              </Button>
            </div>
          )}

          {/* New Invoice Button */}
          <Button 
            onClick={() => setLocation("/billing")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Factura</span>
          </Button>
          
          {/* User Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notifications */}
            {!isMobile && <NotificationCenter />}
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 theme-blue:hover:bg-white/10 px-2 sm:px-3"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                    {getInitials()}
                  </div>
                  {!isMobile && (
                    <>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 theme-blue:text-white truncate max-w-24 lg:max-w-32">
                        {getUserName()}
                      </span>
                      <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuLabel className="text-sm">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium">
                      {getUserName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user && typeof user === 'object' && 'email' in user ? (user as any).email : ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Theme Options */}
                {isMobile && (
                  <>
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      Tema
                    </DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setTheme("light")}
                      className={theme === "light" ? "bg-blue-50" : ""}
                    >
                      Claro
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("dark")}
                      className={theme === "dark" ? "bg-blue-50" : ""}
                    >
                      Oscuro
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTheme("blue")}
                      className={theme === "blue" ? "bg-blue-50" : ""}
                    >
                      Azul
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                {isMobile && (
                  <DropdownMenuItem onClick={() => setLocation("/notifications")}>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notificaciones</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Mobile subtitle */}
      {subtitle && isMobile && (
        <p className="text-xs text-gray-500 dark:text-gray-400 theme-blue:text-blue-100 mt-1 truncate">
          {subtitle}
        </p>
      )}
    </header>
  );
}