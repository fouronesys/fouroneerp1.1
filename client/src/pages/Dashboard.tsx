import { Header } from "@/components/Header";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentInvoices } from "@/components/RecentInvoices";
import { QuickActions } from "@/components/QuickActions";
import { InstallButton } from "@/components/InstallButton";
import { SalesChart } from "@/components/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Activity } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Dashboard() {
  const isMobile = useIsMobile();

  // Fetch real data for dashboard sections
  const { data: topProducts } = useQuery({
    queryKey: ["/api/reports/sales"],
  });

  const { data: auditLogs } = useQuery({
    queryKey: ["/api/system/audit-logs"],
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        title="Dashboard Principal" 
        subtitle="Resumen general de tu empresa" 
      />
      
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4 sm:space-y-6 pb-32">
        {/* Metrics Cards */}
        <DashboardMetrics />

        {/* Quick Actions - Mobile First */}
        <div className="block lg:hidden">
          <QuickActions />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Sales Chart */}
            <SalesChart />

            {/* Performance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Crecimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-500">0%</div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">vs mes anterior</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base text-gray-900 dark:text-white flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    Clientes Activos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-500">0</div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">en total</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices - Full width on mobile */}
            <div className="lg:hidden">
              <RecentInvoices />
            </div>
          </div>

          {/* Right Column - Sidebar content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions - Desktop */}
            <div className="hidden lg:block">
              <QuickActions />
            </div>

            

            {/* Recent Activity */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {auditLogs && (auditLogs as any)?.data && Array.isArray((auditLogs as any).data) && (auditLogs as any).data.length > 0 ? (
                    (auditLogs as any).data.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.module} - {log.action}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {log.resource_type} {log.resource_id && `#${log.resource_id}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(log.created_at), 'dd/MM HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay actividad reciente
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Las actividades aparecerán aquí cuando uses el sistema
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products - Compact for mobile */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos Top
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {topProducts && (topProducts as any)?.topProducts && Array.isArray((topProducts as any).topProducts) && (topProducts as any).topProducts.length > 0 ? (
                    (topProducts as any).topProducts.slice(0, 5).map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.quantity} unidades vendidas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            RD$ {parseFloat(product.revenue).toLocaleString('es-DO')}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Top {index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-20 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay productos vendidos
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Los productos más vendidos aparecerán aquí
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Install App Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Instalar Aplicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Instala Four One Solutions en tu dispositivo para acceso offline completo
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    ✓ Funcionalidad offline completa
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    ✓ Sincronización automática
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    ✓ Disponible para Windows, Mac y Linux
                  </div>
                </div>
                <InstallButton />
              </CardContent>
            </Card>

            {/* Recent Invoices - Desktop only */}
            <div className="hidden lg:block">
              <RecentInvoices />
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}