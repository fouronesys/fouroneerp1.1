import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, TrendingUp, TrendingDown, Package, Plus, Calendar, Filter, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product, Warehouse } from "@shared/schema";

const movementSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  type: z.enum(["in", "out", "transfer", "adjustment"]),
  quantity: z.string().min(1, "La cantidad es requerida"),
  reason: z.string().min(1, "La razón es requerida"),
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface InventoryMovement {
  id: number;
  productId: number;
  warehouseId: number;
  type: string;
  quantity: string;
  reason: string;
  notes?: string;
  createdAt: Date;
  product?: Product;
  warehouse?: Warehouse;
}

export default function Movements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: movements, isLoading } = useQuery<InventoryMovement[]>({
    queryKey: ["/api/inventory/movements"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      type: "in",
      quantity: "",
      reason: "",
      notes: "",
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      const payload = {
        ...data,
        productId: parseInt(data.productId),
        warehouseId: parseInt(data.warehouseId),
        quantity: parseInt(data.quantity),
      };
      await apiRequest("/api/inventory/movements", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario ha sido registrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento.",
        variant: "destructive",
      });
    },
  });

  const filteredMovements = movements?.filter(movement => {
    const matchesSearch = movement.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || movement.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowDownCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "out":
        return <ArrowUpCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "transfer":
        return <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "adjustment":
        return <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    const colors = {
      in: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      out: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      adjustment: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
    };

    const labels = {
      in: "Entrada",
      out: "Salida",
      transfer: "Transferencia",
      adjustment: "Ajuste",
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.in}>
        {labels[type as keyof typeof labels] || "Desconocido"}
      </Badge>
    );
  };

  const getTodayMovements = () => {
    const today = new Date().toDateString();
    return movements?.filter(movement => 
      new Date(movement.createdAt).toDateString() === today
    ).length || 0;
  };

  const getInMovements = () => {
    return movements?.filter(movement => movement.type === "in").length || 0;
  };

  const getOutMovements = () => {
    return movements?.filter(movement => movement.type === "out").length || 0;
  };

  const onSubmit = (data: MovementFormData) => {
    createMovementMutation.mutate(data);
  };

  const handleNewMovement = () => {
    form.reset();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <Header title="Movimientos de Inventario" subtitle="Gestiona entradas, salidas y transferencias" />
        <div className="p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando movimientos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <Header title="Movimientos de Inventario" subtitle="Gestiona entradas, salidas y transferencias" />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Movimientos
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {movements?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Entradas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {getInMovements()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Salidas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    {getOutMovements()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hoy
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {getTodayMovements()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por producto o razón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="in">Entradas</SelectItem>
                <SelectItem value="out">Salidas</SelectItem>
                <SelectItem value="transfer">Transferencias</SelectItem>
                <SelectItem value="adjustment">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleNewMovement} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Movements List */}
        {filteredMovements.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay movimientos
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comienza registrando tu primer movimiento de inventario
              </p>
              <Button onClick={handleNewMovement} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Movimiento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredMovements.map((movement) => (
              <Card key={movement.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getMovementTypeIcon(movement.type)}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {movement.product?.name || `Producto #${movement.productId}`}
                        </CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Razón: {movement.reason}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {getMovementTypeBadge(movement.type)}
                      <span className={`text-lg font-bold ${
                        movement.type === "in" || movement.type === "adjustment" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {movement.type === "out" ? "-" : "+"}{movement.quantity}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Package className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      Almacén: {movement.warehouse?.name || `Almacén #${movement.warehouseId}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{new Date(movement.createdAt).toLocaleString('es-DO')}</span>
                  </div>
                  
                  {movement.notes && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Notas: {movement.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Movement Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Almacén *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un almacén" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses?.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Movimiento *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Entrada</SelectItem>
                            <SelectItem value="out">Salida</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="adjustment">Ajuste</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón *</FormLabel>
                      <FormControl>
                        <Input placeholder="Compra, venta, devolución, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información adicional..." 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMovementMutation.isPending}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    Registrar Movimiento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}