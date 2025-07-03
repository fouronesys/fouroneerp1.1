import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calculator,
  FileText,
  Search,
  Plus,
  Download,
  Upload,
  TrendingUp,
  BarChart3,
  Receipt,
  Building,
  Book,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Account {
  id: number;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  currentBalance: string;
  dgiiCode?: string;
  level: number;
  isParent: boolean;
  allowTransactions: boolean;
  isActive: boolean;
}

interface JournalEntry {
  id: number;
  entryNumber: string;
  reference: string;
  description: string;
  date: string;
  totalAmount: string;
  status: string;
  sourceModule?: string;
  documents?: any[];
}

interface FinancialReport {
  id: number;
  reportType: string;
  reportName: string;
  periodo: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  fileName?: string;
}

interface DGIICompliance {
  id: number;
  transactionType: string;
  ncf?: string;
  itbisAmount: string;
  isReported: boolean;
  reportPeriod: string;
}

export default function EnhancedAccounting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [reportType, setReportType] = useState<'BALANCE_GENERAL' | 'ESTADO_RESULTADOS' | 'FLUJO_EFECTIVO'>('BALANCE_GENERAL');

  // Queries for different accounting modules
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounting/accounts", searchQuery, selectedCategory],
  });

  const { data: journalEntries = [], isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/accounting/journal-entries"],
  });

  const { data: financialReports = [] } = useQuery<FinancialReport[]>({
    queryKey: ["/api/accounting/financial-reports"],
  });

  const { data: dgiiCompliance = [] } = useQuery<DGIICompliance[]>({
    queryKey: ["/api/accounting/dgii-compliance"],
  });

  // Initialize DGII Chart of Accounts
  const initializeDGIIMutation = useMutation({
    mutationFn: () => apiRequest("/api/accounting/initialize-dgii", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/accounts"] });
      toast({
        title: "Plan de Cuentas DGII Inicializado",
        description: "Se ha creado el plan de cuentas conforme a los estándares de la DGII",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al inicializar plan de cuentas",
        variant: "destructive",
      });
    },
  });

  // Generate Financial Report
  const generateReportMutation = useMutation({
    mutationFn: (data: { reportType: string; startDate: string; endDate: string }) =>
      apiRequest("/api/accounting/generate-report", {
        method: "POST",
        body: data,
      }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/financial-reports"] });
      toast({
        title: "Reporte Generado",
        description: "El reporte financiero se ha generado correctamente",
      });
      
      // Auto-download if file was created
      if (response.filePath) {
        window.open(`/api/accounting/download-report/${response.id}`, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al generar reporte",
        variant: "destructive",
      });
    },
  });

  // Export Chart of Accounts to Excel
  const exportAccountsMutation = useMutation({
    mutationFn: () => apiRequest("/api/accounting/export-accounts", { method: "POST" }),
    onSuccess: (response: any) => {
      // Create download link
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Plan_Cuentas_DGII_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportación Completada",
        description: "El plan de cuentas se ha exportado a Excel",
      });
    },
  });

  const getAccountCategoryColor = (category: string) => {
    const colors = {
      ACTIVO: "bg-green-100 text-green-800",
      PASIVO: "bg-red-100 text-red-800",
      PATRIMONIO: "bg-blue-100 text-blue-800",
      INGRESO: "bg-purple-100 text-purple-800",
      GASTO: "bg-orange-100 text-orange-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getEntryStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Borrador" },
      posted: { variant: "default" as const, label: "Contabilizado" },
      cancelled: { variant: "destructive" as const, label: "Anulado" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Contabilidad</h1>
          <p className="text-gray-600">Sistema completo conforme a estándares DGII</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeDGIIMutation.mutate()}
            variant="outline"
            disabled={initializeDGIIMutation.isPending}
          >
            <Building className="h-4 w-4 mr-2" />
            Inicializar Plan DGII
          </Button>
          <Button
            onClick={() => exportAccountsMutation.mutate()}
            variant="outline"
            disabled={exportAccountsMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chart-of-accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chart-of-accounts" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Plan de Cuentas
          </TabsTrigger>
          <TabsTrigger value="journal-entries" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Asientos Contables
          </TabsTrigger>
          <TabsTrigger value="financial-reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes Financieros
          </TabsTrigger>
          <TabsTrigger value="dgii-compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cumplimiento DGII
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análisis
          </TabsTrigger>
        </TabsList>

        {/* Plan de Cuentas */}
        <TabsContent value="chart-of-accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Plan de Cuentas DGII
              </CardTitle>
              <CardDescription>
                Estructura jerárquica de cuentas conforme a estándares de la DGII (códigos de 6 dígitos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código, nombre o descripción..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    <SelectItem value="ACTIVO">Activos</SelectItem>
                    <SelectItem value="PASIVO">Pasivos</SelectItem>
                    <SelectItem value="PATRIMONIO">Patrimonio</SelectItem>
                    <SelectItem value="INGRESO">Ingresos</SelectItem>
                    <SelectItem value="GASTO">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accounts Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código DGII</TableHead>
                      <TableHead>Nombre de Cuenta</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Subcategoría</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Saldo Actual</TableHead>
                      <TableHead>Transacciones</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Cargando cuentas...
                        </TableCell>
                      </TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No hay cuentas configuradas. Inicializa el plan de cuentas DGII.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono">{account.dgiiCode || account.code}</TableCell>
                          <TableCell>
                            <div className={`${account.level > 1 ? `ml-${(account.level - 1) * 4}` : ''}`}>
                              {account.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getAccountCategoryColor(account.category)}>
                              {account.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{account.subcategory}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Nivel {account.level}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            RD$ {parseFloat(account.currentBalance || "0").toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {account.allowTransactions ? (
                              <Badge variant="default">Permitidas</Badge>
                            ) : (
                              <Badge variant="secondary">Solo consulta</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {account.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">Activa</Badge>
                            ) : (
                              <Badge variant="secondary">Inactiva</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-5 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {accounts.filter(a => a.category === 'ACTIVO').length}
                    </div>
                    <div className="text-sm text-gray-600">Cuentas de Activo</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {accounts.filter(a => a.category === 'PASIVO').length}
                    </div>
                    <div className="text-sm text-gray-600">Cuentas de Pasivo</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {accounts.filter(a => a.category === 'PATRIMONIO').length}
                    </div>
                    <div className="text-sm text-gray-600">Cuentas de Patrimonio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {accounts.filter(a => a.category === 'INGRESO').length}
                    </div>
                    <div className="text-sm text-gray-600">Cuentas de Ingreso</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {accounts.filter(a => a.category === 'GASTO').length}
                    </div>
                    <div className="text-sm text-gray-600">Cuentas de Gasto</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entries */}
        <TabsContent value="journal-entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Asientos Contables
              </CardTitle>
              <CardDescription>
                Registro de movimientos contables con partida doble y documentos de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Asiento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Cargando asientos contables...
                        </TableCell>
                      </TableRow>
                    ) : journalEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-gray-500">
                            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No hay asientos contables registrados
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      journalEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                          <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="font-mono text-right">
                            RD$ {parseFloat(entry.totalAmount || "0").toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getEntryStatusBadge(entry.status)}</TableCell>
                          <TableCell>
                            {entry.sourceModule && (
                              <Badge variant="outline">{entry.sourceModule.toUpperCase()}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.documents && entry.documents.length > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {entry.documents.length}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reportes Financieros
              </CardTitle>
              <CardDescription>
                Balance General, Estado de Resultados y Flujo de Efectivo conforme a DGII
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Report Generation Controls */}
              <div className="flex gap-4 mb-6">
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BALANCE_GENERAL">Balance General</SelectItem>
                    <SelectItem value="ESTADO_RESULTADOS">Estado de Resultados</SelectItem>
                    <SelectItem value="FLUJO_EFECTIVO">Flujo de Efectivo</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-48"
                />
                <Button
                  onClick={() => generateReportMutation.mutate({
                    reportType,
                    startDate: `${selectedPeriod}-01`,
                    endDate: new Date(selectedPeriod + '-01').toISOString().split('T')[0]
                  })}
                  disabled={generateReportMutation.isPending}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>

              {/* Reports List */}
              <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Reporte</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Fecha Generación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No hay reportes financieros generados
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      financialReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant="outline">{report.reportType.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>{report.reportName}</TableCell>
                          <TableCell>{report.periodo}</TableCell>
                          <TableCell>{format(new Date(report.generatedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Generado
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {report.fileName && (
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DGII Compliance */}
        <TabsContent value="dgii-compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cumplimiento DGII
              </CardTitle>
              <CardDescription>
                Seguimiento de ITBIS, retenciones y reportes requeridos por la DGII
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo Transacción</TableHead>
                      <TableHead>NCF</TableHead>
                      <TableHead>Monto ITBIS</TableHead>
                      <TableHead>Período Reporte</TableHead>
                      <TableHead>Estado DGII</TableHead>
                      <TableHead>Fecha Reporte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dgiiCompliance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No hay registros de cumplimiento DGII
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dgiiCompliance.map((compliance) => (
                        <TableRow key={compliance.id}>
                          <TableCell>
                            <Badge variant="outline">{compliance.transactionType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{compliance.ncf || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-right">
                            RD$ {parseFloat(compliance.itbisAmount || "0").toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{compliance.reportPeriod}</TableCell>
                          <TableCell>
                            {compliance.isReported ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Reportado
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {compliance.isReported ? format(new Date(), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Activos:</span>
                    <span className="font-bold text-green-600">RD$ 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pasivos:</span>
                    <span className="font-bold text-red-600">RD$ 0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patrimonio:</span>
                    <span className="font-bold text-blue-600">RD$ 0.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  Gráfico de distribución de cuentas por categoría
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencias Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  Análisis de tendencias de ingresos y gastos
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}