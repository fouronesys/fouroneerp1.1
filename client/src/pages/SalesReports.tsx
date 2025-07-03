import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Download, 
  Filter, 
  BarChart3,
  Users,
  ShoppingCart,
  Eye,
  FileSpreadsheet,
  FileImage,
  FileType,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { reportExporter, type ReportData } from "@/lib/reportExporter";
import type { Invoice, POSSale } from "@shared/schema";

export default function SalesReports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "word" | "txt">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        setLocation('/login');
        return false;
      }
      return failureCount < 3;
    }
  });

  const { data: posSales, isLoading: posLoading, error: posError } = useQuery<POSSale[]>({
    queryKey: ["/api/pos/sales"],
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        setLocation('/login');
        return false;
      }
      return failureCount < 3;
    }
  });

  const { data: company, error: companyError } = useQuery({
    queryKey: ["/api/companies/current"],
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        setLocation('/login');
        return false;
      }
      return failureCount < 3;
    }
  });

  const isLoading = invoicesLoading || posLoading;
  const hasErrors = invoicesError || posError || companyError;

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RD$0.00';
    }
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDateRangeFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    return { startDate, endDate };
  };

  const filterSalesByDate = (sales: any[], days: number) => {
    const { startDate } = getDateRangeFilter(days);
    return sales.filter(sale => new Date(sale.date || sale.createdAt) >= startDate);
  };

  const reportMetrics = useMemo(() => {
    const filteredInvoices = invoices ? filterSalesByDate(invoices, parseInt(dateRange)) : [];
    const filteredPOSSales = posSales ? filterSalesByDate(posSales, parseInt(dateRange)) : [];
    
    // Provide default empty arrays if data is not available
    const safeInvoices = filteredInvoices || [];
    const safePOSSales = filteredPOSSales || [];
    
    const invoiceData = (reportType === "invoices" || reportType === "all") ? safeInvoices : [];
    const posData = (reportType === "pos" || reportType === "all") ? safePOSSales : [];
    
    // Calculate revenue with proper number handling
    const invoiceRevenue = invoiceData.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const posRevenue = posData.reduce((sum, sale) => {
      const amount = parseFloat(sale.total?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const totalRevenue = invoiceRevenue + posRevenue;
    const totalTransactions = invoiceData.length + posData.length;
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const paidInvoices = invoiceData.filter(invoice => invoice.status === "paid").length;
    
    // Additional detailed metrics
    const pendingInvoices = invoiceData.filter(invoice => invoice.status === "pending" || invoice.status === "draft").length;
    const totalInvoices = invoiceData.length;
    const totalPOSSales = posData.length;
    
    // Revenue breakdown
    const invoicePercentage = totalRevenue > 0 ? (invoiceRevenue / totalRevenue) * 100 : 0;
    const posPercentage = totalRevenue > 0 ? (posRevenue / totalRevenue) * 100 : 0;
    
    // Calculate tax totals
    const totalTax = [...invoiceData, ...posData].reduce((sum, item) => {
      const tax = parseFloat((item as any).tax?.toString() || (item as any).taxAmount?.toString() || '0');
      return sum + (isNaN(tax) ? 0 : tax);
    }, 0);
    
    const netRevenue = totalRevenue - totalTax;
    
    const allTransactions = [
      ...invoiceData.map(invoice => ({
        date: invoice.date || (invoice.createdAt ? new Date(invoice.createdAt).toISOString() : new Date().toISOString()),
        type: "Factura",
        id: invoice.invoiceNumber || `INV-${invoice.id}`,
        customer: invoice.customerName || "Cliente General",
        amount: invoice.total,
        status: invoice.status || "pendiente"
      })),
      ...posData.map(sale => ({
        date: sale.createdAt ? new Date(sale.createdAt).toISOString() : new Date().toISOString(),
        type: "POS",
        id: `POS-${sale.id}`,
        customer: sale.customerName || "Cliente General",
        amount: sale.total,
        status: "completado"
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalRevenue,
      totalTransactions,
      averageTicket,
      paidInvoices,
      pendingInvoices,
      totalInvoices,
      totalPOSSales,
      invoiceRevenue,
      posRevenue,
      invoicePercentage,
      posPercentage,
      totalTax,
      netRevenue,
      transactions: allTransactions
    };
  }, [invoices, posSales, dateRange, reportType]);

  const getPeriodLabel = () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return `${startDate.toLocaleDateString('es-DO')} - ${endDate.toLocaleDateString('es-DO')}`;
  };

  const handleExportReport = async (format: "pdf" | "excel" | "word" | "txt") => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      const reportData: ReportData = {
        title: "Reporte de Ventas",
        period: getPeriodLabel(),
        companyName: (company as any)?.name || "Mi Empresa",
        companyLogo: (company as any)?.logo,
        summary: {
          totalRevenue: reportMetrics.totalRevenue,
          totalTransactions: reportMetrics.totalTransactions,
          averageTicket: reportMetrics.averageTicket,
          paidInvoices: reportMetrics.paidInvoices
        },
        transactions: reportMetrics.transactions
      };

      switch (format) {
        case "pdf":
          await reportExporter.exportToPDF(reportData);
          break;
        case "excel":
          await reportExporter.exportToExcel(reportData);
          break;
        case "word":
          await reportExporter.exportToWord(reportData);
          break;
        case "txt":
          await reportExporter.exportToTXT(reportData);
          break;
      }

      toast({
        title: "Reporte exportado",
        description: `El reporte se ha exportado exitosamente en formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar el reporte. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header title="Reportes de Ventas" subtitle="Análisis detallado de tus ventas" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando reportes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header title="Reportes de Ventas" subtitle="Análisis detallado de tus ventas" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="mb-2">
                  <strong>Error al cargar los datos</strong>
                </div>
                <p className="text-sm mb-3">
                  No se pudieron cargar los datos de reportes. Esto puede deberse a problemas de conexión o autenticación.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data is available
  const hasNoData = (!invoices || invoices.length === 0) && (!posSales || posSales.length === 0);

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Reportes de Ventas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis detallado de rendimiento de ventas
            </p>
          </div>
        </div>
        
        {hasNoData && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                No hay datos de ventas disponibles
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Comienza a realizar ventas para ver tus reportes aquí.
              </p>
              <Button onClick={() => setLocation('/pos')} className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ir al POS
              </Button>
            </CardContent>
          </Card>
        )}
        
        {!hasNoData && (
          <div className="space-y-6">
            {/* Filters Section */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Filtros de Reporte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Period Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Período
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                      <SelectItem value="365">Último año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Venta
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ventas</SelectItem>
                      <SelectItem value="invoices">Solo facturas</SelectItem>
                      <SelectItem value="pos">Solo POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Formato de Exportación
                  </label>
                  <Select value={exportFormat} onValueChange={(value: "pdf" | "excel" | "word" | "txt") => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF (con estilos)</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="word">Word (.docx)</SelectItem>
                      <SelectItem value="txt">Texto (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acción
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exportando..." : "Exportar Reporte"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleExportReport("pdf")}>
                        <FileImage className="h-4 w-4 mr-2" />
                        PDF (con estilos)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportReport("excel")}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportReport("word")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportReport("txt")}>
                        <FileType className="h-4 w-4 mr-2" />
                        Texto (.txt)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Ingresos Totales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(reportMetrics.totalRevenue)}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  En {dateRange} días
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                  Total Transacciones
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {reportMetrics.totalTransactions}
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Ventas procesadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Ticket Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(reportMetrics.averageTicket)}
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Por transacción
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Facturas Pagadas
                </CardTitle>
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {reportMetrics.paidInvoices}
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Facturas completadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Revenue Breakdown */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Desglose de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos por Facturas</span>
                    <span className="font-semibold">{formatCurrency(reportMetrics.invoiceRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${reportMetrics.invoicePercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {reportMetrics.invoicePercentage.toFixed(1)}% del total ({reportMetrics.totalInvoices} facturas)
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos por POS</span>
                    <span className="font-semibold">{formatCurrency(reportMetrics.posRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${reportMetrics.posPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {reportMetrics.posPercentage.toFixed(1)}% del total ({reportMetrics.totalPOSSales} ventas)
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Ingresos Netos</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(reportMetrics.netRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Total de Impuestos</span>
                    <span>{formatCurrency(reportMetrics.totalTax)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Resumen de Estados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {reportMetrics.paidInvoices}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Facturas Pagadas
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {reportMetrics.pendingInvoices}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      Facturas Pendientes
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {reportMetrics.totalPOSSales}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Ventas POS
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {reportMetrics.totalTransactions}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      Total Ventas
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Conversión</span>
                    <span className="font-semibold">
                      {reportMetrics.totalInvoices > 0 ? 
                        ((reportMetrics.paidInvoices / reportMetrics.totalInvoices) * 100).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Facturas por día</span>
                    <span className="font-semibold">
                      {(reportMetrics.totalInvoices / parseInt(dateRange)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ventas POS por día</span>
                    <span className="font-semibold">
                      {(reportMetrics.totalPOSSales / parseInt(dateRange)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Detalle de Transacciones
                <Badge variant="secondary" className="ml-2 text-xs">
                  {reportMetrics.transactions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {reportMetrics.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay transacciones en el período seleccionado
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[600px] px-2 sm:px-0">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <table className="w-full table-fixed">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 w-24">
                              Fecha
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 w-20">
                              Tipo
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 w-24">
                              ID
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 flex-1">
                              Cliente
                            </th>
                            <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-100 w-24">
                              Monto
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 w-20">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportMetrics.transactions.slice(0, 50).map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-300 truncate">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant={transaction.type === "Factura" ? "default" : "secondary"} className="text-xs">
                                  {transaction.type}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                                {transaction.id}
                              </td>
                              <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-300 truncate">
                                {transaction.customer}
                              </td>
                              <td className="py-3 px-2 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="py-3 px-2">
                                <Badge 
                                  variant={transaction.status === "paid" || transaction.status === "completado" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {transaction.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3">
                      {reportMetrics.transactions.slice(0, 20).map((transaction, index) => (
                        <Card key={index} className="border-gray-200 dark:border-gray-700">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                  {transaction.id}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(transaction.date)}
                                </p>
                              </div>
                              <Badge variant={transaction.type === "Factura" ? "default" : "secondary"} className="text-xs ml-2">
                                {transaction.type}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {transaction.customer}
                              </p>
                              <div className="flex justify-between items-center pt-1">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                  {formatCurrency(transaction.amount)}
                                </span>
                                <Badge 
                                  variant={transaction.status === "paid" || transaction.status === "completado" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {reportMetrics.transactions.length > (isMobile ? 20 : 50) && (
                      <div className="text-center mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Mostrando {isMobile ? 20 : 50} de {reportMetrics.transactions.length} transacciones.
                          Exporta el reporte completo para ver todos los datos.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
}