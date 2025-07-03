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
  Warehouse, Plus, Search, Edit, AlertCircle, Package, 
  MapPin, Users, BarChart3, TrendingUp, ArrowUpRight, 
  ArrowDownLeft, ArrowLeftRight, RefreshCw, Eye, FileText,
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle,
  Filter, Download, Upload, Printer, RotateCcw
} from "lucide-react";

// Simplified Warehouse Schema for forms
const warehouseSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  location: z.string().min(1, "La ubicación es requerida"),
  type: z.enum(["main", "regional", "temporary", "finished_goods", "raw_materials", "assets"]),
  isActive: z.boolean().default(true),
  temperatureControlled: z.boolean().default(false)
});

// Inventory Movement Schema
const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "TRANSFER", "ADJUSTMENT"]),
  reason: z.enum([
    "purchase", "sale", "production", "return", "transfer", 
    "adjustment", "damage", "expiry", "theft", "initial_stock"
  ]),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  destinationWarehouseId: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "El producto es requerido"),
    quantity: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
    unitCost: z.number().min(0).optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    serialNumber: z.string().optional()
  })).min(1, "Debe agregar al menos un producto")
});

// Stock Adjustment Schema
const adjustmentSchema = z.object({
  warehouseId: z.string().min(1, "El almacén es requerido"),
  reason: z.enum(["physical_count", "damage", "theft", "expiry", "correction"]),
  notes: z.string().min(5, "Las notas son requeridas para ajustes"),
  items: z.array(z.object({
    productId: z.string().min(1, "El producto es requerido"),
    currentStock: z.number(),
    physicalStock: z.number(),
    difference: z.number(),
    unitCost: z.number().min(0)
  })).min(1, "Debe agregar al menos un producto")
});

const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState("warehouses");
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [showKardexDialog, setShowKardexDialog] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [selectedMovementType, setSelectedMovementType] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['/api/warehouses'],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: movements, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['/api/inventory/movements'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: stockLevels } = useQuery({
    queryKey: ['/api/inventory/stock-levels'],
  });

  // Forms
  const warehouseForm = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: "",
      name: "",
      location: "",
      type: "main" as const,
      isActive: true,
      temperatureControlled: false
    }
  });

  const movementForm = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "IN",
      reason: "purchase",
      warehouseId: "",
      items: []
    }
  });

  const adjustmentForm = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      warehouseId: "",
      reason: "physical_count",
      notes: "",
      items: []
    }
  });

  // Mutations
  const createWarehouseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating warehouse with data:", data);
      try {
        const response = await apiRequest('/api/warehouses', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        console.log("Warehouse creation response:", response);
        return response;
      } catch (error) {
        console.error("Warehouse creation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Warehouse created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setShowWarehouseDialog(false);
      warehouseForm.reset();
      toast({ title: "Almacén creado exitosamente" });
    },
    onError: (error: any) => {
      console.error("Warehouse creation mutation error:", error);
      toast({ 
        title: "Error al crear almacén", 
        description: error.message || "Error desconocido", 
        variant: "destructive" 
      });
    }
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify({ ...data, items: selectedProducts })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stock-levels'] });
      setShowMovementDialog(false);
      setSelectedProducts([]);
      movementForm.reset();
      toast({ title: "Movimiento registrado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al registrar movimiento", description: error.message, variant: "destructive" });
    }
  });

  // Product management for movements
  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      productId: "",
      quantity: 1,
      unitCost: 0,
      batchNumber: "",
      expiryDate: "",
      serialNumber: ""
    }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  // Movement type configuration
  const getMovementTypeConfig = (type: string) => {
    const configs = {
      IN: {
        title: "Entrada de Inventario",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: ArrowDownLeft,
        reasons: [
          { value: "purchase", label: "Compra" },
          { value: "production", label: "Producción" },
          { value: "return", label: "Devolución" },
          { value: "initial_stock", label: "Stock Inicial" }
        ]
      },
      OUT: {
        title: "Salida de Inventario",
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: ArrowUpRight,
        reasons: [
          { value: "sale", label: "Venta" },
          { value: "production", label: "Consumo Producción" },
          { value: "damage", label: "Daño" },
          { value: "expiry", label: "Vencimiento" }
        ]
      },
      TRANSFER: {
        title: "Transferencia",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: Transfer,
        reasons: [
          { value: "transfer", label: "Transferencia entre almacenes" }
        ]
      },
      ADJUSTMENT: {
        title: "Ajuste",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: RefreshCw,
        reasons: [
          { value: "adjustment", label: "Ajuste de inventario" }
        ]
      }
    };
    return configs[type as keyof typeof configs] || configs.IN;
  };

  // Status badges
  const getWarehouseTypeBadge = (type: string) => {
    const types = {
      main: { label: "Principal", color: "bg-blue-100 text-blue-800" },
      regional: { label: "Regional", color: "bg-green-100 text-green-800" },
      temporary: { label: "Temporal", color: "bg-yellow-100 text-yellow-800" },
      finished_goods: { label: "Productos Terminados", color: "bg-purple-100 text-purple-800" },
      raw_materials: { label: "Materia Prima", color: "bg-orange-100 text-orange-800" },
      assets: { label: "Activos", color: "bg-gray-100 text-gray-800" }
    };
    const typeConfig = types[type as keyof typeof types] || types.main;
    return <Badge className={typeConfig.color}>{typeConfig.label}</Badge>;
  };

  const getStockStatusBadge = (current: number, min: number) => {
    if (current <= 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    } else if (current <= min) {
      return <Badge className="bg-yellow-100 text-yellow-800">Stock Bajo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Stock Normal</Badge>;
    }
  };

  if (isLoadingWarehouses || isLoadingProducts || isLoadingMovements) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Gestión de Almacenes" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Almacenes" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Warehouse className="h-8 w-8 text-blue-600" />
                Gestión de Almacenes
              </h1>
              <p className="text-gray-600 mt-2">
                Control completo de bodegas, inventario y movimientos con trazabilidad
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowKardexDialog(true)} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Kardex
              </Button>
              <Button onClick={() => setShowMovementDialog(true)} variant="outline">
                <Transfer className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="warehouses" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Almacenes
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Control de Stock
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <Transfer className="h-4 w-4" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="kardex" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Kardex
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Warehouses Tab */}
          <TabsContent value="warehouses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Gestión de Bodegas
                  </CardTitle>
                  <Button onClick={() => setShowWarehouseDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Almacén
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warehouses?.length === 0 ? (
                    <div className="text-center py-8">
                      <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay almacenes registrados</p>
                      <Button 
                        onClick={() => setShowWarehouseDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Crear primer almacén
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {warehouses?.map((warehouse: any) => (
                        <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                                  <p className="text-sm text-gray-600">{warehouse.code}</p>
                                </div>
                                <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                                  {warehouse.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                {getWarehouseTypeBadge(warehouse.type)}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  {warehouse.location}
                                </div>
                                {warehouse.manager && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="h-4 w-4" />
                                    {warehouse.manager}
                                  </div>
                                )}
                                {warehouse.maxCapacity && (
                                  <div className="text-sm text-gray-600">
                                    <strong>Capacidad:</strong> {warehouse.maxCapacity.toLocaleString()} unidades
                                  </div>
                                )}
                                {warehouse.temperatureControlled && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Control de Temperatura
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    setEditingWarehouse(warehouse);
                                    warehouseForm.reset(warehouse);
                                    setShowWarehouseDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedWarehouse(warehouse);
                                    setActiveTab("stock");
                                  }}
                                >
                                  <Package className="h-4 w-4 mr-1" />
                                  Stock
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Control Tab */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Control de Inventario
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAdjustmentDialog(true)} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Ajuste de Stock
                    </Button>
                    <Select value={selectedWarehouse?.id?.toString() || ""} onValueChange={(value) => {
                      const warehouse = warehouses?.find((w: any) => w.id.toString() === value);
                      setSelectedWarehouse(warehouse);
                    }}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Seleccionar almacén" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los almacenes</SelectItem>
                        {warehouses?.map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products?.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay productos en inventario</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Stock Actual</TableHead>
                            <TableHead>Stock Mínimo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Costo Promedio</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products?.filter((product: any) => 
                            !selectedWarehouse || product.warehouseId === selectedWarehouse.id
                          ).map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                </div>
                              </TableCell>
                              <TableCell>{product.code}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.category?.name || "Sin categoría"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {product.stock?.toLocaleString() || 0} {product.unit}
                                </div>
                              </TableCell>
                              <TableCell>{product.minStock?.toLocaleString() || 0}</TableCell>
                              <TableCell>
                                {getStockStatusBadge(product.stock || 0, product.minStock || 0)}
                              </TableCell>
                              <TableCell>RD$ {(product.cost || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                RD$ {((product.stock || 0) * (product.cost || 0)).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setShowKardexDialog(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Quick movement
                                      movementForm.reset({
                                        warehouseId: product.warehouseId?.toString() || "",
                                        type: "IN"
                                      });
                                      setSelectedProducts([{
                                        productId: product.id.toString(),
                                        quantity: 1,
                                        unitCost: product.cost || 0,
                                        batchNumber: "",
                                        expiryDate: "",
                                        serialNumber: ""
                                      }]);
                                      setShowMovementDialog(true);
                                    }}
                                  >
                                    <Transfer className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Transfer className="h-5 w-5" />
                    Movimientos de Almacén
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowMovementDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Movimiento
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {movements?.length === 0 ? (
                    <div className="text-center py-8">
                      <Transfer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay movimientos registrados</p>
                      <Button 
                        onClick={() => setShowMovementDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Registrar primer movimiento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {movements?.slice(0, 20).map((movement: any) => {
                        const config = getMovementTypeConfig(movement.type);
                        const IconComponent = config.icon;
                        
                        return (
                          <Card key={movement.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                    <IconComponent className={`h-5 w-5 ${config.color}`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-semibold">{config.title}</h3>
                                      <Badge variant="outline">
                                        {movement.reason}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      <p><strong>Almacén:</strong> {movement.warehouse?.name}</p>
                                      {movement.destinationWarehouse && (
                                        <p><strong>Destino:</strong> {movement.destinationWarehouse.name}</p>
                                      )}
                                      <p><strong>Productos:</strong> {movement.items?.length || 0} ítems</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">
                                    {new Date(movement.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm font-medium">
                                    {movement.referenceNumber}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kardex Tab */}
          <TabsContent value="kardex" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Kardex y Trazabilidad
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Producto</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Almacén</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los almacenes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {warehouses?.map((warehouse: any) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Período</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Último mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="last_week">Última semana</SelectItem>
                          <SelectItem value="last_month">Último mes</SelectItem>
                          <SelectItem value="last_quarter">Último trimestre</SelectItem>
                          <SelectItem value="last_year">Último año</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-center">
                      Seleccione un producto para ver su kardex completo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Almacenes</p>
                      <p className="text-2xl font-bold">{warehouses?.length || 0}</p>
                    </div>
                    <Warehouse className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Productos en Stock</p>
                      <p className="text-2xl font-bold">{products?.length || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Movimientos Hoy</p>
                      <p className="text-2xl font-bold">
                        {movements?.filter((m: any) => 
                          new Date(m.createdAt).toDateString() === new Date().toDateString()
                        ).length || 0}
                      </p>
                    </div>
                    <Transfer className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Alertas de Stock</p>
                      <p className="text-2xl font-bold">
                        {products?.filter((p: any) => {
                          // Skip stock alerts for services and non-inventoriable products
                          const isStockless = p.productType === 'service' || 
                                             p.productType === 'non_inventoriable' || 
                                             p.trackInventory === false;
                          return !isStockless && (p.stock || 0) <= (p.minStock || 0);
                        }).length || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reportes de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Inventario Físico</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>Movimientos Valorizados</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Rotación de Inventario</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <span>Productos Vencidos</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Package className="h-6 w-6 mb-2" />
                    <span>Stock por Almacén</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Clock className="h-6 w-6 mb-2" />
                    <span>Productos Próximos a Vencer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Warehouse Dialog */}
        <Dialog open={showWarehouseDialog} onOpenChange={setShowWarehouseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
              </DialogTitle>
              <DialogDescription>
                Configure los datos del almacén o bodega
              </DialogDescription>
            </DialogHeader>

            <Form {...warehouseForm}>
              <form onSubmit={warehouseForm.handleSubmit((data) => createWarehouseMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={warehouseForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código del Almacén</FormLabel>
                        <FormControl>
                          <Input placeholder="ALM-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={warehouseForm.control}
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
                    control={warehouseForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Almacén</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <FormField
                    control={warehouseForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Santo Domingo, República Dominicana" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={warehouseForm.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar responsable" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={warehouseForm.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad Máxima (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={warehouseForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección Completa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Dirección completa del almacén..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={warehouseForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="(809) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={warehouseForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="almacen@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={warehouseForm.control}
                    name="temperatureControlled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Control de Temperatura</FormLabel>
                          <div className="text-sm text-gray-500">
                            Para alimentos o productos farmacéuticos
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {warehouseForm.watch('temperatureControlled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={warehouseForm.control}
                        name="minTemperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperatura Mínima (°C)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="2"
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={warehouseForm.control}
                        name="maxTemperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperatura Máxima (°C)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="8"
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={warehouseForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Almacén Activo</FormLabel>
                          <div className="text-sm text-gray-500">
                            Permite movimientos de inventario
                          </div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={warehouseForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observaciones adicionales sobre el almacén..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowWarehouseDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createWarehouseMutation.isPending}>
                    {createWarehouseMutation.isPending ? "Guardando..." : editingWarehouse ? "Actualizar" : "Crear Almacén"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Movement Dialog */}
        <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
              <DialogDescription>
                Registre entradas, salidas, transferencias o ajustes de inventario
              </DialogDescription>
            </DialogHeader>

            <Form {...movementForm}>
              <form onSubmit={movementForm.handleSubmit((data) => createMovementMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={movementForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Movimiento</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedMovementType(value);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="IN">Entrada</SelectItem>
                            <SelectItem value="OUT">Salida</SelectItem>
                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
                            <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getMovementTypeConfig(selectedMovementType || "IN").reasons.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Almacén {selectedMovementType === "TRANSFER" ? "Origen" : ""}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar almacén" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses?.map((warehouse: any) => (
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

                  {selectedMovementType === "TRANSFER" && (
                    <FormField
                      control={movementForm.control}
                      name="destinationWarehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Almacén Destino</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar destino" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouses?.map((warehouse: any) => (
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
                  )}

                  <FormField
                    control={movementForm.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Referencia</FormLabel>
                        <FormControl>
                          <Input placeholder="FAC-001, ORD-123, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Products section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Productos</h3>
                    <Button type="button" onClick={addProduct} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {selectedProducts.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Producto</Label>
                          <Select 
                            value={product.productId} 
                            onValueChange={(value) => updateProduct(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map((prod: any) => (
                                <SelectItem key={prod.id} value={prod.id.toString()}>
                                  {prod.name} ({prod.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={product.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <Label>Costo Unitario</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={product.unitCost}
                            onChange={(e) => updateProduct(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Número de Lote</Label>
                          <Input
                            placeholder="LOTE-001"
                            value={product.batchNumber}
                            onChange={(e) => updateProduct(index, 'batchNumber', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Fecha de Vencimiento</Label>
                          <Input
                            type="date"
                            value={product.expiryDate}
                            onChange={(e) => updateProduct(index, 'expiryDate', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Número de Serie</Label>
                          <Input
                            placeholder="SN123456"
                            value={product.serialNumber}
                            onChange={(e) => updateProduct(index, 'serialNumber', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProduct(index)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedProducts.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay productos agregados</p>
                      <Button type="button" onClick={addProduct} variant="outline" className="mt-2">
                        Agregar primer producto
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={movementForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones sobre el movimiento..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowMovementDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMovementMutation.isPending}>
                    {createMovementMutation.isPending ? "Registrando..." : "Registrar Movimiento"}
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

export default WarehouseManagement;