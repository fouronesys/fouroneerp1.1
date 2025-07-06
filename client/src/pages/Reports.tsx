import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  ShoppingCart
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("sales");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Query for different report data
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ["/api/reports/sales", startDate, endDate],
    enabled: selectedReport === "sales",
  });

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["/api/reports/inventory"],
    enabled: selectedReport === "inventory",
  });

  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["/api/reports/customers", startDate, endDate],
    enabled: selectedReport === "customers",
  });

  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/reports/products", startDate, endDate],
    enabled: selectedReport === "products",
  });

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando reporte ${selectedReport} en formato ${format}`);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderSalesReport = () => {
    if (isLoadingSales) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Use real sales data from API
    const formatRD$ = (value: number): string => {
  return value.toLocaleString('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    const salesChartData = (salesData as any)?.chartData || [];
    const salesByCategory = (salesData as any)?.categoryData || [];
    const totalSales = parseFloat((salesData as any)?.totalSales || "0");
    const salesCount = (salesData as any)?.salesCount || 0;
    const avgTicket = parseFloat((salesData as any)?.avgTicket || "0");
    const totalItems = (salesData as any)?.totalItems || 0;
    const topProducts = (salesData as any)?.topProducts || [];

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Ventas Totales */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRD$(totalSales)}</div>
          <p className="text-xs text-muted-foreground">Período seleccionado</p>
        </CardContent>
      </Card>

      {/* Transacciones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesCount}</div>
          <p className="text-xs text-muted-foreground">Ventas realizadas</p>
        </CardContent>
      </Card>

      {/* Ticket Promedio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRD$avgTicket}</div>
          <p className="text-xs text-muted-foreground">Por transacción</p>
        </CardContent>
      </Card>

      {/* Productos Vendidos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesData?.totalItems || 0}</div>
          <p className="text-xs text-muted-foreground">Unidades vendidas</p>
        </CardContent>
      </Card>
    </div>

    {/* Tendencia de Ventas */}
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ventas" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Ventas por Categoría */}
  <Card>
    <CardHeader>
      <CardTitle>Ventas por Categoría</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={salesByCategory}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {salesByCategory.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Productos Más Vendidos */}
  <Card>
    <CardHeader>
      <CardTitle>Productos Más Vendidos</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {(salesData?.topProducts || []).length > 0 ? (
          salesData.topProducts.map((product: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
              </div>
              {/* Formatear revenue en RD$ */}
              <span className="font-mono font-medium">
                RD${parseFloat(product.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay datos de productos para este período</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (isLoadingInventory) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    const totalInventoryValue = (inventoryData as any)?.totalValue || 0;
    const totalProducts = (inventoryData as any)?.totalProducts || 0;
    const lowStockCount = (inventoryData as any)?.lowStock || 0;
    const outOfStockCount = (inventoryData as any)?.outOfStock || 0;
    const stockByCategory = (inventoryData as any)?.stockByCategory || [];
    const criticalProducts = (inventoryData as any)?.criticalProducts || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RD${totalInventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{totalProducts} productos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Productos con Stock Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Requieren reorden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Productos Sin Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">Agotados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockByCategory.length}</div>
              <p className="text-xs text-muted-foreground">Con inventario</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(inventoryData?.criticalProducts || []).length > 0 ? (
                inventoryData.criticalProducts.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.current} / Min: {product.min}
                      </p>
                    </div>
                    <Badge variant={
                      product.status === "critical" ? "destructive" :
                      product.status === "out" ? "secondary" : "outline"
                    }>
                      {product.status === "critical" ? "Crítico" :
                       product.status === "out" ? "Agotado" : "Bajo"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Todos los productos tienen stock adecuado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-screen overflow-y-auto max-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Período del Reporte</CardTitle>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-muted-foreground">hasta</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          {renderSalesReport()}
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          {renderInventoryReport()}
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Datos de clientes en proceso de carga</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Datos de productos en proceso de carga</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
