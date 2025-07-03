import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Factory, Plus, Calendar, Package, Search, Edit, AlertCircle, Play, 
  Pause, CheckCircle, XCircle, Clock, Wrench, Settings, List, 
  FileText, BarChart3, Trash2, Copy, ChevronRight, Layers,
  GitBranch, Eye, Calculator, Info, Archive
} from "lucide-react";
import type { Product, ProductionOrder, BillOfMaterials, Warehouse } from "@shared/schema";

// BOM Schema
const bomSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  version: z.string().default("1.0"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  items: z.array(z.object({
    componentId: z.string().min(1, "El componente es requerido"),
    quantity: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
    unit: z.string().min(1, "La unidad es requerida"),
    wastePercentage: z.number().min(0).max(100).default(0),
    notes: z.string().optional()
  })).min(1, "Debe agregar al menos un componente")
});

// Production Order Schema
const productionOrderSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  bomId: z.string().optional(),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  scheduledDate: z.string().min(1, "La fecha programada es requerida"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  notes: z.string().optional()
});

type BOMFormData = z.infer<typeof bomSchema>;
type ProductionOrderFormData = z.infer<typeof productionOrderSchema>;

export default function ManufacturingBOM() {
  const [selectedTab, setSelectedTab] = useState("bom");
  const [isBOMDialogOpen, setIsBOMDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // BOM Form
  const bomForm = useForm<BOMFormData>({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      productId: "",
      name: "",
      version: "1.0",
      isActive: true,
      notes: "",
      items: []
    }
  });

  // Production Order Form
  const orderForm = useForm<ProductionOrderFormData>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      warehouseId: "",
      scheduledDate: new Date().toISOString().split('T')[0],
      priority: "medium",
      notes: ""
    }
  });

  // Queries
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: boms, isLoading: bomsLoading } = useQuery<any[]>({
    queryKey: ["/api/manufacturing/boms"],
  });

  const { data: productionOrders, isLoading: ordersLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Get manufactured products only
  const manufacturedProducts = products?.filter(p => p.isManufactured) || [];
  const rawMaterials = products?.filter(p => !p.isManufactured && p.productType !== 'service') || [];

  // BOM Mutations
  const createBOMMutation = useMutation({
    mutationFn: async (data: BOMFormData) => {
      const payload = {
        ...data,
        productId: parseInt(data.productId),
        items: bomItems.map(item => ({
          componentId: parseInt(item.componentId),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          wastePercentage: parseFloat(item.wastePercentage || 0),
          notes: item.notes
        }))
      };
      await apiRequest("/api/manufacturing/boms", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      toast({
        title: "Lista de materiales creada",
        description: "La lista de materiales ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/boms"] });
      setIsBOMDialogOpen(false);
      bomForm.reset();
      setBomItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la lista de materiales.",
        variant: "destructive",
      });
    },
  });

  // Production Order Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: ProductionOrderFormData) => {
      const payload = {
        ...data,
        productId: parseInt(data.productId),
        bomId: data.bomId ? parseInt(data.bomId) : undefined,
        warehouseId: parseInt(data.warehouseId)
      };
      await apiRequest("/api/production-orders", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      toast({
        title: "Orden de producción creada",
        description: "La orden de producción ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      setIsOrderDialogOpen(false);
      orderForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden de producción.",
        variant: "destructive",
      });
    },
  });

  // Update Order Status Mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest(`/api/production-orders/${orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la orden ha sido actualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    },
  });

  // Add BOM Item
  const addBOMItem = () => {
    setBomItems([...bomItems, {
      componentId: "",
      quantity: 1,
      unit: "unit",
      wastePercentage: 0,
      notes: ""
    }]);
  };

  // Remove BOM Item
  const removeBOMItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  // Update BOM Item
  const updateBOMItem = (index: number, field: string, value: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  // Handle BOM form submission
  const onSubmitBOM = (data: BOMFormData) => {
    if (bomItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un componente a la lista.",
        variant: "destructive",
      });
      return;
    }
    createBOMMutation.mutate(data);
  };

  // Handle Production Order form submission
  const onSubmitOrder = (data: ProductionOrderFormData) => {
    createOrderMutation.mutate(data);
  };

  // Filter BOMs
  const filteredBOMs = boms?.filter(bom => {
    const product = products?.find(p => p.id === bom.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && bom.isActive) ||
                         (filterStatus === "inactive" && !bom.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter Production Orders
  const filteredOrders = productionOrders?.filter(order => {
    const product = products?.find(p => p.id === order.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Get order statistics
  const getOrderStats = () => {
    if (!productionOrders) return { total: 0, planned: 0, inProgress: 0, completed: 0 };
    
    return {
      total: productionOrders.length,
      planned: productionOrders.filter(o => o.status === "planned").length,
      inProgress: productionOrders.filter(o => o.status === "in_progress").length,
      completed: productionOrders.filter(o => o.status === "completed").length
    };
  };

  const stats = getOrderStats();

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      planned: { label: "Planificado", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "En Proceso", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completado", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" }
    };

    const config = statusConfig[status] || statusConfig.planned;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityConfig: any = {
      low: { label: "Baja", className: "bg-gray-100 text-gray-800" },
      medium: { label: "Media", className: "bg-blue-100 text-blue-800" },
      high: { label: "Alta", className: "bg-orange-100 text-orange-800" },
      urgent: { label: "Urgente", className: "bg-red-100 text-red-800" }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="h-screen overflow-y-auto">
      <Header 
        title="Manufactura y Producción" 
        subtitle="Gestión de listas de materiales y órdenes de producción" 
      />
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Factory className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Planificadas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En Proceso</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bom">Listas de Materiales</TabsTrigger>
            <TabsTrigger value="orders">Órdenes de Producción</TabsTrigger>
            <TabsTrigger value="recipes">Recetas</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          {/* BOM Tab */}
          <TabsContent value="bom" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por producto o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setIsBOMDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Lista de Materiales
              </Button>
            </div>

            {/* BOMs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBOMs.map((bom) => {
                const product = products?.find(p => p.id === bom.productId);
                return (
                  <Card key={bom.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{bom.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Producto: {product?.name || `ID ${bom.productId}`}
                          </p>
                        </div>
                        <Badge variant={bom.isActive ? "default" : "secondary"}>
                          {bom.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Versión</p>
                        <p className="text-sm">{bom.version}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Componentes</p>
                        <div className="space-y-1">
                          {bom.items?.slice(0, 3).map((item: any, index: number) => {
                            const component = products?.find(p => p.id === item.componentId);
                            return (
                              <div key={index} className="text-sm text-gray-600">
                                • {component?.name || `ID ${item.componentId}`} - {item.quantity} {item.unit}
                              </div>
                            );
                          })}
                          {bom.items?.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{bom.items.length - 3} más...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Production Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por producto o número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="planned">Planificados</SelectItem>
                    <SelectItem value="in_progress">En Proceso</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setIsOrderDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden de Producción
              </Button>
            </div>

            {/* Orders Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden #</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead>Fecha Programada</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const product = products?.find(p => p.id === order.productId);
                      const warehouse = warehouses?.find(w => w.id === order.warehouseId);
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.orderNumber || `#${order.id}`}
                          </TableCell>
                          <TableCell>
                            {product?.name || `Producto ${order.productId}`}
                          </TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>
                            {warehouse?.name || "Principal"}
                          </TableCell>
                          <TableCell>
                            {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString('es-DO') : 'No programada'}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(order.priority || 'medium')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {order.status === "planned" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateOrderStatusMutation.mutate({
                                    orderId: order.id,
                                    status: "in_progress"
                                  })}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {order.status === "in_progress" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateOrderStatusMutation.mutate({
                                      orderId: order.id,
                                      status: "completed"
                                    })}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateOrderStatusMutation.mutate({
                                      orderId: order.id,
                                      status: "cancelled"
                                    })}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle>Recetas de Producción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Gestión de recetas y procesos de producción</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Producción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Estadísticas y análisis de eficiencia de producción</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* BOM Dialog */}
        <Dialog open={isBOMDialogOpen} onOpenChange={setIsBOMDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Lista de Materiales (BOM)</DialogTitle>
              <DialogDescription>
                Define los componentes necesarios para fabricar un producto
              </DialogDescription>
            </DialogHeader>

            <Form {...bomForm}>
              <form onSubmit={bomForm.handleSubmit(onSubmitBOM)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bomForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto Final *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {manufacturedProducts.map((product) => (
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
                    control={bomForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Lista *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: BOM Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bomForm.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Versión</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bomForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Lista Activa</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Components Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Componentes / Materiales</h3>
                    <Button type="button" onClick={addBOMItem} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Componente
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {bomItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-5 gap-4">
                          <div className="col-span-2">
                            <Label>Componente</Label>
                            <Select 
                              value={item.componentId} 
                              onValueChange={(value) => updateBOMItem(index, 'componentId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione componente" />
                              </SelectTrigger>
                              <SelectContent>
                                {rawMaterials.map((material) => (
                                  <SelectItem key={material.id} value={material.id.toString()}>
                                    {material.name} - {material.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Cantidad</Label>
                            <Input 
                              type="number" 
                              min="0.001" 
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => updateBOMItem(index, 'quantity', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label>Unidad</Label>
                            <Select 
                              value={item.unit} 
                              onValueChange={(value) => updateBOMItem(index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unit">Unidad</SelectItem>
                                <SelectItem value="kg">Kilogramo</SelectItem>
                                <SelectItem value="g">Gramo</SelectItem>
                                <SelectItem value="l">Litro</SelectItem>
                                <SelectItem value="ml">Mililitro</SelectItem>
                                <SelectItem value="m">Metro</SelectItem>
                                <SelectItem value="cm">Centímetro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>% Desperdicio</Label>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100"
                              step="0.1"
                              value={item.wastePercentage}
                              onChange={(e) => updateBOMItem(index, 'wastePercentage', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label>Notas (Opcional)</Label>
                            <Input 
                              value={item.notes}
                              onChange={(e) => updateBOMItem(index, 'notes', e.target.value)}
                              placeholder="Instrucciones especiales..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeBOMItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={bomForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instrucciones adicionales, consideraciones especiales..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsBOMDialogOpen(false);
                      bomForm.reset();
                      setBomItems([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBOMMutation.isPending || bomItems.length === 0}
                  >
                    Crear Lista de Materiales
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Production Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Producción</DialogTitle>
              <DialogDescription>
                Programa la fabricación de un producto
              </DialogDescription>
            </DialogHeader>

            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(onSubmitOrder)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={orderForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Producto a Fabricar *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-select BOM if available
                            const productBOMs = boms?.filter(b => b.productId === parseInt(value) && b.isActive);
                            if (productBOMs && productBOMs.length > 0) {
                              orderForm.setValue("bomId", productBOMs[0].id.toString());
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {manufacturedProducts.map((product) => (
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

                  {orderForm.watch("productId") && (
                    <FormField
                      control={orderForm.control}
                      name="bomId"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Lista de Materiales</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione BOM (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {boms?.filter(b => b.productId === parseInt(orderForm.watch("productId")) && b.isActive)
                                .map((bom) => (
                                  <SelectItem key={bom.id} value={bom.id.toString()}>
                                    {bom.name} - v{bom.version}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={orderForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={orderForm.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Almacén Destino *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione almacén" />
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

                  <FormField
                    control={orderForm.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Programada *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={orderForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={orderForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instrucciones adicionales..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOrderDialogOpen(false);
                      orderForm.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOrderMutation.isPending}
                  >
                    Crear Orden de Producción
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