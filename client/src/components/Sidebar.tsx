import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  FileText, 
  Users, 
  ChartBar, 
  Package, 
  Warehouse, 
  ArrowLeftRight,
  Factory,
  List,
  FlaskConical,
  Truck,
  ShoppingCart,
  Star,
  CreditCard,
  Menu,
  X,
  Settings,
  Shield,
  ShieldCheck,
  Calculator,
  Brain,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  UserCog,
  Bug,
  Image,
  Building2,
  Activity,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cog,
  FileBarChart,
  Receipt
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "@assets/Four One Solutions Logo.png";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
    color: "from-blue-500 to-blue-600",
    feature: "dashboard"
  },
  {
    name: "POS",
    href: "/pos",
    icon: ShoppingCart,
    color: "from-green-500 to-green-600",
    feature: "pos"
  },
  {
    name: "Inventario",
    icon: Package,
    color: "from-purple-500 to-purple-600",
    feature: "inventory",
    children: [
      { name: "Productos", href: "/products", icon: Package, feature: "inventory.products" },
      { name: "Movimientos", href: "/inventory-movements", icon: ArrowLeftRight, feature: "inventory.movements" },
      { name: "Almacenes", href: "/warehouses", icon: Warehouse, feature: "inventory.warehouses" }
    ]
  },
  {
    name: "Manufactura",
    icon: Factory,
    color: "from-orange-500 to-orange-600",
    feature: "manufacturing",
    children: [
  
      { name: "Manufacturación", href: "/recipes", icon: Factory, feature: "manufacturing.recipes" }
    ]
  },
  {
    name: "Facturación",
    href: "/invoices",
    icon: FileText,
    color: "from-indigo-500 to-indigo-600",
    feature: "invoicing"
  },
  {
    name: "Clientes",
    href: "/customers",
    icon: Users,
    color: "from-pink-500 to-pink-600",
    feature: "customers"
  },
  {
    name: "Proveedores",
    href: "/suppliers",
    icon: Truck,
    color: "from-amber-500 to-amber-600",
    feature: "suppliers"
  },
  {
    name: "DGII / Fiscal",
    icon: ChartBar,
    color: "from-red-500 to-red-600",
    feature: "fiscal",
    children: [
      { name: "Gestión de NCF", href: "/ncf-management", icon: CreditCard, feature: "fiscal.ncf" },
      { name: "Reportes DGII", href: "/dgii-reports", icon: FileText, feature: "fiscal.reports" }
    ]
  },
  {
    name: "Contabilidad",
    icon: Calculator,
    color: "from-emerald-500 to-emerald-600",
    feature: "accounting",
    children: [
      { name: "Plan de Cuentas", href: "/accounting/chart-of-accounts", icon: List, feature: "accounting.chart" },
      { name: "Asientos Contables", href: "/accounting/journal-entries", icon: FileText, feature: "accounting.entries" },
      { name: "Reportes Financieros", href: "/accounting/reports", icon: ChartBar, feature: "accounting.reports" }
    ]
  },
  {
    name: "RRHH",
    icon: Users,
    color: "from-teal-500 to-teal-600",
    feature: "hr",
    children: [
      { name: "Empleados", href: "/employees", icon: Users, feature: "hr.employees" },

      { name: "Solicitud de Vacaciones", href: "/leave-requests", icon: FileText, feature: "hr.leaves" }
    ]
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: ChartBar,
    color: "from-rose-500 to-rose-600",
    feature: "reports"
  },
  {
    name: "Asistente IA",
    href: "/ai-assistant",
    icon: Brain,
    color: "from-violet-500 to-violet-600",
    feature: "ai",
    badge: "IA"
  },
  {
    name: "Chat Interno",
    href: "/chat",
    icon: MessageCircle,
    color: "from-cyan-500 to-cyan-600",
    feature: "chat"
  }
];

const adminNavigation = [
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
    color: "from-gray-500 to-gray-600",
    feature: "settings"
  },
  {
    name: "Permisos",
    href: "/permissions",
    icon: Shield,
    color: "from-red-500 to-red-600",
    feature: "permissions"
  },
  {
    name: "Sistema",
    href: "/system",
    icon: Cog,
    color: "from-yellow-500 to-yellow-600",
    feature: "system"
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();
  const { currentPlan, daysUntilExpiry } = useSubscription();
  const isMobile = useIsMobile();

  const { data: company } = useQuery({
    queryKey: ['/api/company'],
    enabled: !!user,
  });

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isSuperAdmin = user?.role === 'super_admin';

  // Auto-expand active parent items
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => isActive(child.href));
        if (hasActiveChild && !expandedItems.includes(item.name)) {
          setExpandedItems(prev => [...prev, item.name]);
        }
      }
    });
  }, [location]);

  // Close mobile menu on navigation
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isOpen && isMobile) {
      const handleClickOutside = (event: MouseEvent) => {
        const sidebar = document.getElementById('mobile-sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isMobile]);

  const sidebarContent = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl border-r border-slate-200/50 dark:border-gray-700/50"
    >
      {/* Header */}
      <motion.div 
        className="p-4 lg:p-6 border-b border-slate-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-500/10"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center min-w-0"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {!isCollapsed && (
              <>
                <img 
                  src={logoImage} 
                  alt="Four One Solutions" 
                  className="h-10 w-10 object-contain flex-shrink-0 mr-3"
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                    Four One Solutions
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {(company as any)?.name || "Sistema ERP"}
                  </p>
                </div>
              </>
            )}
          </motion.div>
          
          {/* Desktop collapse button */}
          {!isMobile && (
            <motion.button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>
          )}
          
          {/* Mobile close button */}
          {isMobile && (
            <motion.button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 p-2 lg:p-4 space-y-1 overflow-y-auto",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
        "scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600"
      )}>
        <motion.div 
          className="space-y-1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {navigation.map((item, index) => (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={isActive}
              isCollapsed={isCollapsed}
              isExpanded={expandedItems.includes(item.name)}
              onToggleExpanded={() => toggleExpanded(item.name)}
              index={index}
            />
          ))}
        </motion.div>

        {/* Admin Section */}
        {isSuperAdmin && !isCollapsed && (
          <motion.div 
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Administración
            </p>
            {adminNavigation.map((item, index) => (
              <NavItem 
                key={item.name} 
                item={item} 
                isActive={isActive}
                isCollapsed={isCollapsed}
                isExpanded={false}
                onToggleExpanded={() => {}}
                index={index + navigation.length}
              />
            ))}
            
            {/* Super Admin Link */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/company-management"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-500/20 dark:to-pink-500/20",
                  "border border-purple-200/50 dark:border-purple-700/50",
                  "hover:from-purple-600/20 hover:to-pink-600/20 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30",
                  "text-purple-700 dark:text-purple-300"
                )}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Gestión de Empresas</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </nav>
    </motion.div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              />

              {/* Sidebar */}
              <motion.div
                id="mobile-sidebar"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div 
      className={cn(
        "relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </div>
  );
}

// NavItem Component
function NavItem({ 
  item, 
  isActive, 
  isCollapsed, 
  isExpanded, 
  onToggleExpanded,
  index 
}: {
  item: any;
  isActive: (path: string) => boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  index: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isParentActive = hasChildren && item.children.some((child: any) => isActive(child.href));

  const itemContent = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {item.href && !hasChildren ? (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
            isActive(item.href)
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
          )}
        >
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
              item.color,
              !isActive(item.href) && "group-hover:opacity-10"
            )}
          />
          <item.icon className={cn(
            "h-5 w-5 flex-shrink-0 relative z-10 transition-transform duration-300",
            isActive(item.href) && "drop-shadow-sm",
            !isActive(item.href) && "group-hover:scale-110"
          )} />
          {!isCollapsed && (
            <>
              <span className="relative z-10 truncate">{item.name}</span>
              {item.badge && (
                <motion.span 
                  className="ml-auto px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                >
                  {item.badge}
                </motion.span>
              )}
            </>
          )}
        </Link>
      ) : (
        <button
          onClick={hasChildren ? onToggleExpanded : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
            isParentActive
              ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
          )}
        >
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
              item.color,
              !isParentActive && "group-hover:opacity-10"
            )}
          />
          <item.icon className={cn(
            "h-5 w-5 flex-shrink-0 relative z-10 transition-transform duration-300",
            isParentActive && "text-blue-600 dark:text-blue-400",
            "group-hover:scale-110"
          )} />
          {!isCollapsed && (
            <>
              <span className="relative z-10 truncate">{item.name}</span>
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-auto"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              )}
            </>
          )}
        </button>
      )}
    </motion.div>
  );

  if (!hasChildren) {
    return itemContent;
  }

  return (
    <div>
      {itemContent}
      <AnimatePresence>
        {isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 mt-1 space-y-1 overflow-hidden"
          >
            {item.children.map((child: any, childIndex: number) => (
              <motion.div
                key={child.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: childIndex * 0.05 }}
              >
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    isActive(child.href)
                      ? "bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <child.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{child.name}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}