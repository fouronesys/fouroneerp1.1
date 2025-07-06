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

  // Format currency helper
  const formatRD$ = (value: number): string => {
    return value.toLocaleString('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
            </CardContent>
          </Card>

          {/* Número de Ventas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Número de Ventas</CardTitle>
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
              <div className="text-2xl font-bold">{formatRD$(avgTicket)}</div>
              <p className="text-xs text-muted-foreground">Por transacción</p>
            </CardContent>
          </Card>

          {/* Productos Vendidos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Unidades vendidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas</CardTitle>
              <CardDescription>Ventas por día en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [formatRD$(value), "Ventas"]} />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ventas por Categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Categoría</CardTitle>
              <CardDescription>Distribución de ventas por categoría de producto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRD$(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Productos Top */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top productos por ventas en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatRD$(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm">No hay datos de productos para este período</p>
              </div>
            )}
          </CardContent>
        </Card>
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

    const totalProducts = (inventoryData as any)?.totalProducts || 0;
    const lowStockProducts = (inventoryData as any)?.lowStockProducts || 0;
    const outOfStockProducts = (inventoryData as any)?.outOfStockProducts || 0;
    const totalValue = parseFloat((inventoryData as any)?.totalValue || "0");
    const stockMovements = (inventoryData as any)?.stockMovements || [];
    const categoryDistribution = (inventoryData as any)?.categoryDistribution || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Productos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
              <p className="text-xs text-muted-foreground">Productos agotados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRD$(totalValue)}</div>
              <p className="text-xs text-muted-foreground">Inventario valorizado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Stock</CardTitle>
              <CardDescription>Últimos movimientos de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockMovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="entries" fill="#00C49F" name="Entradas" />
                  <Bar dataKey="exits" fill="#FF8042" name="Salidas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categoría</CardTitle>
              <CardDescription>Productos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (isLoadingCustomer) {
      return <div>Cargando reporte de clientes...</div>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Clientes</CardTitle>
            <CardDescription>Análisis de base de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Funcionalidad en desarrollo</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProductReport = () => {
    if (isLoadingProduct) {
      return <div>Cargando reporte de productos...</div>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Productos</CardTitle>
            <CardDescription>Análisis de catálogo de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Funcionalidad en desarrollo</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Analíticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado de las operaciones del negocio
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipo de Reporte</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="inventory">Inventario</SelectItem>
                  <SelectItem value="customers">Clientes</SelectItem>
                  <SelectItem value="products">Productos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Reporte */}
      <div className="space-y-6">
        {selectedReport === "sales" && renderSalesReport()}
        {selectedReport === "inventory" && renderInventoryReport()}
        {selectedReport === "customers" && renderCustomerReport()}
        {selectedReport === "products" && renderProductReport()}
      </div>
    </div>
  );
}
