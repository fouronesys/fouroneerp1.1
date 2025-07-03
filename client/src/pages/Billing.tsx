import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RNCLookup } from "@/components/RNCLookup";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { 
  FileText, Plus, Search, Edit, Eye, Download, Send, Printer, 
  Calculator, Users, Package, Calendar, AlertTriangle, CheckCircle,
  DollarSign, Receipt, Building, User, CreditCard, Clock, Filter,
  ArrowUp, ArrowDown, RotateCcw, Copy, Trash2, ExternalLink,
  Building2, MapPin, Phone, Mail
} from "lucide-react";

// Enhanced Invoice Schema with Dominican Fiscal Requirements
const invoiceSchema = z.object({
  customerId: z.string().min(1, "El cliente es requerido"),
  ncfType: z.enum(["B01", "B02", "B14", "B15"], {
    required_error: "El tipo de NCF es requerido"
  }),
  paymentMethod: z.enum(["cash", "credit_card", "debit_card", "check", "bank_transfer", "credit"]).default("cash"),
  paymentTerms: z.number().min(0).default(0), // days
  dueDate: z.string().optional(),
  currency: z.enum(["DOP", "USD", "EUR"]).default("DOP"),
  exchangeRate: z.number().min(0.01).default(1),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  // Dominican Republic Fiscal Fields
  customerRnc: z.string().optional(),
  customerType: z.enum(["final_consumer", "business", "government", "tax_exempt"]).default("final_consumer"),
  itbisMode: z.enum(["per_product", "global_18", "global_0", "exempt"]).default("per_product"),
  salesCondition: z.enum(["contado", "credito", "consignacion", "regalo"]).default("contado"),
  deliveryCondition: z.enum(["local", "envio", "retiro", "exportacion"]).default("local"),
  // Item management will be handled separately
  items: z.array(z.object({
    productId: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().min(0.001),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    taxType: z.enum(["itbis_18", "itbis_0", "exempt"]).default("itbis_18")
  })).min(1, "Debe agregar al menos un producto")
});

// NCF Status Schema for batch management
const ncfBatchSchema = z.object({
  ncfType: z.enum(["B01", "B02", "B14", "B15"]),
  startNumber: z.number().min(1),
  endNumber: z.number().min(1),
  currentNumber: z.number().min(1),
  authorizationDate: z.string(),
  expirationDate: z.string(),
  isActive: z.boolean().default(true)
});

const Billing = () => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showNCFBatchDialog, setShowNCFBatchDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [newCustomerRNC, setNewCustomerRNC] = useState("");
  const [newCustomerData, setNewCustomerData] = useState<any>({});
  const [showQuickCustomerCreate, setShowQuickCustomerCreate] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: ncfSequences } = useQuery({
    queryKey: ['/api/fiscal/ncf-sequences'],
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['/api/payment-methods'],
  });

  const { data: taxRates } = useQuery({
    queryKey: ['/api/tax-rates'],
  });

  // Forms
  const invoiceForm = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      ncfType: "B01",
      paymentMethod: "cash",
      paymentTerms: 0,
      currency: "DOP",
      exchangeRate: 1,
      notes: "",
      internalNotes: "",
      // Dominican Republic Fiscal Fields
      customerRnc: "",
      customerType: "final_consumer",
      itbisMode: "per_product",
      salesCondition: "contado",
      deliveryCondition: "local",
      items: []
    }
  });

  const ncfBatchForm = useForm({
    resolver: zodResolver(ncfBatchSchema),
    defaultValues: {
      ncfType: "B01",
      startNumber: 1,
      endNumber: 1000,
      currentNumber: 1,
      isActive: true
    }
  });

  // PDF generation mutation
  const generatePDFMutation = useMutation({
    mutationFn: async ({ invoiceId, format }: { invoiceId: number; format: 'A4' | 'letter' }) => {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?format=${format}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      return response.text();
    },
    onSuccess: (htmlContent) => {
      // Open HTML in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Auto-print dialog
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      }
      
      toast({
        title: "Factura generada",
        description: "Se ha abierto la factura para imprimir o guardar como PDF.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF de la factura.",
        variant: "destructive",
      });
    },
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ ...data, items: invoiceItems })
    }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/ncf-sequences'] });
      setShowInvoiceDialog(false);
      setInvoiceItems([]);
      invoiceForm.reset();
      
      toast({ 
        title: "Factura creada exitosamente",
        description: "Generando impresión automática..."
      });

      // Auto-redirect to print (default to A4 format)
      if (response?.id) {
        setTimeout(() => {
          generatePDFMutation.mutate({ 
            invoiceId: response.id, 
            format: 'A4' 
          });
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error al crear factura", description: error.message, variant: "destructive" });
    }
  });

  const createNCFBatchMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/fiscal/ncf-sequences', {
      method: 'POST',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal/ncf-sequences'] });
      setShowNCFBatchDialog(false);
      ncfBatchForm.reset();
      toast({ title: "Lote de NCF creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear lote NCF", description: error.message, variant: "destructive" });
    }
  });

  const payInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/invoices/${data.invoiceId}/payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      toast({ title: "Pago registrado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al registrar pago", description: error.message, variant: "destructive" });
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (newCustomer: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      // Auto-select the newly created customer
      invoiceForm.setValue("customerId", newCustomer.id.toString());
      handleCustomerChange(newCustomer.id.toString());
      toast({ title: "Cliente creado y seleccionado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear cliente", description: error.message, variant: "destructive" });
    }
  });

  // NCF Type configurations
  const getNCFTypeConfig = (type: string) => {
    const configs = {
      B01: {
        name: "Crédito Fiscal",
        description: "Para contribuyentes con RNC",
        color: "bg-blue-100 text-blue-800",
        requiresRNC: true,
        allowedTax: ["itbis_18", "itbis_0"]
      },
      B02: {
        name: "Consumidor Final",
        description: "Para consumidores finales",
        color: "bg-green-100 text-green-800",
        requiresRNC: false,
        allowedTax: ["itbis_18", "itbis_0"]
      },
      B14: {
        name: "Regímenes Especiales",
        description: "Para contribuyentes especiales",
        color: "bg-purple-100 text-purple-800",
        requiresRNC: true,
        allowedTax: ["itbis_18", "itbis_0", "exempt"]
      },
      B15: {
        name: "Gubernamental",
        description: "Para instituciones gubernamentales",
        color: "bg-orange-100 text-orange-800",
        requiresRNC: true,
        allowedTax: ["exempt"]
      }
    };
    return configs[type as keyof typeof configs] || configs.B01;
  };

  // Tax calculations
  const calculateItemTax = (unitPrice: number, quantity: number, discount: number, taxType: string) => {
    const subtotal = (unitPrice * quantity) * (1 - discount / 100);
    
    switch (taxType) {
      case "included":
        // ITBIS incluído - devolver 0 para no sumar adicional
        return 0;
      case "no_itbis":
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

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const itbisMode = invoiceForm.watch("itbisMode") || "per_product";

    invoiceItems.forEach(item => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      
      // Use global tax type if not "per_product", otherwise use individual item tax type
      const taxTypeToUse = itbisMode === "per_product" ? item.taxType : itbisMode;
      const itemTax = calculateItemTax(item.unitPrice, item.quantity, item.discount, taxTypeToUse);

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  // Customer selection and NCF auto-determination
  const handleCustomerChange = (customerId: string) => {
    const customer = Array.isArray(customers) ? customers.find((c: any) => c.id.toString() === customerId) : null;
    setSelectedCustomer(customer);
    
    if (customer) {
      // Auto-determine NCF type based on customer
      let suggestedNCF = "B02"; // Default to consumer final
      
      if (customer.rnc && customer.rnc.trim()) {
        // Customer has RNC - can use B01 (Credit Fiscal)
        suggestedNCF = "B01";
      }
      
      if (customer.type === "government") {
        suggestedNCF = "B15"; // Government
      }
      
      if (customer.customerGroup === "special_regime") {
        suggestedNCF = "B14"; // Special regimes
      }

      invoiceForm.setValue("ncfType", suggestedNCF as any);
      invoiceForm.setValue("paymentTerms", customer.paymentTerms || 0);
    }
  };

  // Invoice item management
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, {
      productId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxType: "itbis_18"
    }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate from product if product is selected
    if (field === "productId" && value) {
      const product = Array.isArray(products) ? products.find((p: any) => p.id.toString() === value) : null;
      if (product) {
        updated[index] = {
          ...updated[index],
          description: product.name,
          unitPrice: parseFloat(product.price) || 0,
          taxType: product.taxType || "itbis_18"
        };
      }
    }
    
    setInvoiceItems(updated);
  };

  // Status badges and formatting
  const getInvoiceStatusBadge = (status: string) => {
    const statuses = {
      draft: { label: "Borrador", color: "bg-gray-100 text-gray-800" },
      sent: { label: "Enviada", color: "bg-blue-100 text-blue-800" },
      paid: { label: "Pagada", color: "bg-green-100 text-green-800" },
      overdue: { label: "Vencida", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-500" }
    };
    const statusConfig = statuses[status as keyof typeof statuses] || statuses.draft;
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statuses = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
      partial: { label: "Parcial", color: "bg-orange-100 text-orange-800" },
      paid: { label: "Pagado", color: "bg-green-100 text-green-800" },
      overdue: { label: "Vencido", color: "bg-red-100 text-red-800" }
    };
    const statusConfig = statuses[status as keyof typeof statuses] || statuses.pending;
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = "DOP") => {
    const locales = { DOP: "es-DO", USD: "en-US", EUR: "de-DE" };
    const locale = locales[currency as keyof typeof locales] || "es-DO";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (isLoadingInvoices || isLoadingCustomers || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Facturación y NCF" />
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
      <Header title="Facturación y NCF" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Receipt className="h-8 w-8 text-blue-600" />
                Facturación Fiscal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Sistema de facturación con NCF dominicano y cumplimiento DGII
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowNCFBatchDialog(true)} variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Gestionar NCF
              </Button>
              <Button onClick={() => setShowInvoiceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="ncf-management" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              NCF Management
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reportes DGII
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Facturas Emitidas
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las facturas</SelectItem>
                        <SelectItem value="B01">Solo B01 - Crédito Fiscal</SelectItem>
                        <SelectItem value="B02">Solo B02 - Consumidor Final</SelectItem>
                        <SelectItem value="B14">Solo B14 - Regímenes Especiales</SelectItem>
                        <SelectItem value="B15">Solo B15 - Gubernamental</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="paid">Pagadas</SelectItem>
                        <SelectItem value="overdue">Vencidas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowInvoiceDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Factura
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(invoices) && invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay facturas registradas</p>
                      <Button 
                        onClick={() => setShowInvoiceDialog(true)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Crear primera factura
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número / NCF</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(invoices) ? invoices.filter((invoice: any) => {
                            if (invoiceFilter !== "all" && invoice.ncfType !== invoiceFilter) return false;
                            if (paymentStatus !== "all" && invoice.paymentStatus !== paymentStatus) return false;
                            return true;
                          }).map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{invoice.number}</div>
                                  <div className="text-sm text-gray-500">
                                    NCF: {invoice.ncfNumber}
                                  </div>
                                  <Badge className={getNCFTypeConfig(invoice.ncfType).color}>
                                    {invoice.ncfType}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{invoice.customer?.name}</div>
                                  {invoice.customer?.rnc && (
                                    <div className="text-sm text-gray-500">
                                      RNC: {invoice.customer.rnc}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div>{new Date(invoice.issueDate).toLocaleDateString()}</div>
                                  {invoice.dueDate && (
                                    <div className="text-sm text-gray-500">
                                      Vence: {new Date(invoice.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatCurrency(invoice.total, invoice.currency)}
                                </div>
                                {invoice.totalTax > 0 && (
                                  <div className="text-sm text-gray-500">
                                    ITBIS: {formatCurrency(invoice.totalTax, invoice.currency)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {getInvoiceStatusBadge(invoice.status)}
                              </TableCell>
                              <TableCell>
                                {getPaymentStatusBadge(invoice.paymentStatus)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {invoice.paymentStatus !== "paid" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedInvoice(invoice);
                                        setShowPaymentDialog(true);
                                      }}
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : null}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NCF Management Tab */}
          <TabsContent value="ncf-management" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gestión de Secuencias NCF
                  </CardTitle>
                  <Button onClick={() => setShowNCFBatchDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Lote NCF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.isArray(ncfSequences) ? ncfSequences.map((sequence: any) => {
                    const config = getNCFTypeConfig(sequence.ncfType);
                    const usage = ((sequence.currentNumber - sequence.startNumber) / (sequence.endNumber - sequence.startNumber)) * 100;
                    const remaining = sequence.endNumber - sequence.currentNumber + 1;
                    const isExpiringSoon = new Date(sequence.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <Card key={sequence.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className={config.color}>
                                {sequence.ncfType}
                              </Badge>
                              <Badge variant={sequence.isActive ? "default" : "secondary"}>
                                {sequence.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold">{config.name}</h3>
                              <p className="text-sm text-gray-600">{config.description}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progreso:</span>
                                <span>{usage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(usage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p><strong>Actual:</strong> {(sequence.currentNumber || 0).toLocaleString()}</p>
                                <p><strong>Restantes:</strong> {remaining.toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <p><strong>Vigencia:</strong></p>
                              <p>{new Date(sequence.authorizationDate).toLocaleDateString()} - {new Date(sequence.expirationDate).toLocaleDateString()}</p>
                              {isExpiringSoon && (
                                <div className="flex items-center gap-1 text-orange-600 mt-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Próximo a vencer</span>
                                </div>
                              )}
                            </div>
                            
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Gestionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Módulo de pagos en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reportes DGII
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Reporte 606</span>
                    <span className="text-xs text-gray-500">Comprobantes Emitidos</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Reporte 607</span>
                    <span className="text-xs text-gray-500">Comprobantes Recibidos</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>IT-1</span>
                    <span className="text-xs text-gray-500">Información de ITBIS</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? "Editar Factura" : "Nueva Factura"}
              </DialogTitle>
              <DialogDescription>
                Complete los datos de la factura con NCF automático
              </DialogDescription>
            </DialogHeader>

            <Form {...invoiceForm}>
              <form onSubmit={invoiceForm.handleSubmit((data) => createInvoiceMutation.mutate(data))} className="space-y-6">
                {/* Customer and NCF Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <div className="space-y-2">
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleCustomerChange(value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente existente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(customers) && customers.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  <div className="flex flex-col">
                                    <span>{customer.name}</span>
                                    {customer.rnc && (
                                      <span className="text-sm text-gray-500">RNC: {customer.rnc}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>O busque por RNC para autocompletar:</span>
                          </div>
                          
                          <RNCLookup
                            placeholder="Buscar empresa por RNC o nombre..."
                            onRNCChange={(rnc) => {
                              setNewCustomerRNC(rnc);
                            }}
                            onCompanyDataChange={(data) => {
                              setNewCustomerData({
                                name: data.razonSocial || data.businessName || "",
                                businessName: data.razonSocial || data.businessName || "",
                                rnc: data.rnc || newCustomerRNC,
                                nombreComercial: data.nombreComercial,
                                estado: data.estado,
                                categoria: data.categoria
                              });
                              
                              // Show quick customer creation option
                              if ((data.razonSocial || data.businessName) && Array.isArray(customers) && !customers.find((c: any) => c.rnc === data.rnc)) {
                                setShowQuickCustomerCreate(true);
                              }
                            }}
                            showSuggestions={true}
                            className="w-full"
                          />
                          
                          {showQuickCustomerCreate && newCustomerData.name && (
                            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                    Empresa encontrada: {newCustomerData.name}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    RNC: {newCustomerData.rnc} • {newCustomerData.estado}
                                  </p>
                                </div>
                                <Button 
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    // Create customer quickly with DGII data
                                    const customerData = {
                                      ...newCustomerData,
                                      customerType: "business",
                                      phone: "",
                                      email: "",
                                      address: "",
                                      city: "",
                                      province: "",
                                      country: "República Dominicana",
                                      status: "active"
                                    };
                                    createCustomerMutation.mutate(customerData);
                                    setShowQuickCustomerCreate(false);
                                  }}
                                  disabled={createCustomerMutation.isPending}
                                >
                                  {createCustomerMutation.isPending ? "Creando..." : "Crear Cliente"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={invoiceForm.control}
                    name="ncfType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de NCF</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["B01", "B02", "B14", "B15"].map((type) => {
                              const config = getNCFTypeConfig(type);
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex flex-col">
                                    <span>{type} - {config.name}</span>
                                    <span className="text-sm text-gray-500">{config.description}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dominican Republic Fiscal Fields */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">📋 Información Fiscal Dominicana</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={invoiceForm.control}
                      name="customerRnc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RNC/Cédula del Cliente *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="000000000 o 00000000000"
                              {...field}
                              className={!field.value && invoiceForm.getValues("ncfType") === "B01" ? "border-red-300" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Requerido para NCF tipo B01 (Crédito Fiscal)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={invoiceForm.control}
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Cliente</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "final_consumer"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="final_consumer">Consumidor Final</SelectItem>
                              <SelectItem value="business">Empresa/Negocio</SelectItem>
                              <SelectItem value="government">Entidad Gubernamental</SelectItem>
                              <SelectItem value="tax_exempt">Exento de Impuestos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={invoiceForm.control}
                      name="itbisMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aplicación de ITBIS</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "per_product"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="per_product">Por Producto</SelectItem>
                              <SelectItem value="included">ITBIS Incluído</SelectItem>
                              <SelectItem value="no_itbis">Sin ITBIS</SelectItem>
                              <SelectItem value="global_18">18% ITBIS</SelectItem>
                              <SelectItem value="tip_10">10% Propina</SelectItem>
                              <SelectItem value="itbis_18_tip_10">18% ITBIS + 10% Propina</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Método de cálculo del ITBIS para esta factura
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={invoiceForm.control}
                      name="salesCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condición de Venta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "contado"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="contado">Contado</SelectItem>
                              <SelectItem value="credito">Crédito</SelectItem>
                              <SelectItem value="consignacion">Consignación</SelectItem>
                              <SelectItem value="regalo">Regalo/Muestra</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={invoiceForm.control}
                      name="deliveryCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condición de Entrega</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "local"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="local">Entrega Local</SelectItem>
                              <SelectItem value="envio">Envío a Domicilio</SelectItem>
                              <SelectItem value="retiro">Retiro en Tienda</SelectItem>
                              <SelectItem value="exportacion">Exportación</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Payment and Currency Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                            <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                            <SelectItem value="check">Cheque</SelectItem>
                            <SelectItem value="bank_transfer">Transferencia</SelectItem>
                            <SelectItem value="credit">Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={invoiceForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos de Pago (días)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={invoiceForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                            <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Productos / Servicios</h3>
                    <Button type="button" onClick={addInvoiceItem} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {invoiceItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <Label>Producto</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateInvoiceItem(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(products) && products.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - {formatCurrency(parseFloat(product.price))}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <Label>Precio Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <Label>Descuento %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => updateInvoiceItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {invoiceForm.watch("itbisMode") === "per_product" && (
                          <div>
                            <Label>ITBIS</Label>
                            <Select 
                              value={item.taxType} 
                              onValueChange={(value) => updateInvoiceItem(index, 'taxType', value)}
                            >
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

                      <div className="flex justify-between items-center">
                        <div>
                          <Input
                            placeholder="Descripción del producto o servicio"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {invoiceItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay productos agregados</p>
                      <Button type="button" onClick={addInvoiceItem} variant="outline" className="mt-2">
                        Agregar primer producto
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                {invoiceItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="w-80 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(calculateInvoiceTotals().subtotal)}</span>
                        </div>
                        {calculateInvoiceTotals().totalDiscount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Descuento:</span>
                            <span>-{formatCurrency(calculateInvoiceTotals().totalDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>ITBIS:</span>
                          <span>{formatCurrency(calculateInvoiceTotals().totalTax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(calculateInvoiceTotals().total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (Públicas)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas que aparecerán en la factura..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={invoiceForm.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Internas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas internas (no aparecen en la factura)..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createInvoiceMutation.isPending || invoiceItems.length === 0}>
                    {createInvoiceMutation.isPending ? "Creando..." : editingInvoice ? "Actualizar" : "Crear Factura"}
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

export default Billing;