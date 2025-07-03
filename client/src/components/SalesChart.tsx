import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface SalesDataPoint {
  date: string;
  invoices: number;
  pos: number;
  total: number;
}

export function SalesChart() {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const { data: salesData, isLoading } = useQuery<SalesDataPoint[]>({
    queryKey: ["/api/dashboard/sales-chart"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-DO', { month: 'short', day: 'numeric' });
  };

  const processedData = salesData?.map(item => ({
    ...item,
    date: formatDate(item.date)
  })) || [];

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
              Ventas Diarias
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="h-48 sm:h-64 lg:h-72 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
            Ventas Diarias (Últimos 6 Meses)
          </CardTitle>
          <Select value={chartType} onValueChange={(value: "bar" | "line") => setChartType(value)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="line">Líneas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="h-48 sm:h-64 lg:h-72">
          {processedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="pos" fill="#3B82F6" name="POS" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="invoices" fill="#10B981" name="Facturas" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), ""]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3B82F6' }}
                    name="Total"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="invoices" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10B981' }}
                    name="Facturas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pos" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#F59E0B' }}
                    name="POS"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay datos de ventas disponibles
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Las ventas aparecerán aquí cuando tengas transacciones
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}