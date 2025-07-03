import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Warehouse, Plus, Search, Edit, Package, 
  MapPin, AlertCircle, CheckCircle, XCircle
} from "lucide-react";

// Simple Warehouse Schema
const warehouseSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  location: z.string().min(1, "La ubicación es requerida"),
  type: z.enum(["main", "regional", "temporary", "finished_goods", "raw_materials", "assets"]),
  isActive: z.boolean().default(true)
});

const WarehouseManagementSimple = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['/api/warehouses'],
  });

  // Form
  const form = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: "",
      name: "",
      location: "",
      type: "main" as const,
      isActive: true
    }
  });

  // Mutations
  const createWarehouseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating warehouse with data:", data);
      return await apiRequest('/api/warehouses', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setShowDialog(false);
      form.reset();
      toast({ title: "Almacén creado exitosamente" });
    },
    onError: (error: any) => {
      console.error("Error creating warehouse:", error);
      toast({ 
        title: "Error al crear almacén", 
        description: error.message || "Error desconocido", 
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: any) => {
    console.log("Form submitted with data:", data);
    createWarehouseMutation.mutate(data);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      main: "Principal",
      regional: "Regional", 
      temporary: "Temporal",
      finished_goods: "Productos Terminados",
      raw_materials: "Materia Prima",
      assets: "Activos"
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Gestión de Almacenes" />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Almacenes</h1>
            <p className="text-muted-foreground">
              Administra almacenes, inventario y movimientos
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Almacén
          </Button>
        </div>

        {/* Warehouses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Almacenes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando almacenes...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(warehouses || []).length > 0 ? (
                    (warehouses || []).map((warehouse: any) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.code}</TableCell>
                        <TableCell>{warehouse.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {warehouse.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeLabel(warehouse.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {warehouse.isActive ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingWarehouse(warehouse);
                              form.reset(warehouse);
                              setShowDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No hay almacenes registrados</p>
                          <Button variant="outline" onClick={() => setShowDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear primer almacén
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
              </DialogTitle>
              <DialogDescription>
                Configure los datos básicos del almacén
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="ALM-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Almacén Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Santo Domingo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main">Principal</SelectItem>
                          <SelectItem value="regional">Regional</SelectItem>
                          <SelectItem value="temporary">Temporal</SelectItem>
                          <SelectItem value="finished_goods">Productos Terminados</SelectItem>
                          <SelectItem value="raw_materials">Materia Prima</SelectItem>
                          <SelectItem value="assets">Activos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowDialog(false);
                    setEditingWarehouse(null);
                    form.reset();
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createWarehouseMutation.isPending}
                  >
                    {createWarehouseMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WarehouseManagementSimple;