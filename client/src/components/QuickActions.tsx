import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, UserPlus, Factory, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function QuickActions() {
  const actions = [
    {
      title: "Nueva Factura",
      icon: Plus,
      href: "/billing",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
      iconBg: "bg-blue-600",
    },
    {
      title: "Nuevo Producto",
      icon: Package,
      href: "/products",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
      iconBg: "bg-green-600",
    },
    {
      title: "Nuevo Cliente",
      icon: UserPlus,
      href: "/customers",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
      iconBg: "bg-purple-600",
    },
    {
      title: "Orden de Producción",
      icon: Factory,
      href: "/manufacturing",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      hoverColor: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
      iconBg: "bg-orange-600",
    },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button
              variant="ghost"
              className={`w-full flex items-center justify-between p-4 h-auto ${action.bgColor} ${action.hoverColor} transition-colors`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.iconBg}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  {action.title}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Button>
          </Link>
        ))}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/sales-reports">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center">
                <div className="p-2 bg-gray-600 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span className="ml-3 font-medium text-gray-900 dark:text-white">
                  Ver Reportes
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
