import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertWarehouseSchema, type Warehouse } from "@shared/schema";
import { z } from "zod";
import { Plus, Building2, MapPin, User, Edit, Trash2, Package } from "lucide-react";

const warehouseSchema = insertWarehouseSchema.extend({
  name: z.string().min(1, "Nombre es requerido"),
  location: z.string().optional(),
  manager: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function Warehouses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      manager: "",
      isActive: true,
    },
  });

  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      await apiRequest(`/api/warehouses`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Almacén creado",
        description: "El almacén ha sido creado exitosamente.",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el almacén.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      await apiRequest(`/api/warehouses/${editingWarehouse?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Almacén actualizado",
        description: "El almacén ha sido actualizado exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingWarehouse(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el almacén.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/warehouses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Almacén eliminado",
        description: "El almacén ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el almacén.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      location: warehouse.location || "",
      manager: warehouse.manager || "",
      isActive: warehouse.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleNewWarehouse = () => {
    setEditingWarehouse(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getProductCountForWarehouse = (warehouseId: number) => {
    if (!products || !Array.isArray(products)) return 0;
    return products.filter((p: any) => p.warehouseId === warehouseId).length;
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <Header title="Almacenes" subtitle="Gestiona tus ubicaciones de inventario" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando almacenes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <Header title="Almacenes" subtitle="Gestiona tus ubicaciones de inventario" />
      
      <div className="p-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Almacenes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {warehouses?.filter(w => w.isActive).length || 0} activos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Asignados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(products && Array.isArray(products)) ? products.filter((p: any) => p.warehouseId).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {(products && Array.isArray(products)) ? products.length : 0} productos totales
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(products && Array.isArray(products)) ? products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">unidades en inventario</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Almacenes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Almacenes</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewWarehouse}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Almacén
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingWarehouse 
                        ? "Modifica los datos del almacén seleccionado."
                        : "Crea un nuevo almacén para organizar tu inventario."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Almacén*</Label>
                      <Input
                        id="name"
                        placeholder="Ej: Almacén Principal"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        placeholder="Ej: Zona Industrial, Santo Domingo"
                        {...form.register("location")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manager">Encargado</Label>
                      <Input
                        id="manager"
                        placeholder="Nombre del encargado"
                        {...form.register("manager")}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={form.watch("isActive")}
                        onCheckedChange={(checked) => form.setValue("isActive", checked)}
                      />
                      <Label htmlFor="isActive">Almacén activo</Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {editingWarehouse ? "Actualizar" : "Crear"} Almacén
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {warehouses && warehouses.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Encargado</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                          {warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <MapPin className="mr-1 h-3 w-3" />
                          {warehouse.location || "Sin ubicación"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <User className="mr-1 h-3 w-3" />
                          {warehouse.manager || "Sin asignar"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getProductCountForWarehouse(warehouse.id)} productos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={warehouse.isActive ? "default" : "secondary"}
                          className={warehouse.isActive 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }
                        >
                          {warehouse.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(warehouse.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                  No hay almacenes
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Comienza creando tu primer almacén para organizar tu inventario.
                </p>
                <Button className="mt-4" onClick={handleNewWarehouse}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Almacén
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}