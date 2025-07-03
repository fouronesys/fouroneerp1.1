import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Receipt, 
  Printer,
  Calculator,
  Users,
  Package,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MobileCalculator from "@/components/MobileCalculator";
import InvoicePrintModal from "@/components/InvoicePrintModal";
import POSCustomerSelect from "@/components/POSCustomerSelect";
import { RNCCompanySuggestions } from "@/components/RNCCompanySuggestions";
import type { Product, Customer, POSPrintSettings, Company } from "@shared/schema";

import { useResponsiveLayout, getResponsiveClass, getCardGridClass } from "@/hooks/useResponsiveLayout";

// Funciones utilitarias - Multi-currency support
const formatCurrency = (amount: number, currency: string = 'DOP') => {
  const currencyMap = {
    'DOP': 'es-DO',
    'USD': 'en-US',
    'EUR': 'de-DE'
  };
  
  return new Intl.NumberFormat(currencyMap[currency as keyof typeof currencyMap] || 'es-DO', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string) => {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const data = await apiRequest(`/api/currency/convert`, {
      method: 'POST',
      body: { amount, fromCurrency, toCurrency }
    });
    return (data as any).convertedAmount;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
};

// Legacy function for backward compatibility
const formatDOP = (amount: number) => formatCurrency(amount, 'DOP');

const calculateITBIS = (subtotal: number, taxType: string = "itbis_18") => {
  switch (taxType) {
    case "included":
      // ITBIS incluído - devolver 0 para no sumar adicional
      return 0;
    case "no_itbis":
      // Sin ITBIS
      return 0;
    case "itbis_18":
      // 18% ITBIS
      return subtotal * 0.18;
    case "tip_10":
      // 10% propina
      return subtotal * 0.10;
    case "itbis_18_tip_10":
      // 18% ITBIS + 10% propina
      return subtotal * 0.28;
    default:
      return subtotal * 0.18;
  }
};

const generateNCF = (type: string, sequence: number) => {
  return `${type}${String(sequence).padStart(8, '0')}`;
};

// Tax calculations for individual products
const calculateItemTax = (unitPrice: number, quantity: number, discount: number, taxType: string) => {
  const subtotal = (unitPrice * quantity) * (1 - discount / 100);
  
  switch (taxType) {
    case "itbis_incluido":
      // ITBIS incluído - devolver 0 para no sumar adicional
      return 0;
    case "itbis_0":
      // Sin ITBIS
      return 0;
    case "itbis_18":
      // 18% ITBIS
      const itbis = subtotal * 0.18;
      return Math.ceil(itbis * 100) / 100;
    case "tip_10":
      // 10% propina
      const tip = subtotal * 0.10;
      return Math.ceil(tip * 100) / 100;
    case "itbis_18_tip_10":
      // 18% ITBIS + 10% propina
      const combined = subtotal * 0.28;
      return Math.ceil(combined * 100) / 100;
    case "global_18":
      // 18% ITBIS global
      const globalItbis = subtotal * 0.18;
      return Math.ceil(globalItbis * 100) / 100;
    default:
      const defaultItbis = subtotal * 0.18;
      return Math.ceil(defaultItbis * 100) / 100;
  }
};

// Función para calcular el ITBIS implícito cuando está incluido en el precio
const calculateIncludedITBIS = (totalWithTax: number) => {
  // El precio incluye 18% de ITBIS
  // Total = Base + (Base * 0.18) = Base * 1.18
  // ITBIS = Total - Base = Total - (Total / 1.18)
  const basePrice = totalWithTax / 1.18;
  const itbis = totalWithTax - basePrice;
  return Math.ceil(itbis * 100) / 100;
};

interface CartItem {
  product: {
    id: number;
    name: string;
    price: string;
    code: string;
  };
  quantity: number;
  subtotal: number;
  taxType?: string; // Tipo de impuesto individual por producto
}

export default function POS() {
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerRnc, setCustomerRnc] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [showCalculator, setShowCalculator] = useState(false);
  const [useFiscalReceipt, setUseFiscalReceipt] = useState(false);
  const [selectedNCFType, setSelectedNCFType] = useState("B02");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastSaleNumber, setLastSaleNumber] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("DOP");
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [taxType, setTaxType] = useState("itbis_18");
  const [itbisMode, setItbisMode] = useState("global_18"); // global o per_product
  const [itemTaxTypes, setItemTaxTypes] = useState<Record<number, string>>({}); // Tipos de impuesto por producto
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const layout = useResponsiveLayout();

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/current"],
  });

  const { data: printSettings } = useQuery<POSPrintSettings>({
    queryKey: ["/api/pos/print-settings"],
  });

  const { data: ncfSequences = [] } = useQuery({
    queryKey: ["/api/fiscal/ncf-sequences"],
  });

  const { data: currencyRates = [] } = useQuery({
    queryKey: ["/api/currency/rates"],
  });

  // POS customers query
  const { data: customersData = [], refetch: customersRefetch } = useQuery<Customer[]>({
    queryKey: ["/api/pos/customers"],
  });

  // Persistent cart from database
  const { data: cartData = [], isLoading: cartLoading } = useQuery<any[]>({
    queryKey: ["/api/pos/cart"],
  });

  // Transform cart data to match CartItem interface
  const cart: CartItem[] = Array.isArray(cartData) ? cartData.map((item: any) => ({
    product: {
      id: Number(item.productId) || 0,
      name: String(item.productName) || 'Producto',
      price: String(item.unitPrice) || '0',
      code: String(item.productCode) || '',
    },
    quantity: parseInt(item.quantity) || 1,
    subtotal: parseFloat(item.subtotal) || 0
  })) : [];

  // Función para verificar secuencias agotándose
  const checkLowSequences = () => {
    const alerts: string[] = [];
    if (Array.isArray(ncfSequences)) {
      ncfSequences.forEach((sequence: any) => {
        if (sequence.isActive) {
          const remaining = (sequence.maxSequence || 0) - (sequence.currentSequence || 0);
          if (remaining <= 0) {
            alerts.push(`Comprobantes ${sequence.ncfType} agotados`);
          } else if (remaining <= 10) {
            alerts.push(`Quedan ${remaining} comprobantes ${sequence.ncfType}`);
          }
        }
      });
    }
    return alerts;
  };

  const sequenceAlerts = checkLowSequences();

  // Productos filtrados
  const filteredProducts = (products || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Cálculo de ITBIS basado en el modo seleccionado
  const itbis = itbisMode === "per_product" 
    ? cart.reduce((sum, item) => {
        const itemTaxType = itemTaxTypes[item.product.id] || "itbis_18";
        const itemTax = calculateItemTax(
          parseFloat(item.product.price), 
          item.quantity, 
          0, // discount
          itemTaxType
        );
        return sum + itemTax;
      }, 0)
    : calculateITBIS(subtotal, taxType);
    
  const total = subtotal + itbis;
  const cashChange = cashReceived ? parseFloat(cashReceived) - total : 0;

  // Cart mutations for database persistence
  const addToCartMutation = useMutation({
    mutationFn: async (product: Product) => {
      // Add to persistent cart - backend handles stock management
      return apiRequest("/api/pos/cart", {
        method: "POST",
        body: {
          productId: product.id,
          quantity: 1,
          unitPrice: product.price,
          subtotal: parseFloat(product.price)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error agregando al carrito",
        description: "No se pudo agregar el producto",
        variant: "destructive",
      });
    }
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ cartId, quantity }: { cartId: number, quantity: number }) => {
      return apiRequest(`/api/pos/cart/${cartId}`, {
        method: "PATCH",
        body: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartId: number) => {
      return apiRequest(`/api/pos/cart/${cartId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/pos/cart", {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/cart"] });
    }
  });

  // Cart functions using mutations
  const addToCart = async (product: Product) => {
    // Skip stock validation for services and non-inventoriable products
    const isStockless = product.productType === 'service' || 
                       product.productType === 'non_inventoriable' || 
                       product.trackInventory === false;
    
    if (!isStockless) {
      const currentStock = parseInt(product.stock?.toString() || "0");
      const existingItem = cart.find(item => item.product.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      
      if (currentCartQuantity >= currentStock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${currentStock} unidades disponibles de ${product.name}`,
          variant: "destructive",
        });
        return;
      }
    }

    addToCartMutation.mutate(product);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cartItem = cartData.find((item: any) => item.productId === productId);
    if (cartItem) {
      updateCartMutation.mutate({ cartId: cartItem.id, quantity: newQuantity });
    }
  };

  const removeFromCart = (productId: number) => {
    const cartItem = cartData.find((item: any) => item.productId === productId);
    if (cartItem) {
      // Limpiar tipo de impuesto individual del producto removido
      setItemTaxTypes(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      removeFromCartMutation.mutate(cartItem.id);
    }
  };

  const clearCart = () => {
    setItemTaxTypes({}); // Limpiar tipos de impuesto individuales
    clearCartMutation.mutate();
  };

  // Actualizar tipo de impuesto individual por producto
  const updateItemTaxType = (productId: number, taxType: string) => {
    setItemTaxTypes(prev => ({
      ...prev,
      [productId]: taxType
    }));
  };

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) return;
    
    // Validar campos obligatorios para comprobante fiscal
    if (useFiscalReceipt) {
      if (!customerName || !customerRnc || !customerAddress) {
        alert("Para generar un comprobante fiscal es obligatorio completar:\n- Nombre del cliente\n- RNC/Cédula\n- Dirección\n\nSegún normativas de la DGII");
        return;
      }
      
      if (!selectedNCFType) {
        alert("Debe seleccionar un tipo de NCF para el comprobante fiscal");
        return;
      }
    }
    
    setIsProcessing(true);
    
    try {
      const saleData = {
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerRnc: useFiscalReceipt ? customerRnc : null,
        customerAddress: useFiscalReceipt ? customerAddress : null,
        subtotal: subtotal.toString(),
        itbis: itbis.toString(),
        total: total.toString(),
        paymentMethod,
        cashReceived: paymentMethod === "cash" ? cashReceived : null,
        cashChange: paymentMethod === "cash" ? cashChange.toString() : "0",
        useFiscalReceipt,
        ncfType: useFiscalReceipt ? selectedNCFType : null,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productCode: item.product.code || "",
          quantity: item.quantity.toString(),
          unitPrice: item.product.price,
          subtotal: item.subtotal.toString(),
          discount: "0"
        }))
      };

      // Guardar cliente si es nuevo y tiene datos
      if (customerName && (!Array.isArray(customersData) || !customersData.find((c: any) => 
        c.name === customerName && c.rnc === customerRnc
      ))) {
        try {
          const customerData = {
            name: customerName,
            phone: customerPhone || null,
            rnc: customerRnc || null,
            address: customerAddress || null,
            email: null,
            type: "individual"
          };
          
          console.log("Guardando nuevo cliente:", customerData);
          await apiRequest("/api/pos/customers", {
            method: "POST",
            body: customerData
          });
          
          // Refrescar lista de clientes
          customersRefetch();
        } catch (error) {
          console.error("Error guardando cliente:", error);
          // Continuar con la venta aunque falle guardar el cliente
        }
      }

      console.log("Enviando datos de venta:", saleData);
      const response = await apiRequest("/api/pos/sales", {
        method: "POST",
        body: saleData
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Venta creada:", result);
        
        // Guardar información para impresión
        setLastSaleId(result.id);
        setLastSaleNumber(result.saleNumber);
        
        // Limpiar carrito después de venta exitosa
        clearCart();
        setCashReceived("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerRnc("");
        setCustomerAddress("");
        setUseFiscalReceipt(false);
        setSelectedNCFType("");
        
        // Mostrar modal de impresión
        setShowPrintModal(true);
        
        console.log("Venta procesada exitosamente");
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error procesando venta:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="w-full">
        <Header title="Punto de Venta" subtitle="Sistema POS integrado" />
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Punto de Venta" subtitle="Sistema POS integrado" />
      
      {/* Alertas de secuencias NCF agotándose */}
      {sequenceAlerts.length > 0 && (
        <div className="px-3 sm:px-6 max-w-screen-2xl mx-auto">
          {sequenceAlerts.map((alert, index) => (
            <div key={index} className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{alert}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="p-1 sm:p-2 md:p-4 lg:p-6 w-full max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6 h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)] overflow-hidden">
          
          {/* Sección de Productos */}
          <div className="2xl:col-span-3 xl:col-span-2 lg:col-span-2 space-y-4 h-full overflow-hidden flex flex-col">
            
            {/* Tabs móviles */}
            {layout.isMobile && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="products">
                    <Package className="h-4 w-4 mr-2" />
                    Productos
                  </TabsTrigger>
                  <TabsTrigger value="cart">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Carrito ({cart.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Contenido de productos */}
            {(!layout.isMobile || activeTab === "products") && (
              <>
                {/* Buscador */}
                <Card>
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Grid de productos */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3 p-1">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3">
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2">
                                Código: {product.code}
                              </p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatDOP(parseFloat(product.price))}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                {product.productType === 'service' || product.productType === 'non_inventoriable' ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Servicio
                                  </Badge>
                                ) : (
                                  <Badge variant={parseInt(product.stock.toString()) > 10 ? "default" : "destructive"}>
                                    Stock: {product.stock}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              disabled={
                                // Only disable for regular products with no stock
                                (product.productType !== 'service' && 
                                 product.productType !== 'non_inventoriable' && 
                                 product.trackInventory !== false && 
                                 parseInt(product.stock.toString()) <= 0)
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sección de Carrito y Checkout Unificado */}
          <div className="2xl:col-span-2 xl:col-span-2 lg:col-span-1 h-full hidden lg:flex">
            
            {/* Contenedor unificado con scroll */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Carrito y Checkout ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1">Limpiar</span>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              {/* Área con scroll vertical */}
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 space-y-4 p-4">
                {/* Sección de Productos en Carrito */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos ({cart.length})
                  </h3>
                  
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <ShoppingCart className="h-6 w-6 mb-2" />
                      <p className="text-sm">Carrito vacío</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm leading-tight truncate">{item.product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {formatDOP(parseFloat(item.product.price))} c/u
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                              {formatDOP(item.subtotal)}
                            </span>
                          </div>
                          
                          {/* Selector individual de ITBIS cuando el modo es "por producto" */}
                          {itbisMode === "per_product" && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Tipo de ITBIS:
                              </label>
                              <Select 
                                value={itemTaxTypes[item.product.id] || "itbis_18"} 
                                onValueChange={(value) => updateItemTaxType(item.product.id, value)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="itbis_18">18% ITBIS</SelectItem>
                                  <SelectItem value="itbis_0">0% Exento</SelectItem>
                                  <SelectItem value="itbis_incluido">ITBIS Incluído</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sección de Cliente */}
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {useFiscalReceipt ? "Datos del Cliente (Obligatorio)" : "Cliente (Opcional)"}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Customer Search and Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">Buscar Cliente</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar por nombre, teléfono o RNC..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Lista de resultados filtrados */}
                      {customerSearchTerm && customersData && customersData.length > 0 && (
                        <div className="max-h-32 overflow-y-auto border rounded-md bg-white dark:bg-gray-800">
                          {customersData
                            .filter((customer: any) => 
                              customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                              customer.phone?.includes(customerSearchTerm) ||
                              customer.rnc?.includes(customerSearchTerm)
                            )
                            .slice(0, 5)
                            .map((customer: any) => (
                              <div 
                                key={customer.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                                onClick={() => {
                                  setCustomerName(customer.name || "");
                                  setCustomerPhone(customer.phone || "");
                                  setCustomerRnc(customer.rnc || "");
                                  setCustomerAddress(customer.address || "");
                                  setCustomerSearchTerm("");
                                  toast({
                                    title: "Cliente seleccionado",
                                    description: `${customer.name}`,
                                  });
                                }}
                              >
                                <div className="text-sm font-medium">{customer.name}</div>
                                <div className="text-xs text-gray-500">
                                  {customer.phone} {customer.rnc ? `• RNC: ${customer.rnc}` : ''}
                                </div>
                              </div>
                            ))}
                          
                          {/* Opción para crear nuevo */}
                          <div 
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-blue-600 dark:text-blue-400 border-t"
                            onClick={() => {
                              setCustomerName("");
                              setCustomerPhone("");
                              setCustomerRnc("");
                              setCustomerAddress("");
                              setCustomerSearchTerm("");
                            }}
                          >
                            <div className="text-sm font-medium flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Crear nuevo cliente
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      {useFiscalReceipt ? (
                        <RNCCompanySuggestions
                          label=""
                          placeholder="Buscar empresa por nombre... *"
                          value={customerName}
                          onChange={setCustomerName}
                          onCompanySelect={(company) => {
                            setCustomerName(company.name);
                            setCustomerRnc(company.rnc);
                            toast({
                              title: "Empresa seleccionada",
                              description: `${company.name} - RNC: ${company.rnc}`,
                            });
                          }}
                          className={!customerName ? "border-red-300" : ""}
                        />
                      ) : (
                        <Input
                          placeholder="Nombre del cliente"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      )}
                      <Input
                        placeholder="Teléfono"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    
                      {/* Campos obligatorios para comprobante fiscal */}
                      {useFiscalReceipt && (
                        <>
                          <div className="flex gap-2">
                            <Input
                              placeholder="RNC/Cédula *"
                              value={customerRnc}
                              onChange={(e) => setCustomerRnc(e.target.value)}
                              className={!customerRnc ? "border-red-300 flex-1" : "flex-1"}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!customerRnc || customerRnc.length < 9) return;
                                
                                try {
                                  const response = await fetch('/api/pos/customers/search-rnc', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({ rnc: customerRnc })
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    if (result.exists && result.customer) {
                                      // Customer already exists, fill with existing data
                                      setCustomerName(result.customer.name || "");
                                      setCustomerPhone(result.customer.phone || "");
                                      setCustomerAddress(result.customer.address || "");
                                      toast({
                                        title: "Cliente existente",
                                        description: "Datos cargados automáticamente",
                                      });
                                    } else if (result.valid && result.rncData) {
                                      // RNC is valid, auto-fill with DGII data
                                      setCustomerName(result.rncData.name || "");
                                      setCustomerAddress(result.rncData.businessName || "");
                                      toast({
                                        title: "RNC válido",
                                        description: "Datos completados automáticamente",
                                      });
                                    } else {
                                      toast({
                                        title: "RNC no encontrado",
                                        description: result.message || "RNC no encontrado en el registro DGII",
                                        variant: "destructive",
                                      });
                                    }
                                  } else {
                                    const errorData = await response.json();
                                    toast({
                                      title: "Error de validación",
                                      description: errorData.message || "Error al verificar RNC",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  console.error("Error validating RNC:", error);
                                  toast({
                                    title: "Error de conexión",
                                    description: "No se pudo verificar el RNC",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={!customerRnc || customerRnc.length < 9}
                            >
                              <Search className="h-4 w-4 mr-1" />
                              Verificar
                            </Button>
                          </div>
                          <Input
                            placeholder="Dirección completa *"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className={!customerAddress ? "border-red-300" : ""}
                          />
                          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            <strong>DGII:</strong> Los campos marcados con * son obligatorios para comprobantes fiscales
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección de Impuestos */}
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Modo de Aplicación ITBIS</label>
                    <Select value={itbisMode} onValueChange={setItbisMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global_18">Global - 18% ITBIS</SelectItem>
                        <SelectItem value="global_0">Global - Sin ITBIS</SelectItem>
                        <SelectItem value="global_included">Global - ITBIS Incluído</SelectItem>
                        <SelectItem value="per_product">Por Producto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Solo mostrar selector de tipo cuando no es "por producto" */}
                  {itbisMode !== "per_product" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo de ITBIS/Propina</label>
                      <Select value={taxType} onValueChange={setTaxType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="included">ITBIS Incluído</SelectItem>
                          <SelectItem value="no_itbis">Sin ITBIS</SelectItem>
                          <SelectItem value="itbis_18">18% ITBIS</SelectItem>
                          <SelectItem value="tip_10">10% Propina</SelectItem>
                          <SelectItem value="itbis_18_tip_10">18% ITBIS + 10% Propina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Sección de Totales y Pago */}
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Totales
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatDOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {taxType === "included" ? "ITBIS (Incluído)" :
                         taxType === "no_itbis" ? "Sin ITBIS" :
                         taxType === "itbis_18" ? "ITBIS (18%)" :
                         taxType === "tip_10" ? "Propina (10%)" :
                         taxType === "itbis_18_tip_10" ? "ITBIS + Propina (28%)" :
                         "ITBIS (18%)"}:
                      </span>
                      <span>{formatDOP(itbis)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {formatDOP(total)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Moneda</label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                          <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Método de Pago</label>
                      <Select value={paymentMethod} onValueChange={(value: "cash" | "card") => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Efectivo
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Tarjeta
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Opciones de Comprobante Fiscal */}
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <input
                          id="useFiscalReceipt"
                          type="checkbox"
                          checked={useFiscalReceipt}
                          onChange={(e) => setUseFiscalReceipt(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="useFiscalReceipt" className="text-sm font-medium">
                          Generar Comprobante Fiscal
                        </label>
                      </div>

                      {useFiscalReceipt && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tipo de NCF</label>
                          <Select value={selectedNCFType} onValueChange={setSelectedNCFType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="B01">B01 - Crédito Fiscal</SelectItem>
                              <SelectItem value="B02">B02 - Consumidor Final</SelectItem>
                              <SelectItem value="B03">B03 - Nota de Débito</SelectItem>
                              <SelectItem value="B04">B04 - Nota de Crédito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {paymentMethod === "cash" && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Efectivo Recibido</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                        />
                        {cashReceived && parseFloat(cashReceived) >= total && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Cambio: {formatDOP(cashChange)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setShowCalculator(true)}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculadora
                      </Button>
                      <Button
                        onClick={processSale}
                        disabled={cart.length === 0 || isProcessing || (paymentMethod === "cash" && (!cashReceived || parseFloat(cashReceived) < total))}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                          <Receipt className="h-4 w-4 mr-2" />
                        )}
                        {isProcessing ? "Procesando..." : "Procesar Venta"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Content móvil para carrito */}
          {layout.isMobile && activeTab === "cart" && (
            <div className="h-full flex flex-col space-y-4 overflow-hidden">
              {/* Cart Items - Scrollable */}
              <div className="flex-1 overflow-hidden">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Carrito ({cart.length})</span>
                      {cart.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCart}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Carrito vacío</p>
                    ) : (
                      cart.map((item) => (
                        <div key={item.product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">{item.product.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatDOP(parseFloat(item.product.price))} c/u
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-10 w-10 p-0 touch-manipulation"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-medium text-base w-12 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="h-10 w-10 p-0 touch-manipulation"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="font-bold text-green-600">
                              {formatDOP(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Section - Fixed at bottom */}
              <div className="flex-shrink-0">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatDOP(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ITBIS:</span>
                        <span className="font-medium">{formatDOP(itbis)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-green-600 dark:text-green-400">{formatDOP(total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer inputs */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre del cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        size="sm"
                      />
                      <Input
                        placeholder="Teléfono"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        size="sm"
                      />
                    </div>

                    {/* Payment method */}
                    <div className="flex gap-2">
                      <Button
                        variant={paymentMethod === "cash" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("cash")}
                        className="flex-1"
                        size="sm"
                      >
                        <Banknote className="h-4 w-4 mr-1" />
                        Efectivo
                      </Button>
                      <Button
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("card")}
                        className="flex-1"
                        size="sm"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Tarjeta
                      </Button>
                    </div>

                    {/* Fiscal Receipt Options for Mobile */}
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <input
                          id="useFiscalReceiptMobile"
                          type="checkbox"
                          checked={useFiscalReceipt}
                          onChange={(e) => setUseFiscalReceipt(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="useFiscalReceiptMobile" className="text-sm font-medium">
                          Generar Comprobante Fiscal
                        </label>
                      </div>

                      {useFiscalReceipt && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium mb-1 block">Tipo de NCF</label>
                          <Select value={selectedNCFType} onValueChange={setSelectedNCFType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="B01">B01 - Crédito Fiscal</SelectItem>
                              <SelectItem value="B02">B02 - Consumidor Final</SelectItem>
                              <SelectItem value="B03">B03 - Nota de Débito</SelectItem>
                              <SelectItem value="B04">B04 - Nota de Crédito</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Additional customer fields for fiscal receipt */}
                          <div className="space-y-2 mt-3">
                            <Input
                              placeholder="RNC/Cédula del cliente *"
                              value={customerRnc}
                              onChange={(e) => setCustomerRnc(e.target.value)}
                              className={!customerRnc ? "border-red-300" : ""}
                              size="sm"
                            />
                            <Input
                              placeholder="Dirección del cliente *"
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              className={!customerAddress ? "border-red-300" : ""}
                              size="sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {paymentMethod === "cash" && (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Efectivo recibido"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        size="sm"
                      />
                    )}

                    {/* Process sale button */}
                    <Button
                      onClick={processSale}
                      disabled={cart.length === 0 || isProcessing || (paymentMethod === "cash" && (!cashReceived || parseFloat(cashReceived) < total))}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Receipt className="h-4 w-4 mr-2" />
                      )}
                      {isProcessing ? "Procesando..." : "Procesar Venta"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <MobileCalculator 
          isOpen={showCalculator} 
          onClose={() => setShowCalculator(false)} 
        />

        {lastSaleId && (
          <InvoicePrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            saleId={lastSaleId}
            saleNumber={lastSaleNumber}
          />
        )}
      </div>
    </div>
  );
}