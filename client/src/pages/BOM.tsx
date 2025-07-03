import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Calculator, Factory, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, BOM } from "@shared/schema";

const bomSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  materialId: z.string().min(1, "Selecciona un material"),
  quantity: z.string().min(1, "La cantidad es requerida"),
  unit: z.string().min(1, "La unidad es requerida"),
});

type BOMFormData = z.infer<typeof bomSchema>;

export default function BOM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: bomItems, isLoading } = useQuery<BOM[]>({
    queryKey: ["/api/bom", selectedProductId],
    enabled: !!selectedProductId,
    queryFn: () => fetch(`/api/bom/${selectedProductId}`).then(res => res.json()),
  });

  const { data: costs } = useQuery({
    queryKey: ["/api/manufacturing/costs", selectedProductId],
    enabled: !!selectedProductId,
    queryFn: () => fetch(`/api/manufacturing/costs/${selectedProductId}?quantity=1`).then(res => res.json()),
  });

  const form = useForm<BOMFormData>({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      productId: selectedProductId?.toString() || "",
      materialId: "",
      quantity: "",
      unit: "",
    },
  });

  const createBOMMutation = useMutation({
    mutationFn: async (data: BOMFormData) => {
      return apiRequest("/api/bom", {
        method: "POST",
        body: {
          productId: parseInt(data.productId),
          materialId: parseInt(data.materialId),
          quantity: parseFloat(data.quantity),
          unit: data.unit,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Material agregado",
        description: "El material ha sido agregado a la lista de materiales.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/costs", selectedProductId] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el material.",
        variant: "destructive",
      });
    },
  });

  const updateBOMMutation = useMutation({
    mutationFn: async (data: BOMFormData) => {
      return apiRequest(`/api/bom/${editingBOM?.id}`, {
        method: "PATCH",
        body: {
          productId: parseInt(data.productId),
          materialId: parseInt(data.materialId),
          quantity: parseFloat(data.quantity),
          unit: data.unit,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Material actualizado",
        description: "El material ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/costs", selectedProductId] });
      setIsDialogOpen(false);
      setEditingBOM(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el material.",
        variant: "destructive",
      });
    },
  });

  const deleteBOMMutation = useMutation({
    mutationFn: async (bomId: number) => {
      return apiRequest(`/api/bom/${bomId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado de la lista.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bom", selectedProductId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/costs", selectedProductId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el material.",
        variant: "destructive",
      });
    },
  });

  const manufacturedProducts = products?.filter(p => p.isManufactured) || [];
  const materialProducts = products?.filter(p => !p.isManufactured) || [];

  const filteredBOMItems = bomItems?.filter(item => {
    if (!searchTerm) return true;
    return item.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.material?.code.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const onSubmit = (data: BOMFormData) => {
    if (editingBOM) {
      updateBOMMutation.mutate(data);
    } else {
      createBOMMutation.mutate(data);
    }
  };

  const handleNewBOM = () => {
    setEditingBOM(null);
    form.reset({
      productId: selectedProductId?.toString() || "",
      materialId: "",
      quantity: "",
      unit: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (bomItem: BOM) => {
    setEditingBOM(bomItem);
    form.reset({
      productId: bomItem.productId.toString(),
      materialId: bomItem.materialId.toString(),
      quantity: bomItem.quantity.toString(),
      unit: bomItem.unit,
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  return (
    <div className="h-screen overflow-y-auto space-y-6 p-6 max-h-screen">
      <Header title="Lista de Materiales (BOM)" subtitle="Gestiona las recetas y materiales de productos manufacturados" />
      
      <div className="space-y-6">
        {/* Product Selection */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Factory className="mr-2 h-5 w-5" />
              Seleccionar Producto a Manufacturar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedProductId?.toString() || ""} 
              onValueChange={(value) => setSelectedProductId(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un producto manufacturado..." />
              </SelectTrigger>
              <SelectContent>
                {manufacturedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} ({product.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {manufacturedProducts.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No hay productos manufacturados. Marca productos como "manufacturados" en la sección de productos.
              </p>
            )}
          </CardContent>
        </Card>

        {selectedProductId && (
          <>
            {/* Cost Analysis */}
            {costs && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Calculator className="mr-2 h-5 w-5" />
                    Análisis de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Costo de Materiales</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {formatCurrency(costs.materialCost)}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Costo de Mano de Obra</p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-300">
                        {formatCurrency(costs.laborCost)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Gastos Generales</p>
                      <p className="text-lg font-bold text-yellow-900 dark:text-yellow-300">
                        {formatCurrency(costs.overheadCost)}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 dark:text-purple-400">Costo Total</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                        {formatCurrency(costs.totalCost)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant={costs.canProduce ? "default" : "destructive"}>
                      {costs.canProduce ? "Puede Producirse" : "Stock Insuficiente"}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Costo por unidad: {formatCurrency(costs.unitCost)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BOM Items */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Package className="mr-2 h-5 w-5" />
                    Materiales Requeridos ({filteredBOMItems.length})
                  </CardTitle>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar materiales..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={handleNewBOM} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Material
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingBOM ? "Editar Material" : "Agregar Material"}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="materialId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Material/Ingrediente</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar material" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {materialProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                          {product.name} ({product.code}) - Stock: {product.stock} {product.unit}
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
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cantidad Requerida</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" placeholder="1.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Unidad</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar unidad" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                        <SelectItem value="g">Gramos (g)</SelectItem>
                                        <SelectItem value="l">Litros (l)</SelectItem>
                                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                        <SelectItem value="und">Unidades (und)</SelectItem>
                                        <SelectItem value="m">Metros (m)</SelectItem>
                                        <SelectItem value="cm">Centímetros (cm)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={createBOMMutation.isPending || updateBOMMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {editingBOM ? "Actualizar" : "Agregar"} Material
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando materiales...</p>
                  </div>
                ) : filteredBOMItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No hay materiales
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? "No se encontraron materiales que coincidan con tu búsqueda." : "Comienza agregando materiales a este producto."}
                    </p>
                    {!searchTerm && (
                      <div className="mt-6">
                        <Button onClick={handleNewBOM} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Material
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Material/Ingrediente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Código
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Costo Unitario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Costo Total
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Stock Disponible
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredBOMItems.map((bomItem) => {
                            const totalCost = parseFloat(bomItem.quantity.toString()) * parseFloat(bomItem.material?.price?.toString() || "0");
                            const isAvailable = (bomItem.material?.stock || 0) >= bomItem.quantity;
                            
                            return (
                              <tr key={bomItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {bomItem.material?.name}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {bomItem.material?.code}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {bomItem.quantity} {bomItem.unit}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(parseFloat(bomItem.material?.price?.toString() || "0"))}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(totalCost)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className={`text-sm ${isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {bomItem.material?.stock} {bomItem.material?.unit}
                                    </span>
                                    {!isAvailable && (
                                      <Badge variant="destructive" className="ml-2 text-xs">
                                        Insuficiente
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEdit(bomItem)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteBOMMutation.mutate(bomItem.id)}
                                      disabled={deleteBOMMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                      {filteredBOMItems.map((bomItem) => {
                        const totalCost = parseFloat(bomItem.quantity.toString()) * parseFloat(bomItem.material?.price?.toString() || "0");
                        const isAvailable = (bomItem.material?.stock || 0) >= bomItem.quantity;
                        
                        return (
                          <Card key={bomItem.id} className="border-gray-200 dark:border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {bomItem.material?.name}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {bomItem.material?.code}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(bomItem)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => deleteBOMMutation.mutate(bomItem.id)}
                                    disabled={deleteBOMMutation.isPending}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Cantidad</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {bomItem.quantity} {bomItem.unit}
                                  </p>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Costo Total</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(totalCost)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">Stock: </span>
                                  <span className={isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {bomItem.material?.stock} {bomItem.material?.unit}
                                  </span>
                                </div>
                                {!isAvailable && (
                                  <Badge variant="destructive" className="text-xs">
                                    Insuficiente
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}