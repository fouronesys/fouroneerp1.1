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
  GitBranch, Eye, Calculator, Info, Archive, Users, Timer,
  Zap, TrendingUp, DollarSign, ShoppingCart, Gauge
} from "lucide-react";

// Enhanced BOM Schema with cost calculation
const bomSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  version: z.string().default("1.0"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  laborHours: z.number().min(0).default(0),
  laborCostPerHour: z.number().min(0).default(0),
  overheadCost: z.number().min(0).default(0),
  items: z.array(z.object({
    componentId: z.string().min(1, "El componente es requerido"),
    quantity: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
    unit: z.string().min(1, "La unidad es requerida"),
    wastePercentage: z.number().min(0).max(100).default(0),
    notes: z.string().optional()
  })).min(1, "Debe agregar al menos un componente")
});

// Enhanced Production Order Schema
const productionOrderSchema = z.object({
  orderNumber: z.string().optional(),
  productId: z.string().min(1, "El producto es requerido"),
  bomId: z.string().optional(),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  plannedStartDate: z.string().min(1, "La fecha de inicio es requerida"),
  plannedEndDate: z.string().min(1, "La fecha de término es requerida"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignedEmployees: z.array(z.string()).default([]),
  notes: z.string().optional()
});

// Recipe Schema
const recipeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.enum(["entrada", "plato_principal", "postre", "bebida"]),
  preparationTime: z.number().min(1, "El tiempo debe ser mayor a 0"),
  servings: z.number().min(1, "Las porciones deben ser mayor a 0"),
  instructions: z.string().min(10, "Las instrucciones son requeridas"),
  allergens: z.array(z.string()).default([]),
  ingredients: z.array(z.object({
    productId: z.string().min(1, "El ingrediente es requerido"),
    quantity: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
    unit: z.string().min(1, "La unidad es requerida"),
    notes: z.string().optional()
  })).min(1, "Debe agregar al menos un ingrediente")
});

const Manufacturing = () => {
  const [activeTab, setActiveTab] = useState("bom");
  const [showBOMDialog, setShowBOMDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);
  const [editingBOM, setEditingBOM] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: boms, isLoading: isLoadingBOMs } = useQuery({
    queryKey: ['/api/bill-of-materials'],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: productionOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/production-orders'],
  });

  const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['/api/recipes'],
  });

  const { data: warehouses } = useQuery({
    queryKey: ['/api/warehouses'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Forms
  const bomForm = useForm({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      productId: "",
      name: "",
      version: "1.0",
      isActive: true,
      notes: "",
      laborHours: 0,
      laborCostPerHour: 0,
      overheadCost: 0,
      items: []
    }
  });

  const orderForm = useForm({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      priority: "medium",
      assignedEmployees: [],
      notes: ""
    }
  });

  const recipeForm = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      category: "plato_principal",
      preparationTime: 30,
      servings: 1,
      instructions: "",
      allergens: [],
      ingredients: []
    }
  });

  // Mutations
  const createBOMMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bill-of-materials', {
      method: 'POST',
      body: JSON.stringify({ ...data, items: selectedComponents })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bill-of-materials'] });
      setShowBOMDialog(false);
      setSelectedComponents([]);
      bomForm.reset();
      toast({ title: "Lista de materiales creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear BOM", description: error.message, variant: "destructive" });
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/production-orders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      setShowOrderDialog(false);
      orderForm.reset();
      toast({ title: "Orden de producción creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear orden", description: error.message, variant: "destructive" });
    }
  });

  const createRecipeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ...data, ingredients: selectedIngredients })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      setShowRecipeDialog(false);
      setSelectedIngredients([]);
      recipeForm.reset();
      toast({ title: "Receta creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear receta", description: error.message, variant: "destructive" });
    }
  });

  // Calculate BOM cost
  const calculateBOMCost = (bom: any) => {
    const materialCost = selectedComponents.reduce((total, item) => {
      const product = products?.find((p: any) => p.id === parseInt(item.componentId));
      if (product) {
        const adjustedQuantity = item.quantity * (1 + item.wastePercentage / 100);
        return total + (product.cost * adjustedQuantity);
      }
      return total;
    }, 0);

    const laborCost = (bomForm.watch('laborHours') || 0) * (bomForm.watch('laborCostPerHour') || 0);
    const overheadCost = bomForm.watch('overheadCost') || 0;
    
    return materialCost + laborCost + overheadCost;
  };

  // Component management
  const addComponent = () => {
    setSelectedComponents([...selectedComponents, {
      componentId: "",
      quantity: 1,
      unit: "UDS",
      wastePercentage: 0,
      notes: ""
    }]);
  };

  const removeComponent = (index: number) => {
    setSelectedComponents(selectedComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: string, value: any) => {
    const updated = [...selectedComponents];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedComponents(updated);
  };

  // Ingredient management for recipes
  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, {
      productId: "",
      quantity: 1,
      unit: "gramos",
      notes: ""
    }]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const colors = {
      planned: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-yellow-100 text-yellow-800",
      urgent: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoadingBOMs || isLoadingProducts || isLoadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Manufactura" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Manufactura" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Factory className="h-8 w-8 text-blue-600" />
                Manufactura
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Gestión de listas de materiales, órdenes de producción y recetas
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowCostAnalysis(true)} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Análisis de Costos
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bom" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Lista de Materiales
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Órdenes de Producción
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recetas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          {/* BOM Tab */}
          <TabsContent value="bom" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Listas de Materiales (BOM)
                  </CardTitle>
                  <Button onClick={() => setShowBOMDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva BOM
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {boms?.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay listas de materiales registradas</p>
                      <Button 
                        onClick={() => setShowBOMDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Crear primera BOM
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {boms?.map((bom: any) => (
                        <Card key={bom.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{bom.name}</h3>
                                  <Badge variant={bom.isActive ? "default" : "secondary"}>
                                    v{bom.version}
                                  </Badge>
                                  <Badge variant={bom.isActive ? "default" : "outline"}>
                                    {bom.isActive ? "Activa" : "Inactiva"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p><strong>Producto:</strong> {products?.find((p: any) => p.id === bom.productId)?.name}</p>
                                  <p><strong>Componentes:</strong> {bom.items?.length || 0}</p>
                                  <p><strong>Costo Estimado:</strong> RD$ {(bom.estimatedCost || 0).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingBOM(bom);
                                    // Load BOM data into form
                                    bomForm.reset({
                                      productId: bom.productId?.toString(),
                                      name: bom.name,
                                      version: bom.version,
                                      isActive: bom.isActive,
                                      notes: bom.notes || "",
                                      laborHours: bom.laborHours || 0,
                                      laborCostPerHour: bom.laborCostPerHour || 0,
                                      overheadCost: bom.overheadCost || 0
                                    });
                                    setSelectedComponents(bom.items || []);
                                    setShowBOMDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Create production order from BOM
                                    orderForm.reset({
                                      productId: bom.productId?.toString(),
                                      bomId: bom.id?.toString(),
                                      quantity: 1
                                    });
                                    setShowOrderDialog(true);
                                  }}
                                >
                                  <Play className="h-4 w-4" />
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

          {/* Production Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Órdenes de Producción
                  </CardTitle>
                  <Button onClick={() => setShowOrderDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Orden
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionOrders?.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay órdenes de producción registradas</p>
                      <Button 
                        onClick={() => setShowOrderDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Crear primera orden
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {productionOrders?.map((order: any) => (
                        <Card key={order.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                                  <Badge className={getStatusBadge(order.status)}>
                                    {order.status === 'planned' && 'Planificada'}
                                    {order.status === 'in_progress' && 'En Progreso'}
                                    {order.status === 'completed' && 'Completada'}
                                    {order.status === 'cancelled' && 'Cancelada'}
                                  </Badge>
                                  <Badge className={getPriorityBadge(order.priority)}>
                                    {order.priority === 'low' && 'Baja'}
                                    {order.priority === 'medium' && 'Media'}
                                    {order.priority === 'high' && 'Alta'}
                                    {order.priority === 'urgent' && 'Urgente'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                                  <div>
                                    <p><strong>Producto:</strong> {products?.find((p: any) => p.id === order.productId)?.name}</p>
                                    <p><strong>Cantidad:</strong> {order.quantity}</p>
                                  </div>
                                  <div>
                                    <p><strong>Inicio:</strong> {new Date(order.plannedStartDate).toLocaleDateString()}</p>
                                    <p><strong>Término:</strong> {new Date(order.plannedEndDate).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
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

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recetas
                  </CardTitle>
                  <Button onClick={() => setShowRecipeDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Receta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recipes?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay recetas registradas</p>
                      <Button 
                        onClick={() => setShowRecipeDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Crear primera receta
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recipes?.map((recipe: any) => (
                        <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-lg">{recipe.name}</h3>
                                <Badge variant="outline" className="mt-1">
                                  {recipe.category.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Timer className="h-4 w-4" />
                                  {recipe.preparationTime} minutos
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {recipe.servings} porciones
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  {recipe.ingredients?.length || 0} ingredientes
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">BOMs Activas</p>
                      <p className="text-2xl font-bold">{boms?.filter((b: any) => b.isActive).length || 0}</p>
                    </div>
                    <Layers className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Órdenes en Progreso</p>
                      <p className="text-2xl font-bold">{productionOrders?.filter((o: any) => o.status === 'in_progress').length || 0}</p>
                    </div>
                    <Gauge className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recetas Disponibles</p>
                      <p className="text-2xl font-bold">{recipes?.length || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Eficiencia Promedio</p>
                      <p className="text-2xl font-bold">87%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Producción por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de producción mensual
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* BOM Dialog */}
        <Dialog open={showBOMDialog} onOpenChange={setShowBOMDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBOM ? "Editar Lista de Materiales" : "Nueva Lista de Materiales"}
              </DialogTitle>
              <DialogDescription>
                Define los componentes necesarios para fabricar un producto
              </DialogDescription>
            </DialogHeader>

            <Form {...bomForm}>
              <form onSubmit={bomForm.handleSubmit((data) => createBOMMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={bomForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto Final</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.code})
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
                        <FormLabel>Nombre de la BOM</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Laptop Ensamblada v2.0" {...field} />
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>BOM Activa</FormLabel>
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
                </div>

                {/* Cost calculation section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Cálculo de Costos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={bomForm.control}
                      name="laborHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horas de Mano de Obra</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bomForm.control}
                      name="laborCostPerHour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo por Hora (RD$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bomForm.control}
                      name="overheadCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gastos Indirectos (RD$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Costo Total Estimado:</span>
                      <span className="text-xl font-bold text-blue-600">
                        RD$ {calculateBOMCost(bomForm.getValues()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Components section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Componentes</h3>
                    <Button type="button" onClick={addComponent} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Componente
                    </Button>
                  </div>

                  {selectedComponents.map((component, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Material/Componente</Label>
                          <Select 
                            value={component.componentId} 
                            onValueChange={(value) => updateComponent(index, 'componentId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar material" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - RD$ {product.cost?.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Cantidad Requerida</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={component.quantity}
                            onChange={(e) => updateComponent(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <Label>Unidad de Medida</Label>
                          <Select 
                            value={component.unit} 
                            onValueChange={(value) => updateComponent(index, 'unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UDS">Unidades</SelectItem>
                              <SelectItem value="KG">Kilogramos</SelectItem>
                              <SelectItem value="L">Litros</SelectItem>
                              <SelectItem value="M">Metros</SelectItem>
                              <SelectItem value="M2">Metros Cuadrados</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>% Merma</Label>
                          <Input
                            type="number"
                            step="0.1"
                            max="100"
                            value={component.wastePercentage}
                            onChange={(e) => updateComponent(index, 'wastePercentage', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label>Notas</Label>
                          <Input
                            placeholder="Notas adicionales sobre este componente"
                            value={component.notes}
                            onChange={(e) => updateComponent(index, 'notes', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeComponent(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedComponents.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay componentes agregados</p>
                      <Button type="button" onClick={addComponent} variant="outline" className="mt-2">
                        Agregar primer componente
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={bomForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instrucciones especiales, observaciones..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowBOMDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createBOMMutation.isPending}>
                    {createBOMMutation.isPending ? "Guardando..." : editingBOM ? "Actualizar BOM" : "Crear BOM"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Production Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Producción</DialogTitle>
              <DialogDescription>
                Crear una orden para fabricar productos según BOM
              </DialogDescription>
            </DialogHeader>

            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit((data) => createOrderMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={orderForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto a Fabricar</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad Requerida</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={orderForm.control}
                    name="plannedStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={orderForm.control}
                    name="plannedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Término</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Almacén</FormLabel>
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

                  <FormField
                    control={orderForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instrucciones especiales para la producción..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowOrderDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? "Creando..." : "Crear Orden"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Recipe Dialog */}
        <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Receta</DialogTitle>
              <DialogDescription>
                Crear receta para restaurantes o industria alimenticia
              </DialogDescription>
            </DialogHeader>

            <Form {...recipeForm}>
              <form onSubmit={recipeForm.handleSubmit((data) => createRecipeMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={recipeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Receta</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Pollo al Horno con Especias" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={recipeForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="plato_principal">Plato Principal</SelectItem>
                            <SelectItem value="postre">Postre</SelectItem>
                            <SelectItem value="bebida">Bebida</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={recipeForm.control}
                    name="preparationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de Preparación (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={recipeForm.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porciones</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ingredients section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Ingredientes</h3>
                    <Button type="button" onClick={addIngredient} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Ingrediente
                    </Button>
                  </div>

                  {selectedIngredients.map((ingredient, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Ingrediente</Label>
                          <Select 
                            value={ingredient.productId} 
                            onValueChange={(value) => updateIngredient(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ingrediente" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
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
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <Label>Unidad</Label>
                          <Select 
                            value={ingredient.unit} 
                            onValueChange={(value) => updateIngredient(index, 'unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gramos">Gramos</SelectItem>
                              <SelectItem value="kilogramos">Kilogramos</SelectItem>
                              <SelectItem value="onzas">Onzas</SelectItem>
                              <SelectItem value="litros">Litros</SelectItem>
                              <SelectItem value="mililitros">Mililitros</SelectItem>
                              <SelectItem value="unidades">Unidades</SelectItem>
                              <SelectItem value="cucharadas">Cucharadas</SelectItem>
                              <SelectItem value="tazas">Tazas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label>Notas</Label>
                          <Input
                            placeholder="Preparación especial del ingrediente"
                            value={ingredient.notes}
                            onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedIngredients.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay ingredientes agregados</p>
                      <Button type="button" onClick={addIngredient} variant="outline" className="mt-2">
                        Agregar primer ingrediente
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={recipeForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones de Preparación</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paso 1: ...\nPaso 2: ...\nPaso 3: ..."
                          className="h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowRecipeDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createRecipeMutation.isPending}>
                    {createRecipeMutation.isPending ? "Guardando..." : "Crear Receta"}
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

export default Manufacturing;