import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main content area */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobile 
            ? 'lg:ml-0' 
            : isCollapsed 
              ? 'lg:ml-0' 
              : 'lg:ml-64 xl:ml-72'
        }`}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}