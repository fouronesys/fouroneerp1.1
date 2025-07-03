import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
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
  FileText, 
  Download, 
  Upload, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DGIIReport {
  id: number;
  tipo: '606' | '607' | 'T-REGISTRO';
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  numeroRegistros: number;
  montoTotal: string;
  itbisTotal: string;
  estado: 'pending' | 'generated' | 'submitted' | 'accepted' | 'rejected';
  generatedAt: string;
  submittedAt?: string;
  checksum?: string;
}

interface ReportSummary {
  tipo: string;
  ultimoPeriodo: string;
  proximoVencimiento: string;
  registrosPendientes: number;
  montoTotal: string;
}

export default function DGIIReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [reportType, setReportType] = useState<'606' | '607' | 'T-REGISTRO'>('606');
  const [generatingReport, setGeneratingReport] = useState(false);

  const { data: reports = [], isLoading } = useQuery<DGIIReport[]>({
    queryKey: ["/api/dgii/reports"],
  });

  const { data: summaries = [] } = useQuery<ReportSummary[]>({
    queryKey: ["/api/dgii/summaries"],
  });

  const generateReportMutation = useMutation({
    mutationFn: (data: { tipo: string; year: string; month: string }) => 
      apiRequest("/api/dgii/reports/generate", {
        method: "POST",
        body: data,
      }),
    onSuccess: (newReport: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dgii/reports"] });
      setGeneratingReport(false);
      toast({
        title: "Éxito",
        description: "Reporte generado correctamente. Descargando archivo...",
      });
      
      // Auto-download the generated report
      setTimeout(() => {
        downloadReportMutation.mutate(newReport.id);
      }, 500);
    },
    onError: (error: any) => {
      setGeneratingReport(false);
      
      // Handle duplicate report error
      if (error.status === 409) {
        toast({
          title: "Reporte ya existe",
          description: "Ya existe un reporte de este tipo para este período. Puedes descargarlo desde la tabla.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Error al generar el reporte",
          variant: "destructive",
        });
      }
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/dgii/reports/${reportId}/download`, {
        method: "GET",
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      return response.blob();
    },
    onSuccess: (blob: Blob, reportId: number) => {
      const report = reports.find(r => r.id === reportId);
      const fileName = `${report?.tipo}_${report?.periodo}.txt`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Éxito",
        description: "Reporte descargado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al descargar el reporte",
        variant: "destructive",
      });
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: (reportId: number) => 
      apiRequest(`/api/dgii/reports/${reportId}/submit`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dgii/reports"] });
      toast({
        title: "Éxito",
        description: "Reporte marcado como enviado a DGII",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al marcar el reporte",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    generateReportMutation.mutate({
      tipo: reportType,
      year: selectedYear,
      month: selectedMonth,
    });
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      generated: { variant: "default", label: "Generado" },
      submitted: { variant: "outline", label: "Enviado" },
      accepted: { variant: "default", label: "Aceptado" },
      rejected: { variant: "destructive", label: "Rechazado" },
    };
    
    const config = statusConfig[estado] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReportIcon = (tipo: string) => {
    switch (tipo) {
      case '606':
        return <Receipt className="h-4 w-4" />;
      case '607':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'T-REGISTRO':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportDescription = (tipo: string) => {
    switch (tipo) {
      case '606':
        return 'Reporte de Comprobantes Fiscales (Ventas)';
      case '607':
        return 'Reporte de Comprobantes Fiscales (Compras)';
      case 'T-REGISTRO':
        return 'Registro de Nómina para TSS';
      default:
        return 'Reporte DGII';
    }
  };

  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="container mx-auto py-6 h-screen overflow-y-auto max-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reportes DGII</h1>
        <p className="text-muted-foreground">
          Genere y administre los reportes fiscales requeridos por la DGII
        </p>
      </div>

      {/* Alert for pending reports */}
      {summaries.some(s => s.registrosPendientes > 0) && (
        <Alert className="mb-6 border-orange-500">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertTitle>Reportes Pendientes</AlertTitle>
          <AlertDescription>
            Tiene reportes pendientes de generar o enviar a la DGII. Revise las fechas límite.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['606', '607', 'T-REGISTRO'].map((tipo) => {
          const summary = summaries.find(s => s.tipo === tipo);
          return (
            <Card key={tipo}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getReportIcon(tipo)}
                    Reporte {tipo}
                  </CardTitle>
                  {summary && summary.registrosPendientes > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Pendiente
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">
                  {getReportDescription(tipo)}
                </p>
                {summary && (
                  <>
                    <p className="text-sm">
                      Último período: <span className="font-medium">{summary.ultimoPeriodo}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {summary.proximoVencimiento}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generar Reportes</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="guide">Guía DGII</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generar Nuevo Reporte</CardTitle>
              <CardDescription>
                Configure los parámetros para generar un reporte fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Tipo de Reporte</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="606">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span>606 - Ventas</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="607">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>607 - Compras</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="T-REGISTRO">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>T-REGISTRO - Nómina</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Mes</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Seleccione mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Seleccione año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Información del Reporte</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Tipo: {getReportDescription(reportType)}</p>
                  <p>• Período: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                  <p>• Formato: Archivo TXT con separador |</p>
                  <p>• Encoding: UTF-8</p>
                </div>
              </div>

              <Button 
                onClick={handleGenerateReport}
                disabled={generatingReport || generateReportMutation.isPending}
                className="w-full"
              >
                {generatingReport ? (
                  <>Generando reporte...</>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reportes</CardTitle>
              <CardDescription>
                Reportes generados y su estado de envío
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Cargando reportes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>ITBIS Total</TableHead>
                      <TableHead>Generado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getReportIcon(report.tipo)}
                            <span className="font-medium">{report.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.periodo.substring(4, 6)}/{report.periodo.substring(0, 4)}
                        </TableCell>
                        <TableCell>{report.numeroRegistros.toLocaleString()}</TableCell>
                        <TableCell>RD$ {parseFloat(report.montoTotal).toLocaleString()}</TableCell>
                        <TableCell>RD$ {parseFloat(report.itbisTotal).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(report.generatedAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{getStatusBadge(report.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadReportMutation.mutate(report.id)}
                              disabled={downloadReportMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {report.estado === 'generated' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => submitReportMutation.mutate(report.id)}
                                disabled={submitReportMutation.isPending}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guía de Reportes DGII</CardTitle>
              <CardDescription>
                Información sobre los reportes fiscales requeridos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Reporte 606 - Comprobantes Fiscales (Ventas)</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Incluye todas las facturas emitidas en el período</p>
                  <p>• Fecha límite: Día 20 del mes siguiente</p>
                  <p>• Formato: T|TipoNCF|NCF|Fecha|RNC_Cliente|MontoTotal|ITBIS|...</p>
                  <p>• Debe incluir checksum al final del archivo</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Reporte 607 - Comprobantes Fiscales (Compras)</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Incluye todas las facturas recibidas de proveedores</p>
                  <p>• Fecha límite: Día 20 del mes siguiente</p>
                  <p>• Formato: E|TipoNCF|NCF|Fecha|RNC_Proveedor|MontoTotal|ITBIS|...</p>
                  <p>• Debe incluir checksum al final del archivo</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">T-REGISTRO - Registro de Nómina TSS</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Incluye todos los empleados activos en el período</p>
                  <p>• Fecha límite: Día 5 del mes siguiente</p>
                  <p>• Formato: Cédula|Nombre|Salario|SFS|AFP|ISR|OtrasRetenciones|Período|</p>
                  <p>• Importante para el cálculo correcto de deducciones</p>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Los reportes deben ser enviados a través del portal de la DGII antes de la fecha límite.
                  El incumplimiento puede resultar en multas y sanciones.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}