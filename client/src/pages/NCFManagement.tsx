import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Plus, FileText, AlertTriangle, CheckCircle, Download, Search, Eye, Edit, Trash2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";

const ncfBatchSchema = z.object({
  tipo: z.enum(['B01', 'B02', 'B14', 'B15', 'E31', 'E32', 'E33', 'E34', 'E41', 'E43', 'E44', 'E45']),
  inicio: z.number().min(1),
  fin: z.number().min(1),
  vencimiento: z.string().optional(), // Some NCF types don't require expiration date
}).refine(data => data.fin >= data.inicio, {
  message: "El número final debe ser mayor o igual al inicial",
  path: ["fin"],
}).refine(data => {
  // Only certain NCF types require expiration dates (NOT B02 - Consumer Final)
  const typesRequiringExpiration = ['B01', 'B14', 'B15'];
  if (typesRequiringExpiration.includes(data.tipo) && !data.vencimiento) {
    return false;
  }
  return true;
}, {
  message: "Este tipo de NCF requiere fecha de vencimiento",
  path: ["vencimiento"],
});

type NCFBatchFormData = z.infer<typeof ncfBatchSchema>;

// Schema for editing existing NCF batches
const editNCFBatchSchema = z.object({
  maxSequence: z.number().min(1),
  isActive: z.boolean(),
  vencimiento: z.string().optional(),
}).refine(data => {
  // Validation logic will be handled in the form component
  return true;
});

type EditNCFBatchFormData = z.infer<typeof editNCFBatchSchema>;

interface NCFType {
  codigo: string;
  descripcion: string;
  aplicaCredito: boolean;
  aplicaConsumidor: boolean;
}

interface NCFBatch {
  id: number;
  tipo: string;
  prefijo: string;
  descripcion: string;
  inicio: number;
  fin: number;
  ultimo_usado: number;
  vencimiento: string;
  estado: string;
  disponibles: number;
  usados: number;
  porcentajeUso: number;
  createdAt: string;
}

interface NCFUsado {
  id: number;
  ncf: string;
  tipo: string;
  documentoTipo: string;
  fecha: string;
  monto: string;
  rncCliente: string;
  nombreCliente: string;
  estado: string;
}

const ncfTypes: NCFType[] = [
  { codigo: 'B01', descripcion: 'Facturas con Valor Fiscal', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'B02', descripcion: 'Facturas Consumidor Final', aplicaCredito: false, aplicaConsumidor: true },
  { codigo: 'B14', descripcion: 'Facturas Gubernamentales', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'B15', descripcion: 'Facturas para Exportaciones', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E31', descripcion: 'Facturas de Compras', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E32', descripcion: 'Facturas para Gastos Menores', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E33', descripcion: 'Facturas de Gastos', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E34', descripcion: 'Notas de Débito', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E41', descripcion: 'Comprobantes de Compras', aplicaCredito: false, aplicaConsumidor: false },
  { codigo: 'E43', descripcion: 'Notas de Crédito que afectan al NCF Fiscal', aplicaCredito: true, aplicaConsumidor: false },
  { codigo: 'E44', descripcion: 'Notas de Crédito al Consumidor Final', aplicaCredito: false, aplicaConsumidor: true },
  { codigo: 'E45', descripcion: 'Comprobantes de Anulación', aplicaCredito: false, aplicaConsumidor: false }
];

// Edit NCF Form Component
function EditNCFForm({ batch, onSuccess, onCancel }: {
  batch: NCFBatch;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const editForm = useForm<EditNCFBatchFormData>({
    resolver: zodResolver(editNCFBatchSchema),
    defaultValues: {
      maxSequence: batch.fin,
      isActive: batch.estado === 'active',
      vencimiento: batch.vencimiento || '',
    },
  });

  const editMutation = useMutation({
    mutationFn: (updates: EditNCFBatchFormData) => {
      const transformedData = {
        type: batch.tipo,
        series: batch.prefijo || '001',
        rangeStart: batch.inicio,
        rangeEnd: updates.maxSequence,
        expirationDate: updates.vencimiento || null,
        description: `Secuencia ${batch.tipo} del ${batch.inicio} al ${updates.maxSequence}`,
        isActive: updates.isActive,
      };
      
      return apiRequest(`/api/fiscal/ncf-sequences/${batch.id}`, {
        method: "PUT",
        body: transformedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fiscal/ncf-sequences"] });
      toast({
        title: "Éxito",
        description: "Lote de NCF actualizado correctamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el lote de NCF",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditNCFBatchFormData) => {
    editMutation.mutate(data);
  };

  // Check if this NCF type requires expiration date
  const typesRequiringExpiration = ['B01', 'B14', 'B15'];
  const requiresExpiration = typesRequiringExpiration.includes(batch.tipo);

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4">
        {/* Read-only information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-sm font-medium">Tipo de NCF</Label>
            <p className="text-sm">{batch.tipo} - {ncfTypes.find(t => t.codigo === batch.tipo)?.descripcion}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Rango Inicial</Label>
            <p className="text-sm">{batch.inicio} - {batch.ultimo_usado > 0 ? batch.ultimo_usado : 'Sin usar'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">NCFs Usados</Label>
            <p className="text-sm">{batch.usados} de {batch.fin - batch.inicio + 1}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Porcentaje de Uso</Label>
            <p className="text-sm">{batch.porcentajeUso}%</p>
          </div>
        </div>

        {/* Editable fields */}
        <FormField
          control={editForm.control}
          name="maxSequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número Final del Rango</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={Math.max(batch.ultimo_usado + 1, batch.inicio)}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Debe ser mayor que el último NCF usado ({batch.ultimo_usado})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {requiresExpiration && (
          <FormField
            control={editForm.control}
            name="vencimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormDescription>
                  Los NCF tipo {batch.tipo} requieren fecha de vencimiento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={editForm.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Estado del Lote</FormLabel>
                <FormDescription>
                  Desactivar impedirá el uso de este lote para nuevas facturas
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Advertencia Fiscal</AlertTitle>
          <AlertDescription>
            La modificación de lotes NCF activos puede afectar la secuencia fiscal. 
            Solo proceda si tiene autorización de DGII y comprende las implicaciones.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={editMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={editMutation.isPending}
          >
            {editMutation.isPending ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function NCFManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<NCFBatch | null>(null);
  const [editingBatch, setEditingBatch] = useState<NCFBatch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewNCFs, setPreviewNCFs] = useState<string[]>([]);

  const { data: ncfBatches = [], isLoading } = useQuery<NCFBatch[]>({
    queryKey: ["/api/fiscal/ncf-sequences"],
  });

  const { data: ncfUsados = [], isLoading: isLoadingUsed } = useQuery<NCFUsado[]>({
    queryKey: ["/api/fiscal/ncf-used"],
  });

  const createMutation = useMutation({
    mutationFn: (data: NCFBatchFormData) => {
      // Transform data to match backend expectations
      const transformedData = {
        type: data.tipo,
        series: '001',
        rangeStart: data.inicio,
        rangeEnd: data.fin,
        currentNumber: data.inicio,
        expirationDate: data.vencimiento || null,
        isActive: true,
        description: `Secuencia ${data.tipo} del ${data.inicio} al ${data.fin}`
      };
      
      return apiRequest("/api/fiscal/ncf-sequences", {
        method: "POST",
        body: transformedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fiscal/ncf-sequences"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Éxito",
        description: "Lote de NCF creado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el lote de NCF",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting NCF batches
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/fiscal/ncf-sequences/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fiscal/ncf-sequences"] });
      toast({
        title: "Éxito",
        description: "Lote de NCF eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el lote de NCF",
        variant: "destructive",
      });
    },
  });

  const form = useForm<NCFBatchFormData>({
    resolver: zodResolver(ncfBatchSchema),
    defaultValues: {
      tipo: 'B02',
      inicio: 1,
      fin: 500,
      vencimiento: '',
    },
  });

  const selectedNCFType = ncfTypes.find(t => t.codigo === form.watch('tipo'));

  // Watch form values for auto-preview
  const watchedTipo = form.watch('tipo');
  const watchedInicio = form.watch('inicio');
  const watchedFin = form.watch('fin');

  useEffect(() => {
    if (watchedTipo && watchedInicio && watchedFin && watchedInicio <= watchedFin) {
      // Find the last sequence for this NCF type
      const existingSequences = ncfBatches?.filter((seq: NCFBatch) => seq.tipo === watchedTipo) || [];
      let nextNumber = watchedInicio;
      
      if (existingSequences.length > 0) {
        // Get the highest current sequence number for this type
        const lastSequence = existingSequences.reduce((latest: NCFBatch, current: NCFBatch) => {
          return current.ultimo_usado > latest.ultimo_usado ? current : latest;
        });
        nextNumber = Math.max(lastSequence.ultimo_usado + 1, watchedInicio);
      }
      
      // Show only the next available number
      const consecutivo = nextNumber.toString().padStart(8, '0');
      const nextNCF = `${watchedTipo}${consecutivo}`;
      
      setPreviewNCFs([nextNCF]);
    } else {
      setPreviewNCFs([]);
    }
  }, [watchedTipo, watchedInicio, watchedFin, ncfBatches]);

  const getStatusBadge = (batch: NCFBatch) => {
    if (batch.estado === 'inactive') {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    // If no expiration date, show as active (e.g., B02 types)
    if (!batch.vencimiento) {
      return <Badge variant="default">Activo</Badge>;
    }
    
    const now = new Date();
    const vencimiento = new Date(batch.vencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    
    if (diasRestantes <= 5) {
      return <Badge variant="destructive">Vence en {diasRestantes} días</Badge>;
    }
    
    if (diasRestantes <= 15) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">
        Vence en {diasRestantes} días
      </Badge>;
    }
    
    if (diasRestantes <= 30) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">
        Vence en {diasRestantes} días
      </Badge>;
    }
    
    return <Badge variant="default">Activo</Badge>;
  };

  const getUsageAlert = (batch: NCFBatch) => {
    if (batch.porcentajeUso >= 90) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>NCFs casi agotados</AlertTitle>
          <AlertDescription>
            El lote {batch.tipo} tiene solo {batch.disponibles} NCFs disponibles ({100 - batch.porcentajeUso}% restante)
          </AlertDescription>
        </Alert>
      );
    }
    
    if (batch.porcentajeUso >= 75) {
      return (
        <Alert className="mb-4 border-orange-500">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertTitle>NCFs en uso alto</AlertTitle>
          <AlertDescription>
            El lote {batch.tipo} ha usado el {batch.porcentajeUso}% de los NCFs disponibles
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  // Handle edit batch
  const handleEditBatch = (batch: NCFBatch) => {
    setEditingBatch(batch);
    setIsEditOpen(true);
  };

  // Handle delete batch
  const handleDeleteBatch = (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este lote de NCF? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredBatches = (ncfBatches || []).filter(batch =>
    batch.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 h-screen overflow-y-auto max-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de NCF</h1>
        <p className="text-muted-foreground">
          Administre los Números de Comprobantes Fiscales según las regulaciones de la DGII
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ncfBatches || []).filter(b => b.estado === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {(ncfBatches || []).length} lotes totales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NCFs Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ncfBatches || []).reduce((sum, b) => sum + b.disponibles, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              En todos los lotes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NCFs Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ncfBatches || []).reduce((sum, b) => sum + b.usados, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Este período fiscal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Próximo Vencimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ncfBatches || []).length > 0 
                ? (() => {
                    const diasVencimiento = (ncfBatches || [])
                      .filter(b => b.vencimiento && b.vencimiento !== '')
                      .map(b => {
                        const dias = Math.ceil((new Date(b.vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return dias > 0 ? dias : 0;
                      });
                    
                    if (diasVencimiento.length === 0) {
                      return "Sin vencimiento";
                    }
                    
                    const minDias = Math.min(...diasVencimiento);
                    return minDias > 0 ? `${minDias} días` : "Vencido";
                  })()
                : "0 días"}
            </div>
            <p className="text-xs text-muted-foreground">
              Revise lotes por vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(ncfBatches || []).map(batch => getUsageAlert(batch))}

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches">Lotes de NCF</TabsTrigger>
          <TabsTrigger value="used">NCFs Usados</TabsTrigger>
          <TabsTrigger value="types">Tipos de NCF</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar lotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Lote NCF
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Lote de NCF</DialogTitle>
                  <DialogDescription>
                    Configure un nuevo lote de números de comprobantes fiscales
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de NCF</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ncfTypes.map((tipo) => (
                                <SelectItem key={tipo.codigo} value={tipo.codigo}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{tipo.codigo}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {tipo.descripcion}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Seleccione el tipo de comprobante fiscal según la operación
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {selectedNCFType && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                        <span className="text-sm font-medium block">{selectedNCFType.descripcion}</span>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {selectedNCFType.aplicaCredito && "✓ Aplica para crédito fiscal"}
                          {selectedNCFType.aplicaConsumidor && "✓ Para consumidor final"}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Inicial</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número Final</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="500"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="vencimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Fecha límite para usar estos NCFs según DGII
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {previewNCFs.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Vista previa de NCFs:</h4>
                        <div className="space-y-1">
                          {previewNCFs.map((ncf, index) => (
                            <p key={index} className="text-sm font-mono text-muted-foreground">
                              {ncf}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total: {form.watch('fin') - form.watch('inicio') + 1} NCFs
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateOpen(false);
                          form.reset();
                          setPreviewNCFs([]);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creando..." : "Crear Lote"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lotes de NCF Registrados</CardTitle>
              <CardDescription>
                Administre y supervise todos los lotes de NCF de su empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Cargando lotes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Rango</TableHead>
                      <TableHead>Usados</TableHead>
                      <TableHead>Disponibles</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{batch.tipo}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {batch.descripcion}
                        </TableCell>
                        <TableCell>
                          {batch.inicio.toString().padStart(11, '0')} - {batch.fin.toString().padStart(11, '0')}
                        </TableCell>
                        <TableCell>{batch.usados.toLocaleString()}</TableCell>
                        <TableCell>{batch.disponibles.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className={`h-2.5 rounded-full ${
                                  batch.porcentajeUso >= 90 ? 'bg-red-600' :
                                  batch.porcentajeUso >= 75 ? 'bg-orange-600' :
                                  batch.porcentajeUso >= 50 ? 'bg-yellow-600' :
                                  'bg-green-600'
                                }`}
                                style={{ width: `${batch.porcentajeUso}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{batch.porcentajeUso}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {batch.vencimiento ? format(new Date(batch.vencimiento), 'dd/MM/yyyy') : 'No aplica'}
                        </TableCell>
                        <TableCell>{getStatusBadge(batch)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedBatch(batch)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBatch(batch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="used" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NCFs Utilizados</CardTitle>
              <CardDescription>
                Historial de comprobantes fiscales emitidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>RNC Cliente</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ncfUsados && ncfUsados.length > 0 ? (
                    ncfUsados.map((ncf) => (
                      <TableRow key={ncf.id}>
                        <TableCell className="font-mono">{ncf.ncf}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ncf.tipo}</Badge>
                        </TableCell>
                        <TableCell>{ncf.documentoTipo}</TableCell>
                        <TableCell>{format(new Date(ncf.fecha), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{ncf.rncCliente || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {ncf.nombreCliente || 'Consumidor Final'}
                        </TableCell>
                        <TableCell>RD$ {parseFloat(ncf.monto).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={ncf.estado === 'used' ? 'default' : 'secondary'}>
                            {ncf.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay NCFs utilizados registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de NCF según DGII</CardTitle>
              <CardDescription>
                Referencia de los tipos de comprobantes fiscales válidos en República Dominicana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {ncfTypes.map((tipo) => (
                  <div key={tipo.codigo} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className="text-lg px-3 py-1">{tipo.codigo}</Badge>
                        <h3 className="font-medium">{tipo.descripcion}</h3>
                      </div>
                      <div className="flex gap-4 mt-2">
                        {tipo.aplicaCredito && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Aplica para crédito fiscal</span>
                          </div>
                        )}
                        {tipo.aplicaConsumidor && (
                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Para consumidor final</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Details Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Lote NCF</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <p className="text-lg font-medium">{selectedBatch.tipo}</p>
                </div>
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedBatch)}</div>
                </div>
              </div>
              
              <div>
                <Label>Descripción</Label>
                <p className="text-sm text-muted-foreground">{selectedBatch.descripcion}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rango</Label>
                  <p className="font-mono">
                    {selectedBatch.tipo}{selectedBatch.inicio.toString().padStart(11, '0')} -
                    {selectedBatch.tipo}{selectedBatch.fin.toString().padStart(11, '0')}
                  </p>
                </div>
                <div>
                  <Label>Total NCFs</Label>
                  <p>{(selectedBatch.fin - selectedBatch.inicio + 1).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Usados</Label>
                  <p className="text-lg font-medium">{selectedBatch.usados.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Disponibles</Label>
                  <p className="text-lg font-medium">{selectedBatch.disponibles.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Último Usado</Label>
                  <p className="font-mono">
                    {selectedBatch.tipo}{selectedBatch.ultimo_usado.toString().padStart(11, '0')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Progreso de Uso</Label>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                    <div
                      className={`h-4 rounded-full ${
                        selectedBatch.porcentajeUso >= 90 ? 'bg-red-600' :
                        selectedBatch.porcentajeUso >= 75 ? 'bg-orange-600' :
                        selectedBatch.porcentajeUso >= 50 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${selectedBatch.porcentajeUso}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBatch.porcentajeUso}% utilizado
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Creación</Label>
                  <p>{format(new Date(selectedBatch.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Fecha de Vencimiento</Label>
                  <p>{selectedBatch.vencimiento ? format(new Date(selectedBatch.vencimiento), 'dd/MM/yyyy') : 'No aplica'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit NCF Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Lote NCF</DialogTitle>
            <DialogDescription>
              Modifique la configuración del lote de NCF existente
            </DialogDescription>
          </DialogHeader>
          
          {editingBatch && (
            <EditNCFForm 
              batch={editingBatch} 
              onSuccess={() => {
                setIsEditOpen(false);
                setEditingBatch(null);
              }}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingBatch(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}