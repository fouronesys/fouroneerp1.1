import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Camera } from "lucide-react";
import type { Product, Company } from "@shared/schema";
import { DR_TAX_TYPES } from "@shared/schema";

const productFormSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  cost: z.string().optional(),
  stock: z.string().min(0, "El stock debe ser mayor o igual a 0"),
  minStock: z.string().optional(),
  unit: z.string().min(1, "La unidad es requerida"),
  imageUrl: z.string().optional(),
  isManufactured: z.boolean().default(false),
  taxType: z.string().default("itbis_18"),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/current"],
  });

  // Filter tax types based on company business type
  const getAvailableTaxTypes = () => {
    const baseTaxTypes = Object.entries(DR_TAX_TYPES).filter(([key]) => key !== 'tip_10');
    
    if (company && 'businessType' in company && company.businessType === 'restaurant') {
      return Object.entries(DR_TAX_TYPES); // Include all tax types including tip for restaurants
    }
    
    return baseTaxTypes; // Exclude tip for non-restaurant businesses
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      price: "",
      cost: "",
      stock: "0",
      minStock: "0",
      unit: "unit",
      imageUrl: "",
      isManufactured: false,
      taxType: "itbis_18",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => apiRequest("/api/products", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Éxito", description: "Producto creado exitosamente." });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al crear el producto.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => 
      apiRequest(`/api/products/${editingProduct?.id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Éxito", description: "Producto actualizado exitosamente." });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar el producto.",
        variant: "destructive",
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: (productName: string) => 
      apiRequest("/api/products/generate-image", { method: "POST", body: { productName } }),
    onSuccess: (data: { imageUrl: string }) => {
      form.setValue("imageUrl", data.imageUrl);
      setCurrentImageUrl(data.imageUrl);
      toast({ title: "Éxito", description: "Imagen generada exitosamente." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al generar la imagen.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Éxito", description: "Producto eliminado exitosamente." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar el producto.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      code: product.code,
      name: product.name,
      description: product.description || "",
      price: product.price,
      cost: product.cost || "",
      stock: product.stock.toString(),
      minStock: product.minStock?.toString() || "0",
      unit: product.unit,
      imageUrl: product.imageUrl || "",
      isManufactured: product.isManufactured,
      taxType: product.taxType || "itbis_18",
    });
    setCurrentImageUrl(product.imageUrl || "");
    setIsDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    form.reset();
    setCurrentImageUrl("");
    setIsDialogOpen(true);
  };

  // Sync currentImageUrl with form values
  useEffect(() => {
    if (isDialogOpen) {
      const imageUrl = form.getValues("imageUrl");
      setCurrentImageUrl(imageUrl || "");
    }
  }, [isDialogOpen, form]);

  // Watch for imageUrl changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "imageUrl") {
        setCurrentImageUrl(value.imageUrl || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(num);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { label: "Sin stock", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" };
    }
    if (product.minStock && product.stock <= product.minStock) {
      return { label: "Stock bajo", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" };
    }
    return { label: "En stock", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" };
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <Header title="Productos" subtitle="Gestiona tu catálogo de productos e inventario" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <Header title="Productos" subtitle="Gestiona tu catálogo de productos e inventario" />
      
      <div className="p-6">
        {/* Actions and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Left Section - Product Details */}
                    <div className="lg:col-span-3 space-y-6">
                      
                      {/* Basic Information */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Información Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código del Producto</FormLabel>
                                <FormControl>
                                  <Input placeholder="PRD-001" {...field} />
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
                                <FormLabel>Unidad de Medida</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar unidad" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="unit">Unidad</SelectItem>
                                    <SelectItem value="kg">Kilogramo</SelectItem>
                                    <SelectItem value="lb">Libra</SelectItem>
                                    <SelectItem value="liter">Litro</SelectItem>
                                    <SelectItem value="gallon">Galón</SelectItem>
                                    <SelectItem value="box">Caja</SelectItem>
                                    <SelectItem value="pack">Paquete</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre del Producto</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Manzana Roja Premium" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Input placeholder="Descripción detallada del producto" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Precios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Costo (Opcional)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio de Venta</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Inventory */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Inventario</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Actual</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="minStock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Mínimo (Opcional)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Tax Type Selection */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <FormField
                          control={form.control}
                          name="taxType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Impuesto</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo de impuesto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {getAvailableTaxTypes().map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                      {value.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Manufacturing Option */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <FormField
                          control={form.control}
                          name="isManufactured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Producto Manufacturado
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Este producto se fabrica usando otros materiales
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
                    </div>
                    
                    {/* Right Section - Image Management */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Imagen del Producto
                        </h3>
                        
                        {/* Image Preview */}
                        <div className="mb-4 flex justify-center">
                          {(currentImageUrl || form.watch("imageUrl")) ? (
                            <img
                              key={currentImageUrl || form.watch("imageUrl")} 
                              src={currentImageUrl || form.watch("imageUrl") || ""}
                              alt="Vista previa del producto"
                              className="h-48 w-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=Sin+Imagen";
                              }}
                            />
                          ) : (
                            <div className="h-48 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400 mb-2" />
                              <span className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                Sin imagen
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Manual Image URL Input */}
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>URL de la Imagen</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://ejemplo.com/imagen.jpg"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setCurrentImageUrl(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Auto Generate Image Button */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const productName = form.getValues("name");
                            if (productName) {
                              generateImageMutation.mutate(productName);
                            } else {
                              toast({
                                title: "Nombre requerido",
                                description: "Ingrese el nombre del producto primero para generar una imagen.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={generateImageMutation.isPending}
                          className="w-full"
                        >
                          {generateImageMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              Generando...
                            </div>
                          ) : (
                            <>
                              <Camera className="mr-2 h-4 w-4" />
                              Generar Imagen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                      {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Guardando...
                        </div>
                      ) : (
                        editingProduct ? "Actualizar" : "Crear Producto"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No hay productos
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                {searchTerm ? "No se encontraron productos que coincidan con la búsqueda." : "Comience agregando su primer producto."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=Sin+Imagen";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.code}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Precio:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Stock:</span>
                        <span className="font-medium">
                          {product.stock} {product.unit}
                        </span>
                      </div>
                      {product.minStock && product.stock <= product.minStock && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">Stock bajo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}