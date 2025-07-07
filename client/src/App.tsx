import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import QuickActionMenu from "@/components/QuickActionMenu";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { registerSW } from "@/lib/serviceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import { errorLogger } from "@/lib/errorLogger";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Landing from "@/pages/Landing";
import QuoteRequest from "@/pages/QuoteRequest";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Billing from "@/pages/Billing";
import Customers from "@/pages/Customers";
import Products from "@/pages/Products";
import Chat from "@/pages/Chat";
import UserManagement from "@/pages/UserManagement";
import Production from "@/pages/Production";
import BOM from "@/pages/BOM";
import Manufacturing from "@/pages/Manufacturing";
import POS from "@/pages/POS";
import Setup from "@/pages/Setup";
import SuperAdmin from "@/pages/SuperAdmin";
import CompanySettings from "@/pages/CompanySettings";
import SalesReports from "@/pages/SalesReports";
import POSSales from "@/pages/POSSales";
import WarehouseManagementSimple from "@/pages/WarehouseManagementSimple";
import Movements from "@/pages/Movements";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import Employees from "@/pages/Employees";
import Payroll from "@/pages/Payroll";

import AIInsights from "@/pages/AIInsights";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import CompanyAnalytics from "@/pages/CompanyAnalytics";
import Purchases from "@/pages/Purchases";
import Accounting from "@/pages/Accounting";
import EnhancedAccounting from "@/pages/EnhancedAccounting";
import FinancialManagement from "@/pages/FinancialManagement";
import ErrorManagement from "@/pages/ErrorManagement";
import Inventory from "@/pages/Inventory";
import ModuleManager from "@/pages/ModuleManager";
import SystemMonitoring from "@/pages/SystemMonitoring";
import Payment from "@/pages/Payment";
import CompanyManagement from "@/pages/CompanyManagement";
import SetupPassword from "@/pages/SetupPassword";
import ResetPassword from "@/pages/ResetPassword";
import ApiRegistration from "@/pages/ApiRegistration";
import ApiDocs from "@/pages/ApiDocs";
import Suppliers from "@/pages/Suppliers";
// Import existing modules that are available
import NCFManagement from "@/pages/NCFManagement";
import DGIIReports from "@/pages/DGIIReports";
// Import accounting components
import ChartOfAccounts from "@/pages/accounting/ChartOfAccounts";
import JournalEntries from "@/pages/accounting/JournalEntries";
import FinancialReports from "@/pages/accounting/FinancialReports";
// Import other missing components
import Invoices from "@/pages/Invoices";
import InventoryMovements from "@/pages/InventoryMovements";

import LeaveRequests from "@/pages/hr/LeaveRequests";
import AIAssistant from "@/pages/AIAssistant";
import Reports from "@/pages/Reports";
import Permissions from "@/pages/Permissions";
import System from "@/pages/System";
import Downloads from "@/pages/Downloads";
import Sitemap from "@/pages/Sitemap";
import Security from "@/pages/Security";

import InstallationGuide from "@/pages/InstallationGuide";
import VerifySale from "@/pages/VerifySale";
import NotFound from "@/pages/not-found";
import LoginAnimation from "@/components/LoginAnimation";

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType }) {
  // Check user authentication status
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  // Check payment status for authenticated users
  const { data: paymentStatus, isLoading: isPaymentLoading } = useQuery({
    queryKey: ["/api/user/payment-status"],
    enabled: !!user,
    retry: false,
  });

  const { toast } = useToast();
  const isAuthenticated = !!user;
  const hasValidPayment = (paymentStatus as any)?.hasValidPayment === true;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acceso no autorizado",
        description: "Debes iniciar sesión para acceder a esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    // Super admins bypass payment requirements
    const isSuperAdmin = (user as any)?.role === "super_admin";
    const paymentStatusData = paymentStatus as any;
    
    if (isAuthenticated && !isPaymentLoading && !hasValidPayment && !isSuperAdmin) {
      // Show different messages based on payment status
      let title = "Pago requerido";
      let description = "Debes completar el pago para acceder al sistema.";
      
      if (paymentStatusData?.status === 'trial_active') {
        title = "Período de prueba";
        description = `Te quedan ${paymentStatusData.daysRemaining} días de prueba. Completa el pago para acceso completo.`;
      } else if (paymentStatusData?.status === 'trial_expired') {
        title = "Período de prueba expirado";
        description = "Tu período de prueba ha expirado. Completa el pago para continuar usando el sistema.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/payment";
      }, 1000);
    }
  }, [isAuthenticated, isPaymentLoading, hasValidPayment, paymentStatus, (user as any)?.role, toast]);

  if (isLoading || (isAuthenticated && isPaymentLoading)) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center z-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="relative">
              <div className="w-24 h-24 mx-auto border-4 border-blue-300 border-t-white rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <div className="text-blue-900 font-bold text-xl">41</div>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">Four One Solutions</h1>
          <p className="text-blue-200 mb-8 text-lg">Soluciones Empresariales Dominicanas</p>
          
          <div className="w-full bg-blue-800 rounded-full h-2 mb-6">
            <div className="bg-gradient-to-r from-blue-400 to-white h-2 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-blue-300 text-xs">© 2025 Four One Solutions - Tecnología Empresarial Dominicana</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasValidPayment) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
          <Component {...props} />
        </div>
      </main>
    </div>
  );
}

function Router() {
  // Check user authentication status
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const [setupComplete, setSetupComplete] = useState(false);
  const isAuthenticated = !!user;
  
  // Initialize session persistence to maintain login during deployments
  const { isReconnecting, reconnectAttempts } = useSessionPersistence({
    heartbeatInterval: 30000, // 30 seconds
    reconnectAttempts: 5,
    reconnectDelay: 2000 // 2 seconds
  });
  
  // Check if user has company configured
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/companies/current"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Check user payment status
  const { data: paymentStatus, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/user/payment-status"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Initialize error logger and set user context
  useEffect(() => {
    errorLogger.initializeGlobalHandlers();
    
    if (user && company && typeof user === 'object' && typeof company === 'object') {
      errorLogger.setUserContext((user as any).id, (company as any).id);
    }
  }, [user, company]);

  // Show loading during authentication check
  if (isLoading || (isAuthenticated && paymentLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show auth page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={AuthPage} />
        <Route path="/quote-request" component={QuoteRequest} />
        <Route path="/verify/sale/:saleId" component={VerifySale} />
        <Route path="/api-registration" component={ApiRegistration} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route path="/payment" component={Payment} />
        <Route path="/setup-password" component={SetupPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show payment page if user is authenticated but needs to complete payment
  const paymentStatusData = paymentStatus as any;
  const needsPayment = isAuthenticated && paymentStatusData && 
    !paymentStatusData.hasValidPayment && 
    paymentStatusData.status !== 'super_admin';
  
  if (needsPayment) {
    return (
      <Switch>
        <Route path="/payment" component={Payment} />
        <Route path="/setup">{() => <Setup onComplete={() => window.location.reload()} />}</Route>
        <Route component={Payment} />
      </Switch>
    );
  }

  // Show setup page if no company is configured
  if (!companyLoading && company && (!(company as any).name || (company as any).name === "Mi Empresa") && !setupComplete) {
    return <Setup onComplete={() => setSetupComplete(true)} />;
  }

  // Show authenticated routes with Sidebar layout
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <SyncStatusIndicator />
      <div className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/billing" component={Billing} />
          <Route path="/customers" component={Customers} />
          <Route path="/products" component={Products} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/manufacturing" component={Manufacturing} />
          <Route path="/production" component={Production} />
          <Route path="/pos" component={POS} />
          <Route path="/sales-reports" component={SalesReports} />
          <Route path="/pos-sales" component={POSSales} />
          <Route path="/warehouses" component={WarehouseManagementSimple} />
          <Route path="/bom" component={BOM} />
          <Route path="/admin" component={SuperAdmin} />
          <Route path="/companies" component={CompanySettings} />
          <Route path="/company-settings" component={CompanySettings} />
          <Route path="/movements" component={Movements} />
          <Route path="/recipes" component={Manufacturing} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/ncf-management" component={NCFManagement} />
          <Route path="/dgii-reports" component={DGIIReports} />

          <Route path="/accounting" component={Accounting} />
          <Route path="/accounting-enhanced" component={EnhancedAccounting} />
          <Route path="/accounting/chart-of-accounts" component={ChartOfAccounts} />
          <Route path="/accounting/journal-entries" component={JournalEntries} />
          <Route path="/accounting/reports" component={FinancialReports} />
          <Route path="/financial-management" component={FinancialManagement} />
          <Route path="/error-management" component={ErrorManagement} />
          <Route path="/system-monitoring" component={SystemMonitoring} />
          <Route path="/company-management" component={CompanyManagement} />
          <Route path="/module-manager" component={ModuleManager} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/inventory-movements" component={InventoryMovements} />

          <Route path="/employees" component={Employees} />

          <Route path="/leave-requests" component={LeaveRequests} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/ai-insights" component={AIInsights} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/plans" component={SubscriptionPlans} />
          <Route path="/chat" component={Chat} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/super-admin" component={SuperAdmin} />
          <Route path="/company-analytics" component={CompanyAnalytics} />
          <Route path="/profile" component={Profile} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/settings" component={Settings} />
          <Route path="/reports" component={Reports} />
          <Route path="/permissions" component={Permissions} />
          <Route path="/system" component={System} />
            <Route path="/downloads" component={Downloads} />
            <Route path="/sitemap" component={Sitemap} />
          <Route path="/security" component={Security} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/help/installation" component={InstallationGuide} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      {/* Quick Action Floating Menu */}
      <QuickActionMenu />
      
      {/* Install Prompt */}
      <InstallPrompt />
      
      {/* Connection Status Indicator */}
      <ConnectionStatus 
        isReconnecting={isReconnecting}
        reconnectAttempts={reconnectAttempts}
        maxAttempts={5}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Registrar Service Worker para funcionalidad offline
    registerSW();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
