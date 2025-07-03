import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Clipboard,
  Edit,
  FileDown
} from "lucide-react";
import type { Product } from "@shared/schema";

interface StockMovement {
  id: number;
  productId: number;
  product: Product;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/inventory/movements"],
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: {
      productId: number;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      quantity: number;
      reason: string;
      notes?: string;
    }) => {
      return apiRequest("/api/inventory/movements", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsMovementDialogOpen(false);
      resetForm();
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario ha sido registrado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedProduct(null);
    setMovementType('IN');
    setQuantity("");
    setReason("");
    setNotes("");
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "low-stock") return matchesSearch && product.stock <= (product.minStock || 0);
    if (filterStatus === "out-of-stock") return matchesSearch && product.stock === 0;
    
    return matchesSearch;
  });

  const lowStockProducts = products.filter(p => {
    // Skip stock alerts for services and non-inventoriable products
    const isStockless = p.productType === 'service' || 
                       p.productType === 'non_inventoriable' || 
                       p.trackInventory === false;
    return !isStockless && p.stock <= (p.minStock || 0) && p.stock > 0;
  });
  const outOfStockProducts = products.filter(p => {
    // Skip stock alerts for services and non-inventoriable products
    const isStockless = p.productType === 'service' || 
                       p.productType === 'non_inventoriable' || 
                       p.trackInventory === false;
    return !isStockless && p.stock === 0;
  });
  const totalValue = products.reduce((sum, p) => sum + (p.stock * Number(p.cost || p.price)), 0);

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Sin Stock", variant: "destructive" as const };
    if (product.stock <= (product.minStock || 0)) return { label: "Stock Bajo", variant: "secondary" as const };
    return { label: "En Stock", variant: "default" as const };
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !reason) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'OUT' && quantityNum > selectedProduct.stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${selectedProduct.stock} unidades disponibles.`,
        variant: "destructive",
      });
      return;
    }

    createMovementMutation.mutate({
      productId: selectedProduct.id,
      type: movementType,
      quantity: quantityNum,
      reason,
      notes: notes || undefined,
    });
  };

  if (productsLoading) {
    return (
      <div className="w-full">
        <Header title="Inventario" subtitle="Control y gestión de stock" />
        <div className="p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando inventario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header title="Inventario" subtitle="Control y gestión de stock" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-20 space-y-6">
        {/* Resumen de inventario */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low-stock">Stock Bajo</SelectItem>
                <SelectItem value="out-of-stock">Sin Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Clipboard className="mr-2 h-4 w-4" />
                Registrar Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Producto</Label>
                  <Select 
                    value={selectedProduct?.id.toString() || ""} 
                    onValueChange={(value) => {
                      const product = products.find(p => p.id.toString() === value);
                      setSelectedProduct(product || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - Stock: {product.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Movimiento</Label>
                  <Select value={movementType} onValueChange={(value: 'IN' | 'OUT' | 'ADJUSTMENT') => setMovementType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Entrada</SelectItem>
                      <SelectItem value="OUT">Salida</SelectItem>
                      <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ingrese la cantidad..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Razón</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar razón..." />
                    </SelectTrigger>
                    <SelectContent>
                      {movementType === 'IN' && (
                        <>
                          <SelectItem value="purchase">Compra</SelectItem>
                          <SelectItem value="return">Devolución</SelectItem>
                          <SelectItem value="initial">Inventario Inicial</SelectItem>
                        </>
                      )}
                      {movementType === 'OUT' && (
                        <>
                          <SelectItem value="sale">Venta</SelectItem>
                          <SelectItem value="damaged">Producto Dañado</SelectItem>
                          <SelectItem value="expired">Producto Vencido</SelectItem>
                          <SelectItem value="loss">Pérdida</SelectItem>
                        </>
                      )}
                      {movementType === 'ADJUSTMENT' && (
                        <>
                          <SelectItem value="recount">Reconteo</SelectItem>
                          <SelectItem value="correction">Corrección</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsMovementDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMovementMutation.isPending}
                  >
                    {createMovementMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Stock de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Stock Mínimo</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const status = getStockStatus(product);
                      const totalValue = product.stock * parseFloat(String(product.cost || product.price));
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.code}</TableCell>
                          <TableCell className="text-right">{product.stock}</TableCell>
                          <TableCell className="text-right">{product.minStock}</TableCell>
                          <TableCell className="text-right">
                            ${(product.cost || product.price).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${totalValue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}