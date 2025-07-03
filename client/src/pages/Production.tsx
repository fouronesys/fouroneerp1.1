import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Calculator,
  ChefHat,
  Factory,
  Layers,
} from "lucide-react";

// Schemas para formularios
const productionOrderSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.string().min(1, "Cantidad requerida"),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  notes: z.string().optional(),
});

const bomItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  materialId: z.string().min(1, "Selecciona un material"),
  quantity: z.string().min(1, "Cantidad requerida"),
  unit: z.string().min(1, "Unidad requerida"),
  notes: z.string().optional(),
});

const recipeSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  name: z.string().min(1, "Nombre de la receta requerido"),
  description: z.string().optional(),
  instructions: z.string().min(1, "Instrucciones requeridas"),
  preparationTime: z.string().optional(),
  cookingTime: z.string().optional(),
  servings: z.string().optional(),
  difficulty: z.string().optional(),
});

type ProductionOrderFormData = z.infer<typeof productionOrderSchema>;
type BOMItemFormData = z.infer<typeof bomItemSchema>;
type RecipeFormData = z.infer<typeof recipeSchema>;

export default function Production() {
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingBOM, setEditingBOM] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBOMDialog, setShowBOMDialog] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [costCalculation, setCostCalculation] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consultas de datos
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: company } = useQuery<any>({
    queryKey: ["/api/company"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: productionOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/production-orders"],
  });

  const { data: bomItems = [] } = useQuery<any[]>({
    queryKey: ["/api/bom", selectedProduct],
    enabled: !!selectedProduct,
  });

  const { data: recipes = [] } = useQuery<any[]>({
    queryKey: ["/api/recipes"],
    enabled: company?.type === 'restaurant',
  });

  // Verificar si la empresa es un restaurante
  const isRestaurant = company?.type === 'restaurant';

  // Formularios
  const orderForm = useForm<ProductionOrderFormData>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      productId: "",
      quantity: "",
      plannedStartDate: "",
      plannedEndDate: "",
      notes: "",
    },
  });

  const bomForm = useForm<BOMItemFormData>({
    resolver: zodResolver(bomItemSchema),
    defaultValues: {
      productId: "",
      materialId: "",
      quantity: "",
      unit: "",
      notes: "",
    },
  });

  const recipeForm = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      productId: "",
      name: "",
      description: "",
      instructions: "",
      preparationTime: "",
      cookingTime: "",
      servings: "",
      difficulty: "medium",
    },
  });

  // Mutaciones para órdenes de producción
  const createOrderMutation = useMutation({
    mutationFn: async (data: ProductionOrderFormData) => {
      return apiRequest("/api/production-orders", {
        method: "POST",
        body: {
          productId: parseInt(data.productId),
          quantity: parseInt(data.quantity),
          plannedStartDate: data.plannedStartDate,
          plannedEndDate: data.plannedEndDate,
          notes: data.notes,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Orden creada",
        description: "La orden de producción ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      setShowOrderDialog(false);
      orderForm.reset();
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: ProductionOrderFormData) => {
      return apiRequest(`/api/production-orders/${editingOrder?.id}`, {
        method: "PATCH",
        body: {
          productId: parseInt(data.productId),
          quantity: parseInt(data.quantity),
          plannedStartDate: data.plannedStartDate,
          plannedEndDate: data.plannedEndDate,
          notes: data.notes,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Orden actualizada",
        description: "La orden de producción ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      setShowOrderDialog(false);
      setEditingOrder(null);
      orderForm.reset();
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/production-orders/${orderId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Orden eliminada",
        description: "La orden de producción ha sido eliminada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
    },
  });

  // Mutaciones para BOM
  const createBOMMutation = useMutation({
    mutationFn: async (data: BOMItemFormData) => {
      return apiRequest("/api/bom", {
        method: "POST",
        body: {
          productId: parseInt(data.productId),
          materialId: parseInt(data.materialId),
          quantity: parseFloat(data.quantity),
          unit: data.unit,
          notes: data.notes,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Material agregado",
        description: "El material ha sido agregado a la lista de materiales.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom"] });
      setShowBOMDialog(false);
      bomForm.reset();
    },
  });

  const updateBOMMutation = useMutation({
    mutationFn: async (data: BOMItemFormData) => {
      return apiRequest(`/api/bom/${editingBOM?.id}`, {
        method: "PATCH",
        body: {
          productId: parseInt(data.productId),
          materialId: parseInt(data.materialId),
          quantity: parseFloat(data.quantity),
          unit: data.unit,
          notes: data.notes,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Material actualizado",
        description: "El material ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom"] });
      setShowBOMDialog(false);
      setEditingBOM(null);
      bomForm.reset();
    },
  });

  const deleteBOMMutation = useMutation({
    mutationFn: async (bomId: number) => {
      return apiRequest(`/api/bom/${bomId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado de la lista.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom"] });
    },
  });

  // Mutaciones para recetas
  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      return apiRequest("/api/recipes", {
        method: "POST",
        body: {
          productId: parseInt(data.productId),
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          preparationTime: data.preparationTime ? parseInt(data.preparationTime) : null,
          cookingTime: data.cookingTime ? parseInt(data.cookingTime) : null,
          servings: data.servings ? parseInt(data.servings) : null,
          difficulty: data.difficulty,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Receta creada",
        description: "La receta ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowRecipeDialog(false);
      recipeForm.reset();
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      return apiRequest(`/api/recipes/${editingRecipe?.id}`, {
        method: "PATCH",
        body: {
          productId: parseInt(data.productId),
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          preparationTime: data.preparationTime ? parseInt(data.preparationTime) : null,
          cookingTime: data.cookingTime ? parseInt(data.cookingTime) : null,
          servings: data.servings ? parseInt(data.servings) : null,
          difficulty: data.difficulty,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Receta actualizada",
        description: "La receta ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowRecipeDialog(false);
      setEditingRecipe(null);
      recipeForm.reset();
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      return apiRequest(`/api/recipes/${recipeId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Receta eliminada",
        description: "La receta ha sido eliminada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  // Cálculo de costos
  const calculateCostMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await apiRequest("/api/manufacturing/calculate-cost", {
        method: "POST",
        body: {
          productId,
          quantity,
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setCostCalculation(data);
      setShowCostDialog(true);
    },
  });

  // Funciones de manejo
  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    orderForm.reset({
      productId: order.productId.toString(),
      quantity: order.quantity.toString(),
      plannedStartDate: order.plannedStartDate || "",
      plannedEndDate: order.plannedEndDate || "",
      notes: order.notes || "",
    });
    setShowOrderDialog(true);
  };

  const handleEditBOM = (bomItem: any) => {
    setEditingBOM(bomItem);
    bomForm.reset({
      productId: bomItem.productId.toString(),
      materialId: bomItem.materialId.toString(),
      quantity: bomItem.quantity.toString(),
      unit: bomItem.unit,
      notes: bomItem.notes || "",
    });
    setShowBOMDialog(true);
  };

  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe);
    recipeForm.reset({
      productId: recipe.productId.toString(),
      name: recipe.name,
      description: recipe.description || "",
      instructions: recipe.instructions,
      preparationTime: recipe.preparationTime?.toString() || "",
      cookingTime: recipe.cookingTime?.toString() || "",
      servings: recipe.servings?.toString() || "",
      difficulty: recipe.difficulty || "medium",
    });
    setShowRecipeDialog(true);
  };

  const handleCalculateCost = (productId: number) => {
    const quantity = prompt("Ingrese la cantidad a producir:");
    if (quantity && !isNaN(Number(quantity))) {
      calculateCostMutation.mutate({
        productId,
        quantity: Number(quantity),
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Play },
      completed: { variant: "success", icon: CheckCircle },
      paused: { variant: "warning", icon: Pause },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status === "pending" && "Pendiente"}
        {status === "in_progress" && "En Progreso"}
        {status === "completed" && "Completado"}
        {status === "paused" && "Pausado"}
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, any> = {
      easy: { variant: "success", label: "Fácil" },
      medium: { variant: "default", label: "Medio" },
      hard: { variant: "destructive", label: "Difícil" },
    };

    const config = variants[difficulty] || variants.medium;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Módulo de Producción
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona órdenes de producción, listas de materiales y recetas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isRestaurant ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            <span className="hidden sm:inline">Órdenes de Producción</span>
            <span className="sm:hidden">Órdenes</span>
          </TabsTrigger>
          <TabsTrigger value="bom" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Lista de Materiales</span>
            <span className="sm:hidden">BOM</span>
          </TabsTrigger>
          {isRestaurant && (
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline">Recetas</span>
              <span className="sm:hidden">Recetas</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Órdenes de Producción */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Órdenes de Producción</h2>
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingOrder(null);
                  orderForm.reset();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Orden
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Editar Orden" : "Nueva Orden de Producción"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrder 
                      ? "Modifica los datos de la orden de producción."
                      : "Crea una nueva orden de producción."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...orderForm}>
                  <form 
                    onSubmit={orderForm.handleSubmit((data) => {
                      if (editingOrder) {
                        updateOrderMutation.mutate(data);
                      } else {
                        createOrderMutation.mutate(data);
                      }
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={orderForm.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product: any) => (
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
                      control={orderForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orderForm.control}
                        name="plannedStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Inicio</FormLabel>
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
                            <FormLabel>Fecha Fin</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
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
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowOrderDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                      >
                        {editingOrder ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {productionOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Factory className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No hay órdenes de producción.
                    <br />
                    Crea la primera orden para comenzar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionOrders.map((order: any) => {
                      const product = products.find((p: any) => p.id === order.productId);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.number}</TableCell>
                          <TableCell>{product?.name || 'Producto no encontrado'}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.plannedStartDate 
                              ? new Date(order.plannedStartDate).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCalculateCost(order.productId)}
                              >
                                <Calculator className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteOrderMutation.mutate(order.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Lista de Materiales (BOM) */}
        <TabsContent value="bom" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Lista de Materiales (BOM)</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecciona un producto para ver sus materiales
              </p>
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(value) => setSelectedProduct(Number(value))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showBOMDialog} onOpenChange={setShowBOMDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingBOM(null);
                    bomForm.reset();
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBOM ? "Editar Material" : "Agregar Material"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingBOM 
                        ? "Modifica los datos del material."
                        : "Agrega un nuevo material a la lista."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...bomForm}>
                    <form 
                      onSubmit={bomForm.handleSubmit((data) => {
                        if (editingBOM) {
                          updateBOMMutation.mutate(data);
                        } else {
                          createBOMMutation.mutate(data);
                        }
                      })}
                      className="space-y-4"
                    >
                      <FormField
                        control={bomForm.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product: any) => (
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
                        name="materialId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un material" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product: any) => (
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={bomForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={bomForm.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidad</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="kg, pcs, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={bomForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBOMDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createBOMMutation.isPending || updateBOMMutation.isPending}
                        >
                          {editingBOM ? "Actualizar" : "Agregar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {selectedProduct ? (
            <div className="grid gap-4">
              {bomItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No hay materiales definidos para este producto.
                      <br />
                      Agrega el primer material para comenzar.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Costo Unitario</TableHead>
                        <TableHead>Stock Disponible</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map((item: any) => {
                        const material = products.find((p: any) => p.id === item.materialId);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {material?.name || 'Material no encontrado'}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              ${material?.price ? parseFloat(material.price).toFixed(2) : '0.00'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  material?.stock && parseFloat(material.stock) >= parseFloat(item.quantity) 
                                    ? "default" 
                                    : "destructive"
                                }
                              >
                                {material?.stock || 0} {item.unit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditBOM(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteBOMMutation.mutate(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Layers className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  Selecciona un producto para ver su lista de materiales.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recetas - Solo para restaurantes */}
        {isRestaurant && (
          <TabsContent value="recipes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recetas de Producción</h2>
            <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRecipe(null);
                  recipeForm.reset();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Receta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecipe ? "Editar Receta" : "Nueva Receta"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRecipe 
                      ? "Modifica los datos de la receta."
                      : "Crea una nueva receta de producción."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...recipeForm}>
                  <form 
                    onSubmit={recipeForm.handleSubmit((data) => {
                      if (editingRecipe) {
                        updateRecipeMutation.mutate(data);
                      } else {
                        createRecipeMutation.mutate(data);
                      }
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={recipeForm.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product: any) => (
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
                      control={recipeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Receta</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre descriptivo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={recipeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descripción de la receta" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={recipeForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instrucciones</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Instrucciones paso a paso"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={recipeForm.control}
                        name="preparationTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prep. (min)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={recipeForm.control}
                        name="cookingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cocción (min)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
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
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={recipeForm.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dificultad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la dificultad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Fácil</SelectItem>
                              <SelectItem value="medium">Medio</SelectItem>
                              <SelectItem value="hard">Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRecipeDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
                      >
                        {editingRecipe ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {recipes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <ChefHat className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No hay recetas definidas.
                    <br />
                    Crea la primera receta para comenzar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe: any) => {
                  const product = products.find((p: any) => p.id === recipe.productId);
                  return (
                    <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                            <CardDescription>
                              {product?.name || 'Producto no encontrado'}
                            </CardDescription>
                          </div>
                          {getDifficultyBadge(recipe.difficulty)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {recipe.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {recipe.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {(recipe.preparationTime || 0) + (recipe.cookingTime || 0)} min
                          </div>
                          {recipe.servings && (
                            <div>
                              {recipe.servings} porciones
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecipeMutation.mutate(recipe.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          </TabsContent>
        )}

      {/* Diálogo de Cálculo de Costos */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cálculo de Costos de Producción</DialogTitle>
            <DialogDescription>
              Detalle de costos para la producción
            </DialogDescription>
          </DialogHeader>
          {costCalculation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Cantidad:</p>
                  <p>{costCalculation.quantity} unidades</p>
                </div>
                <div>
                  <p className="font-medium">Costo por unidad:</p>
                  <p>${costCalculation.unitCost?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Materiales:</span>
                  <span>${costCalculation.materialCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mano de obra:</span>
                  <span>${costCalculation.laborCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos generales:</span>
                  <span>${costCalculation.overheadCost?.toFixed(2) || '0.00'}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${costCalculation.totalCost?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {costCalculation.materials && costCalculation.materials.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Materiales requeridos:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {costCalculation.materials.map((material: any, index: number) => (
                      <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="flex justify-between">
                          <span>{material.name}</span>
                          <Badge 
                            variant={material.isAvailable ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {material.isAvailable ? "Disponible" : "Faltante"}
                          </Badge>
                        </div>
                        <div className="text-gray-500">
                          Requiere: {material.requiredQuantity} {material.unit} | 
                          Stock: {material.availableStock} {material.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowCostDialog(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      </Tabs>
      </div>
    </div>
  );
}