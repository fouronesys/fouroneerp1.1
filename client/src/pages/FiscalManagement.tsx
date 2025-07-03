import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, FileText, Download, Upload, Calendar as CalendarIcon, 
  Receipt, Building2, TrendingUp, AlertTriangle, CheckCircle, X, Eye, Edit,
  Calculator, FileSpreadsheet, Shield, RefreshCw, Database, Settings
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ncfSequenceSchema = z.object({
  type: z.string().min(1, "Tipo de NCF requerido"),
  series: z.string().min(1, "Serie requerida"),
  rangeStart: z.number().min(1, "Rango inicial debe ser mayor a 0"),
  rangeEnd: z.number().min(1, "Rango final debe ser mayor a 0"),
  currentNumber: z.number().min(1, "Número actual debe ser mayor a 0"),
  expirationDate: z.date(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
}).refine((data) => data.rangeEnd > data.rangeStart, {
  message: "El rango final debe ser mayor al inicial",
  path: ["rangeEnd"]
}).refine((data) => data.currentNumber >= data.rangeStart && data.currentNumber <= data.rangeEnd, {
  message: "El número actual debe estar dentro del rango definido",
  path: ["currentNumber"]
});

const reportConfigSchema = z.object({
  type: z.enum(["606", "607"]),
  period: z.string().min(1, "Período requerido"),
  year: z.string().min(4, "Año requerido"),
  includeZeroValues: z.boolean().default(false),
  format: z.enum(["excel", "txt"]).default("excel"),
});

type NCFSequenceFormData = z.infer<typeof ncfSequenceSchema>;
type ReportConfigFormData = z.infer<typeof reportConfigSchema>;

// Mapping de tipos NCF a series automáticas
const NCF_SERIES_MAP: Record<string, string> = {
  "B01": "001", // Factura de Crédito Fiscal
  "B02": "001", // Factura de Consumo
  "B03": "001", // Nota de Débito
  "B04": "001", // Nota de Crédito
  "B11": "001", // Factura de Régimen Especial
  "B12": "001", // Factura Gubernamental
  "B13": "001", // Factura de Exportación
  "B14": "001", // Factura para Regímenes Especiales
  "B15": "001", // Comprobante de Compras
};

// DGII Registry Management Component
function DGIIRegistryManagement() {
  const [searchRnc, setSearchRnc] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleRNCSearch = async () => {
    if (!searchRnc.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/dgii/rnc-lookup?rnc=${searchRnc}`);
      const data = await response.json();
      setSearchResult(data);
    } catch (error) {
      console.error("Error searching RNC:", error);
      setSearchResult({ error: "Error al buscar RNC" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda RNC/Cédula DGII
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ingrese RNC o cédula..."
              value={searchRnc}
              onChange={(e) => setSearchRnc(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleRNCSearch} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          
          {searchResult && (
            <div className="mt-4 p-4 border rounded-lg">
              {searchResult.error ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{searchResult.error}</span>
                </div>
              ) : searchResult.found ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">RNC encontrado en el registro DGII</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-gray-700">RNC:</span>
                      <span className="ml-2 font-mono">{searchResult.rnc}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <Badge 
                        variant={searchResult.status === "ACTIVO" ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {searchResult.status}
                      </Badge>
                    </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Razón Social:</span>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900 text-sm">
                          {searchResult.name}
                        </div>
                      </div>
                      {searchResult.businessName && searchResult.businessName !== searchResult.name && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Nombre Comercial:</span>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-gray-900 text-sm">
                            {searchResult.businessName}
                          </div>
                        </div>
                      )
                    }
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Régimen:</span>
                      <span className="ml-2 text-sm">{searchResult.regime}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>RNC no encontrado en el registro oficial</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FiscalManagement() {
  const [activeTab, setActiveTab] = useState("ncf-sequences");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reportType, setReportType] = useState<'606' | '607'>('606');
  const [period606, setPeriod606] = useState("");
  const [period607, setPeriod607] = useState("");
  const [isGenerating606, setIsGenerating606] = useState(false);
  const [isGenerating607, setIsGenerating607] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ncfSequences = [], isLoading: sequencesLoading } = useQuery<any[]>({
    queryKey: ['/api/fiscal/ncf-sequences'],
  });

  const { data: fiscalReports = [], isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ['/api/fiscal/reports'],
  });

  const { data: companyInfo } = useQuery({
    queryKey: ['/api/company/info'],
  });

  // Query for DGII analytics data
  const { data: dgiiAnalyticsRaw } = useQuery({
    queryKey: ['/api/fiscal/analytics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const dgiiAnalytics = {
    documentsCount: (dgiiAnalyticsRaw as any)?.documentsCount || 0,
    totalInvoiced: (dgiiAnalyticsRaw as any)?.totalInvoiced || 0,
    complianceRate: (dgiiAnalyticsRaw as any)?.complianceRate || 0,
    reportsSent: (dgiiAnalyticsRaw as any)?.reportsSent || 0
  };

  const ncfSequenceForm = useForm<NCFSequenceFormData>({
    resolver: zodResolver(ncfSequenceSchema),
    defaultValues: {
      type: "",
      series: "001",
      rangeStart: 1,
      rangeEnd: 1000,
      currentNumber: 1,
      expirationDate: new Date(),
      isActive: true,
      description: "",
    },
  });

  // Watch for NCF type changes to auto-assign series
  const selectedNCFType = ncfSequenceForm.watch("type");
  
  // Auto-assign series when NCF type changes
  useEffect(() => {
    if (selectedNCFType && NCF_SERIES_MAP[selectedNCFType]) {
      ncfSequenceForm.setValue("series", NCF_SERIES_MAP[selectedNCFType]);
    }
  }, [selectedNCFType, ncfSequenceForm]);

  const reportForm = useForm<ReportConfigFormData>({
    resolver: zodResolver(reportConfigSchema),
    defaultValues: {
      type: "606",
      period: "",
      year: new Date().getFullYear().toString(),
      includeZeroValues: false,
      format: "excel",
    },
  });

  const createNCFSequenceMutation = useMutation({
    mutationFn: async (data: NCFSequenceFormData) => {
      return await apiRequest("/api/fiscal/ncf-sequences", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/ncf-sequences'] });
      setShowSequenceDialog(false);
      ncfSequenceForm.reset();
      toast({
        title: "Secuencia NCF creada",
        description: "La secuencia NCF ha sido registrada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la secuencia NCF.",
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: ReportConfigFormData) => {
      const response = await fetch("/api/fiscal-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: data.type,
          period: `${data.year}${data.period.padStart(2, '0')}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar reporte");
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Reporte_${variables.type}_${variables.year}${variables.period.padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte generado",
        description: "El reporte DGII ha sido descargado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte fiscal.",
        variant: "destructive",
      });
    },
  });

  const onSubmitNCFSequence = (data: NCFSequenceFormData) => {
    createNCFSequenceMutation.mutate(data);
  };

  const onSubmitReport = (data: ReportConfigFormData) => {
    generateReportMutation.mutate(data);
  };

  if (sequencesLoading || reportsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gestión Fiscal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra secuencias NCF y genera reportes 606/607
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 mb-6">
            <TabsTrigger value="ncf-sequences" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Secuencias NCF</span>
              <span className="sm:hidden">NCF</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Reportes 606/607</span>
              <span className="sm:hidden">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="registry" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Registro RNC</span>
              <span className="sm:hidden">RNC</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Herramienta DGII</span>
              <span className="sm:hidden">DGII</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ncf-sequences" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar secuencias por tipo, serie o estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={showSequenceDialog} onOpenChange={setShowSequenceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Secuencia NCF
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nueva Secuencia NCF</DialogTitle>
                  </DialogHeader>
                  <Form {...ncfSequenceForm}>
                    <form onSubmit={ncfSequenceForm.handleSubmit(onSubmitNCFSequence)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={ncfSequenceForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de NCF</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="B01">B01 - Factura de Crédito Fiscal</SelectItem>
                                  <SelectItem value="B02">B02 - Factura de Consumo</SelectItem>
                                  <SelectItem value="B03">B03 - Nota de Débito</SelectItem>
                                  <SelectItem value="B04">B04 - Nota de Crédito</SelectItem>
                                  <SelectItem value="B11">B11 - Factura de Régimen Especial</SelectItem>
                                  <SelectItem value="B12">B12 - Factura Gubernamental</SelectItem>
                                  <SelectItem value="B13">B13 - Factura de Exportación</SelectItem>
                                  <SelectItem value="B14">B14 - Factura para Regímenes Especiales</SelectItem>
                                  <SelectItem value="B15">B15 - Comprobante de Compras</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={ncfSequenceForm.control}
                          name="series"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Serie/Prefijo</FormLabel>
                              <FormControl>
                                <Input placeholder="001" {...field} readOnly className="bg-gray-50 dark:bg-gray-800" />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Se asigna automáticamente según el tipo NCF
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={ncfSequenceForm.control}
                          name="rangeStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número Inicial</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="1" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Ejemplo: 1 (para 00000001)
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={ncfSequenceForm.control}
                          name="rangeEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número Final</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="1000" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Ejemplo: 1000 (para 00001000)
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={ncfSequenceForm.control}
                        name="currentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Actual</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              Debe estar entre el rango inicial y final
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={ncfSequenceForm.control}
                          name="expirationDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Vencimiento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Seleccionar fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date <= new Date()
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={ncfSequenceForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Estado Activo</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Permitir uso en facturación
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={ncfSequenceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Descripción de la secuencia NCF..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSequenceDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createNCFSequenceMutation.isPending}>
                          {createNCFSequenceMutation.isPending ? "Creando..." : "Crear Secuencia NCF"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Secuencias NCF Configuradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo NCF</TableHead>
                        <TableHead>Serie</TableHead>
                        <TableHead>Rango</TableHead>
                        <TableHead>Número Actual</TableHead>
                        <TableHead>Disponibles</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(ncfSequences) && ncfSequences.length > 0 ? (
                        ncfSequences.map((sequence: any) => (
                          <TableRow key={sequence.id}>
                            <TableCell>
                              <Badge variant="outline">{sequence.type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">{sequence.series}</TableCell>
                            <TableCell className="font-mono">{sequence.rangeStart} - {sequence.rangeEnd}</TableCell>
                            <TableCell className="font-mono">{sequence.currentNumber}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">
                                {sequence.rangeEnd - sequence.currentNumber + 1}
                              </span>
                            </TableCell>
                            <TableCell>
                              {sequence.expirationDate ? format(new Date(sequence.expirationDate), "dd/MM/yyyy") : "Sin fecha"}
                            </TableCell>
                            <TableCell>
                              <Badge className={sequence.isActive 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              }>
                                {sequence.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No hay secuencias NCF configuradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar reportes por tipo, período o año..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Generar Reportes (606/607)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Generar Reporte DGII</DialogTitle>
                    </DialogHeader>
                    <Form {...reportForm}>
                      <form onSubmit={reportForm.handleSubmit(onSubmitReport)} className="space-y-4">
                        <FormField
                          control={reportForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Reporte</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="606">606 - Compras y Servicios</SelectItem>
                                  <SelectItem value="607">607 - Ventas</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={reportForm.control}
                            name="period"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mes</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                                        {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={reportForm.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Año</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="2024" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowReportDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={generateReportMutation.isPending}>
                            {generateReportMutation.isPending ? "Generando..." : "Generar Reporte"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Reportes Generados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(fiscalReports) && fiscalReports.length > 0 ? (
                        fiscalReports.map((report: any) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Badge variant="outline">{report.type}</Badge>
                            </TableCell>
                            <TableCell>{report.period}</TableCell>
                            <TableCell>
                              <Badge className={report.status === 'generated' 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                              }>
                                {report.status === 'generated' ? 'Generado' : 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell>{report.recordCount}</TableCell>
                            <TableCell>RD$ {report.totalAmount?.toLocaleString()}</TableCell>
                            <TableCell>{format(new Date(report.generatedAt), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay reportes generados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registry" className="space-y-6">
            <DGIIRegistryManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {dgiiAnalytics.documentsCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Documentos Fiscales</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        RD$ {dgiiAnalytics.totalInvoiced.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Facturado</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {dgiiAnalytics.complianceRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Cumplimiento</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {dgiiAnalytics.reportsSent}
                      </div>
                      <div className="text-sm text-muted-foreground">Reportes Enviados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">RNC de la Empresa</label>
                  <Input placeholder="130123456" defaultValue="" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Razón Social</label>
                  <Input placeholder="Mi Empresa SRL" defaultValue="" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dirección Fiscal</label>
                  <Textarea placeholder="Calle Principal #123, Ciudad" defaultValue="" />
                </div>
                
                <Button>Guardar Configuración</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}