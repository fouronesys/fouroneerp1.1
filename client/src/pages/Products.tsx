import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, List, Calculator, Wrench, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string()
    .min(1, "El precio es requerido")
    .refine((val) => parseFloat(val) >= 0, "El precio no puede ser negativo"),
  cost: z.string()
    .optional()
    .refine((val) => !val || parseFloat(val) >= 0, "El costo no puede ser negativo"),
  stock: z.string()
    .default("0")
    .refine((val) => parseInt(val) >= 0, "El stock no puede ser negativo"),
  minStock: z.string()
    .default("0")
    .refine((val) => parseInt(val) >= 0, "El stock mínimo no puede ser negativo"),
  unit: z.string().default("unit"),
  isManufactured: z.boolean().default(false),
  productType: z.enum(["product", "raw_material", "service", "non_inventoriable"]).default("product"),
  imageUrl: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBOMDialogOpen, setIsBOMDialogOpen] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForBOM, setSelectedProductForBOM] = useState<Product | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isBatchImageDialogOpen, setIsBatchImageDialogOpen] = useState(false);
  const [batchImageProgress, setBatchImageProgress] = useState({ current: 0, total: 0 });
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      price: "",
      cost: "",
      stock: "0",
      minStock: "0",
      unit: "unit",
      isManufactured: false,
      imageUrl: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const isInventoriable = data.productType === 'product' || data.productType === 'raw_material';
      await apiRequest("/api/products", {
        method: "POST",
        body: {
          ...data,
          price: data.price,
          cost: data.cost || undefined,
          stock: isInventoriable ? parseInt(data.stock) : 0,
          minStock: isInventoriable ? parseInt(data.minStock) : 0,
          productType: data.productType,
          taxType: 'itbis_18',
          canBeSold: true,
          canBePurchased: data.productType !== 'service',
          trackInventory: isInventoriable
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      });
      // Force refetch with exact query key match
      queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
      queryClient.refetchQueries({ queryKey: ["/api/products"], exact: true });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!editingProduct) return;
      await apiRequest(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: {
          ...data,
          price: data.price,
          cost: data.cost || undefined,
          stock: parseInt(data.stock),
          minStock: parseInt(data.minStock),
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      });
      // Force refetch with exact query key match
      queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
      queryClient.refetchQueries({ queryKey: ["/api/products"], exact: true });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/products/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });
      // Force refetch with exact query key match
      queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
      queryClient.refetchQueries({ queryKey: ["/api/products"], exact: true });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    },
  });

 const generateImageMutation = useMutation({
  mutationFn: async (data: { productName: string; productCode?: string; description?: string; source?: string; productId?: string }) => {
    return await apiRequest("/api/products/generate-image", {
      method: "POST",
      body: data
    });
  },
  onSuccess: (data, variables) => {
    // Siempre actualiza la imagen en el formulario cuando se genera
    form.setValue("imageUrl", data.imageUrl);
    setCurrentImageUrl(data.imageUrl);
    
    // Invalida y actualiza la lista
    queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
    queryClient.refetchQueries({ queryKey: ["/api/products"], exact: true });
    toast({ title: "Imagen generada", description: "Se ha generado la imagen con IA exitosamente." });
  },
  onError: () => {
    toast({ title: "Error", description: "No se pudo generar la imagen.", variant: "destructive" });
  }
});

  // Batch image generation function
  const generateBatchImages = async () => {
    if (!products || products.length === 0) {
      toast({
        title: "No hay productos",
        description: "No hay productos para generar imágenes.",
        variant: "destructive",
      });
      return;
    }

    const productsWithoutImages = products.filter(p => !p.imageUrl);
    
    if (productsWithoutImages.length === 0) {
      toast({
        title: "Todos los productos tienen imágenes",
        description: "No hay productos sin imágenes para procesar.",
      });
      return;
    }

    setIsBatchGenerating(true);
    setBatchImageProgress({ current: 0, total: productsWithoutImages.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsWithoutImages.length; i++) {
      const product = productsWithoutImages[i];
      setBatchImageProgress({ current: i + 1, total: productsWithoutImages.length });

      try {
        const result = await apiRequest("/api/products/generate-image", {
          method: "POST",
          body: {
            productName: product.name,
            productCode: product.code,
            description: product.description || "",
            source: "batch_generation"
          }
        });

        // Update product with new image
        await apiRequest(`/api/products/${product.id}`, {
          method: "PUT",
          body: {
            ...product,
            imageUrl: (result as any).imageUrl
          }
        });

        successCount++;
      } catch (error) {
        console.error(`Error generating image for product ${product.name}:`, error);
        errorCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsBatchGenerating(false);
    setBatchImageProgress({ current: 0, total: 0 });
    setIsBatchImageDialogOpen(false);

    // Refresh products data
    queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
    queryClient.refetchQueries({ queryKey: ["/api/products"], exact: true });

    toast({
      title: "Generación completada",
      description: `${successCount} imágenes generadas exitosamente. ${errorCount} errores.`,
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  // Sync currentImageUrl with form values when dialog opens or form changes
  useEffect(() => {
    if (isDialogOpen) {
      const imageUrl = form.getValues("imageUrl");
      setCurrentImageUrl(imageUrl || "");
    }
  }, [isDialogOpen, form]);

  // Watch for imageUrl changes and update currentImageUrl
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "imageUrl") {
        setCurrentImageUrl(value.imageUrl || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (productTypeFilter === "all") return matchesSearch;
    return matchesSearch && product.productType === productTypeFilter;
  }) || [];

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

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
      isManufactured: product.isManufactured,
      imageUrl: product.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(num);
  };

  const getStockStatus = (product: Product) => {
    // For services and non-inventoriable products, don't show stock status
    if (product.productType === 'service' || product.productType === 'non_inventoriable') {
      return { label: "Servicio", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" };
    }
    
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
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-4 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Catálogo de Productos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona inventario, precios y productos
            </p>
          </div>
        </div>
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
          <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              <SelectItem value="product">Productos finales</SelectItem>
              <SelectItem value="raw_material">Materia prima</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsBatchImageDialogOpen(true)}
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50"
            disabled={!products || products.length === 0}
          >
            <Package className="mr-2 h-4 w-4" />
            Generar Imágenes en Lote
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
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
                          <FormLabel>Unidad</FormLabel>
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
                              <SelectItem value="l">Litro</SelectItem>
                              <SelectItem value="ml">Mililitro</SelectItem>
                              <SelectItem value="m">Metro</SelectItem>
                              <SelectItem value="cm">Centímetro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del producto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Descripción del producto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Producto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="product">Producto Final</SelectItem>
                              <SelectItem value="raw_material">Materia Prima</SelectItem>
                              <SelectItem value="service">Servicio</SelectItem>
                              <SelectItem value="non_inventoriable">No Inventariable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isManufactured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Producto Manufacturado</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Requiere lista de materiales (BOM)
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

                  <div className="grid grid-cols-2 gap-4">
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
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Solo mostrar campos de inventario para productos inventariables */}
                  {(form.watch("productType") === "product" || form.watch("productType") === "raw_material") && (
                    <div className="grid grid-cols-2 gap-4">
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
                            <FormLabel>Stock Mínimo</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Image Management Section */}
                  <div className="space-y-4">
                    <FormLabel className="text-base font-medium">Imagen del Producto</FormLabel>
                    
                    {/* Image Preview */}
                    {(currentImageUrl || form.watch("imageUrl")) && (
                      <div className="flex justify-center">
                        <img
                          key={currentImageUrl || form.watch("imageUrl")} // Force re-render when URL changes
                          src={currentImageUrl || form.watch("imageUrl") || ""}
                          alt="Vista previa del producto"
                          className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Manual Image URL Input */}
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
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
                    
                    {/* Image Generation Buttons - Cambios aplicados */}
                    <div className="grid grid-cols-2 gap-2">
<Button
  type="button"
  variant="outline"
  onClick={() => {
    const productName = form.getValues("name");
    const productCode = form.getValues("code");
    const description = form.getValues("description");
    if (productName) {
      generateImageMutation.mutate({
        productName,
        productCode: productCode || undefined,
        description: description || undefined,
        source: "manual",
        productId: editingProduct?.id?.toString()
      });
    } else {
      toast({ title: "Error", description: "Ingrese el nombre del producto primero.", variant: "destructive" });
    }
  }}
  disabled={generateImageMutation.isLoading}
>
  {generateImageMutation.isLoading ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      Generando con IA...
    </div>
  ) : (
    "Generar con Gemini AI"
  )}
</Button>
                      
                   <Button
  type="button"
  variant="outline"
  onClick={() => {
    const productName = form.getValues("name");
    const productCode = form.getValues("code");
    const description = form.getValues("description");
    if (productName) {
      generateImageMutation.mutate({
        productName,
        productCode: productCode || undefined,
        description: description || undefined,
        source: "unsplash",
        productId: editingProduct?.id?.toString()
      });
    } else {
      toast({ title: "Error", description: "Ingrese el nombre del producto primero.", variant: "destructive" });
    }
  }}
  disabled={generateImageMutation.isLoading}
>
  {generateImageMutation.isLoading ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      Buscando...
    </div>
  ) : (
    "Buscar en Unsplash"
  )}
</Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="isManufactured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {editingProduct ? "Actualizar" : "Crear"} Producto
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products List */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Package className="mr-2 h-5 w-5" />
              Productos ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No hay productos
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? "No se encontraron productos que coincidan con tu búsqueda." : "Comienza agregando tu primer producto."}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={handleNewProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Producto
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
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                  src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"}
                                  alt={product.name}
                                  onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
                                  }}
                                />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-48">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.code} • {product.unit}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {product.stock} {product.unit}
                            </div>
                            {product.minStock && product.stock <= product.minStock && (
                              <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Min: {product.minStock}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge className={stockStatus.color} variant="outline">
                              {stockStatus.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={product.isManufactured ? "secondary" : "outline"}>
                              {product.isManufactured ? "Manuf." : "Comp."}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {!product.imageUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const result = await apiRequest(`/api/products/${product.id}/generate-image`, {
                                        method: "POST"
                                      });
                                      toast({
                                        title: "Imagen generada",
                                        description: "La imagen ha sido generada con IA exitosamente.",
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/products"], exact: true });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "No se pudo generar la imagen.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="text-purple-600 hover:text-purple-700"
                                  title="Generar imagen con IA"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                disabled={deleteProductMutation.isPending}
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
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <Card key={product.id} className="border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center flex-1 min-w-0">
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"}
                                alt={product.name}
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
                                }}
                              />
                              <div className="ml-3 flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.code} • {product.unit}
                                </p>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              {!product.imageUrl && (
                                <Button
  variant="ghost"
  size="sm"
  onClick={() => {
    generateImageMutation.mutate({
      productName: product.name,
      productCode: product.code,
      description: product.description || "",
      source: "single",
      productId: product.id
    });
  }}
  className="text-purple-600 hover:text-purple-700"
>
  <Sparkles className="h-4 w-4" />
</Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                disabled={deleteProductMutation.isPending}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.stock} {product.unit}
                              </p>
                              {product.minStock && product.stock <= product.minStock && (
                                <div className="flex items-center justify-center text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Bajo
                                </div>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Estado</p>
                              <Badge className={`${stockStatus.color} text-xs mt-1`} variant="outline">
                                {stockStatus.label}
                              </Badge>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                              <Badge variant={product.isManufactured ? "secondary" : "outline"} className="text-xs mt-1">
                                {product.isManufactured ? "Manuf." : "Comp."}
                              </Badge>
                            </div>
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

        {/* Batch Image Generation Dialog */}
        <Dialog open={isBatchImageDialogOpen} onOpenChange={setIsBatchImageDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generar Imágenes en Lote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Esta función generará automáticamente imágenes para todos los productos que no tienen imagen asignada.</p>
                <p className="mt-2">
                  Productos sin imagen: <strong>
                    {products ? products.filter(p => !p.imageUrl).length : 0}
                  </strong>
                </p>
              </div>

              {isBatchGenerating && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Procesando producto {batchImageProgress.current} de {batchImageProgress.total}</span>
                    <span>{Math.round((batchImageProgress.current / batchImageProgress.total) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(batchImageProgress.current / batchImageProgress.total) * 100} 
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Generando imágenes automáticamente...
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsBatchImageDialogOpen(false)}
                  disabled={isBatchGenerating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={generateBatchImages}
                  disabled={isBatchGenerating || !products || products.filter(p => !p.imageUrl).length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isBatchGenerating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Iniciar Generación
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
