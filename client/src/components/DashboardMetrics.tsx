import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileText, Package, Factory } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface MetricsData {
  monthSales: string;
  pendingInvoices: number;
  productsInStock: number;
  productionOrders: number;
}

export function DashboardMetrics() {
  const { data: metrics, isLoading } = useQuery<MetricsData>({
    queryKey: ["/api/dashboard/metrics"],
  });
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white dark:bg-gray-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <Skeleton className="h-12 sm:h-14 lg:h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isMobile && num >= 1000) {
      return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: "compact",
        compactDisplay: "short"
      }).format(num);
    }
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(num);
  };

  const metricsCards = [
    {
      title: "Ventas del Mes",
      value: formatCurrency(metrics?.monthSales || "0"),
      change: "0%",
      changeText: "vs mes anterior",
      changeColor: "text-gray-500 dark:text-gray-400",
      icon: BarChart3,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Facturas Pendientes",
      value: metrics?.pendingInvoices || 0,
      change: "0",
      changeText: "desde ayer",
      changeColor: "text-gray-500 dark:text-gray-400",
      icon: FileText,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Productos en Stock",
      value: metrics?.productsInStock || 0,
      change: "Sin productos",
      changeText: "",
      changeColor: "text-gray-500 dark:text-gray-400",
      icon: Package,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Órdenes de Producción",
      value: metrics?.productionOrders || 0,
      change: "Sin órdenes",
      changeText: "",
      changeColor: "text-gray-500 dark:text-gray-400",
      icon: Factory,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
      {metricsCards.map((card, index) => (
        <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 break-words">
                  {card.value}
                </p>
                <div className="flex items-center mt-1 sm:mt-2">
                  <span className={`text-xs sm:text-sm font-medium ${card.changeColor} truncate`}>
                    {card.change}
                  </span>
                  {card.changeText && !isMobile && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 truncate">
                      {card.changeText}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${card.iconBg} ml-2 flex-shrink-0`}>
                <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}