import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Download, 
  Send,
  Calendar,
  DollarSign,
  Eye,
  Plus,
  CheckCircle,
  Minus
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [invoiceData, setInvoiceData] = useState({
    customerId: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    notes: "",
    items: [{ productId: "", quantity: 1, price: 0, description: "" }],
    // Dominican Republic Fiscal Fields
    customerRncCedula: "",
    customerName: "",
    customerStatus: "",
    customerType: "final_consumer",
    ncfType: "B02",
    itbisApplicationMode: "per_product",
    salesCondition: "cash",
    deliveryCondition: "local_delivery"
  });
  const [rncValidating, setRncValidating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pdfFormat, setPdfFormat] = useState<'A4' | 'letter'>('A4');
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices", filterStatus, dateRange],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // RNC validation mutation (same as in Customers form)
  const validateRNCMutation = useMutation({
    mutationFn: async (rnc: string) => {
      const response = await fetch(`/api/dgii/rnc-lookup?rnc=${encodeURIComponent(rnc)}`, {
        credentials: 'include'
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        // Auto-fill customer data from RNC lookup
        setInvoiceData(prev => ({
          ...prev,
          customerRncCedula: data.data.rnc || prev.customerRncCedula,
          customerName: data.data.razonSocial || "",
          customerStatus: data.data.estado || "ACTIVO",
          customerType: data.data.estado === "ACTIVO" ? "business" : "final_consumer"
        }));

        // Check if customer already exists by RNC
        const existingCustomer = Array.isArray(customers) ? customers.find((c: any) => c.rnc === data.data.rnc) : null;
        if (existingCustomer) {
          // Auto-select existing customer
          setInvoiceData(prev => ({ ...prev, customerId: existingCustomer.id.toString() }));
          toast({
            title: "Cliente encontrado",
            description: `Cliente "${existingCustomer.name}" seleccionado automáticamente.`,
          });
        }

        toast({ 
          title: "RNC Válido", 
          description: `Contribuyente: ${data.data.razonSocial}` 
        });
      } else {
        toast({ 
          title: "RNC No Válido", 
          description: data.message || "El RNC no existe en el registro de DGII",
          variant: "destructive" 
        });
      }
      setRncValidating(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error validando RNC", 
        description: error.message, 
        variant: "destructive" 
      });
      setRncValidating(false);
    }
  });

  // Utility function to validate RNC
  const validateRNC = (rnc: string) => {
    if (rnc && rnc.length >= 9) {
      setRncValidating(true);
      validateRNCMutation.mutate(rnc);
    }
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

  // Mark invoice as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return await apiRequest(`/api/invoices/${invoiceId}/status`, {
        method: 'PUT',
        body: { status: 'paid' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Factura marcada como pagada",
        description: "El estado de la factura se ha actualizado correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Email invoice mutation
  const emailInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, emailData }: { invoiceId: number; emailData: any }) => {
      return apiRequest(`/api/invoices/${invoiceId}/email`, {
        method: "POST",
        body: emailData
      });
    },
    onSuccess: () => {
      toast({
        title: "Factura enviada",
        description: "La factura se ha enviado por correo exitosamente.",
      });
      setShowEmailModal(false);
      setEmailData({ to: "", subject: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar la factura por correo.",
        variant: "destructive",
      });
    },
  });

  // Download PDF mutation
  const downloadPDFMutation = useMutation({
    mutationFn: async ({ invoiceId, format }: { invoiceId: number; format: 'A4' | 'letter' }) => {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?format=${format}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      return response.text(); // Get HTML content
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

  // Action handlers
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDownloadPDF = (invoice: any) => {
    setSelectedInvoice(invoice);
    downloadPDFMutation.mutate({ 
      invoiceId: invoice.id, 
      format: pdfFormat 
    });
  };

  const handleEmailInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEmailData({
      to: invoice.customerEmail || "",
      subject: `Factura ${invoice.number} - ${invoice.customerName}`,
      message: `Estimado/a cliente,\n\nAdjunto encontrará la factura ${invoice.number} por un monto total de RD$${parseFloat(invoice.total).toLocaleString()}.\n\nGracias por su preferencia.\n\nSaludos cordiales,\nFour One Solutions`
    });
    setShowEmailModal(true);
  };

  // Calculate real metrics from invoice data
  const metrics = useMemo(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return {
        totalBilled: 0,
        pending: 0,
        pendingCount: 0,
        overdue: 0,
        overdueCount: 0,
        paid: 0,
        paidPercentage: 0
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter invoices for current month
    const monthInvoices = Array.isArray(invoices) ? invoices.filter((inv: any) => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }) : [];

    const totalBilled = monthInvoices.reduce((sum: number, inv: any) => 
      sum + (parseFloat(inv.total?.toString() || '0') || 0), 0);

    const pendingInvoices = Array.isArray(invoices) ? invoices.filter((inv: any) => 
      inv.status === 'pending' || inv.status === 'draft') : [];
    const pending = pendingInvoices.reduce((sum: number, inv: any) => 
      sum + (parseFloat(inv.total?.toString() || '0') || 0), 0);

    const overdueInvoices = Array.isArray(invoices) ? invoices.filter((inv: any) => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    }) : [];
    const overdue = overdueInvoices.reduce((sum: number, inv: any) => 
      sum + (parseFloat(inv.total?.toString() || '0') || 0), 0);

    const paidInvoices = Array.isArray(invoices) ? invoices.filter((inv: any) => inv.status === 'paid') : [];
    const paid = paidInvoices.reduce((sum: number, inv: any) => 
      sum + (parseFloat(inv.total?.toString() || '0') || 0), 0);

    const paidPercentage = totalBilled > 0 ? (paid / totalBilled) * 100 : 0;

    return {
      totalBilled,
      pending,
      pendingCount: pendingInvoices.length,
      overdue,
      overdueCount: overdueInvoices.length,
      paid,
      paidPercentage: Math.round(paidPercentage)
    };
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: typeof invoiceData) => {
      return apiRequest("/api/invoices", {
        method: "POST",
        body: {
          customerId: parseInt(data.customerId),
          date: data.date,
          dueDate: data.dueDate,
          notes: data.notes,
          items: data.items.map(item => ({
            productId: parseInt(item.productId),
            quantity: item.quantity,
            price: item.price,
            description: item.description
          }))
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowCreateModal(false);
      setInvoiceData({
        customerId: "",
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        notes: "",
        items: [{ productId: "", quantity: 1, price: 0, description: "" }],
        // Dominican Republic Fiscal Fields
        customerRncCedula: "",
        customerName: "",
        customerStatus: "",
        customerType: "final_consumer",
        ncfType: "B02",
        itbisApplicationMode: "per_product",
        salesCondition: "cash",
        deliveryCondition: "local_delivery"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la factura.",
        variant: "destructive",
      });
    },
  });

  // Mutation to create customer automatically from RNC data
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      return apiRequest("/api/customers", {
        method: "POST",
        body: {
          name: customerData.razonSocial,
          businessName: customerData.razonSocial,
          rnc: customerData.rnc,
          status: customerData.estado === "ACTIVO" ? "active" : "inactive",
          customerType: customerData.estado === "ACTIVO" ? "business" : "individual",
          email: "",
          phone: "",
          address: "",
          city: "",
          province: "",
          country: "República Dominicana"
        }
      });
    },
    onSuccess: (newCustomer: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      // Auto-select the newly created customer
      if (newCustomer && newCustomer.id) {
        setInvoiceData(prev => ({ ...prev, customerId: newCustomer.id.toString() }));
      }
      toast({
        title: "Cliente creado",
        description: "Cliente creado automáticamente desde RNC validado.",
      });
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente automáticamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: "Pagada",
      pending: "Pendiente",
      overdue: "Vencida",
      draft: "Borrador"
    };
    return labels[status] || status;
  };

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter((invoice: any) => {
    const matchesSearch = 
      invoice.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="h-screen overflow-y-auto space-y-6 p-6 max-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facturas</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalBilled)}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.pending)}</div>
            <p className="text-xs text-muted-foreground">{metrics.pendingCount} facturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdue)}</div>
            <p className="text-xs text-muted-foreground">{metrics.overdueCount} facturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.paid)}</div>
            <p className="text-xs text-muted-foreground">{metrics.paidPercentage}% del total</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Facturas</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                // prefix={<Search className="h-4 w-4" />}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
              <Select value={pdfFormat} onValueChange={(value: 'A4' | 'letter') => setPdfFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="letter">Carta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Cargando facturas...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron facturas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>NCF</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(invoice.date), "dd/MM/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(invoice.total).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{invoice.ncf || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          title="Ver factura"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={downloadPDFMutation.isPending}
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEmailInvoice(invoice)}
                          title="Enviar por correo"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        {invoice.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => markAsPaidMutation.mutate(invoice.id)}
                            disabled={markAsPaidMutation.isPending}
                            title="Marcar como pagada"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Create Invoice Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select 
                  value={invoiceData.customerId} 
                  onValueChange={(value) => {
                    setInvoiceData(prev => ({ ...prev, customerId: value }));
                    
                    // Auto-fill customer data when selecting existing customer
                    const selectedCustomer = Array.isArray(customers) ? customers.find((c: any) => c.id.toString() === value) : null;
                    if (selectedCustomer) {
                      setInvoiceData(prev => ({
                        ...prev,
                        customerId: value,
                        customerRncCedula: selectedCustomer.rnc || selectedCustomer.cedula || "",
                        customerName: selectedCustomer.name || selectedCustomer.businessName || "",
                        customerStatus: selectedCustomer.status === "active" ? "ACTIVO" : "INACTIVO",
                        customerType: selectedCustomer.customerType === "business" ? "business" : "final_consumer"
                      }));
                      toast({
                        title: "Cliente seleccionado",
                        description: `Datos de ${selectedCustomer.name} cargados automáticamente.`,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(customers) && customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.rnc || customer.cedula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={invoiceData.date}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>

            {/* Dominican Republic Fiscal Fields */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">📋 Información Fiscal Dominicana</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerRncCedula">RNC/Cédula del Cliente</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customerRncCedula"
                      value={invoiceData.customerRncCedula || ""}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerRncCedula: e.target.value }))}
                      onBlur={(e) => validateRNC(e.target.value)}
                      placeholder="RNC o Cédula (requerido para B01)"
                      className="flex-1"
                    />
                    {rncValidating && (
                      <Button type="button" disabled size="sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerType">Tipo de Cliente</Label>
                  <Select value={invoiceData.customerType || "final_consumer"} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, customerType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="final_consumer">Consumidor Final</SelectItem>
                      <SelectItem value="business">Empresa</SelectItem>
                      <SelectItem value="government">Gubernamental</SelectItem>
                      <SelectItem value="tax_exempt">Exento de Impuesto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ncfType">Tipo de NCF</Label>
                  <Select value={invoiceData.ncfType || "B02"} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, ncfType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B01">B01 - Crédito Fiscal</SelectItem>
                      <SelectItem value="B02">B02 - Consumidor Final</SelectItem>
                      <SelectItem value="B14">B14 - Regímenes Especiales</SelectItem>
                      <SelectItem value="B15">B15 - Gubernamental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="itbisApplicationMode">Aplicación de ITBIS</Label>
                  <Select value={invoiceData.itbisApplicationMode || "per_product"} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, itbisApplicationMode: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_product">Por Producto</SelectItem>
                      <SelectItem value="included">ITBIS Incluído</SelectItem>
                      <SelectItem value="no_itbis">Sin ITBIS</SelectItem>
                      <SelectItem value="global_18">18% ITBIS</SelectItem>
                      <SelectItem value="tip_10">10% Propina</SelectItem>
                      <SelectItem value="itbis_18_tip_10">18% ITBIS + 10% Propina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salesCondition">Condición de Venta</Label>
                  <Select value={invoiceData.salesCondition || "cash"} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, salesCondition: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Contado</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="consignment">Consignación</SelectItem>
                      <SelectItem value="gift_sample">Obsequio/Muestra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deliveryCondition">Condición de Entrega</Label>
                  <Select value={invoiceData.deliveryCondition || "local_delivery"} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, deliveryCondition: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_delivery">Entrega Local</SelectItem>
                      <SelectItem value="home_shipping">Envío a Domicilio</SelectItem>
                      <SelectItem value="store_pickup">Retiro en Tienda</SelectItem>
                      <SelectItem value="export">Exportación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Productos/Servicios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInvoiceData(prev => ({
                    ...prev,
                    items: [...prev.items, { productId: "", quantity: 1, price: 0, description: "", taxType: "itbis_18" }]
                  }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className={`grid gap-2 p-3 border rounded ${
                    invoiceData.itbisApplicationMode === "per_product" 
                      ? "grid-cols-1 md:grid-cols-6" 
                      : "grid-cols-1 md:grid-cols-5"
                  }`}>
                    <div>
                      <Select 
                        value={item.productId} 
                        onValueChange={(value) => {
                          const product = Array.isArray(products) ? products.find((p: any) => p.id.toString() === value) : null;
                          setInvoiceData(prev => ({
                            ...prev,
                            items: prev.items.map((itm, idx) => idx === index ? {
                              ...itm,
                              productId: value,
                              price: product?.price || 0,
                              description: product?.name || "",
                              taxType: product?.taxType || "itbis_18"
                            } : itm)
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(products) && products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          items: prev.items.map((itm, idx) => idx === index ? { ...itm, quantity: parseInt(e.target.value) || 1 } : itm)
                        }))}
                        placeholder="Cant."
                        min="1"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          items: prev.items.map((itm, idx) => idx === index ? { ...itm, price: parseFloat(e.target.value) || 0 } : itm)
                        }))}
                        placeholder="Precio"
                      />
                    </div>
                    <div>
                      <Input
                        value={item.description}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          items: prev.items.map((itm, idx) => idx === index ? { ...itm, description: e.target.value } : itm)
                        }))}
                        placeholder="Descripción"
                      />
                    </div>
                    
                    {/* Tax Type Selector - only show when itbisApplicationMode is "per_product" */}
                    {invoiceData.itbisApplicationMode === "per_product" && (
                      <div>
                        <Select 
                          value={item.taxType || "itbis_18"} 
                          onValueChange={(value) => setInvoiceData(prev => ({
                            ...prev,
                            items: prev.items.map((itm, idx) => idx === index ? { ...itm, taxType: value } : itm)
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="itbis_18">18% ITBIS</SelectItem>
                            <SelectItem value="no_itbis">Sin ITBIS</SelectItem>
                            <SelectItem value="included">ITBIS Incluído</SelectItem>
                            <SelectItem value="tip_10">10% Propina</SelectItem>
                            <SelectItem value="itbis_18_tip_10">18% + 10% Propina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        ${(item.quantity * item.price).toFixed(2)}
                      </span>
                      {invoiceData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setInvoiceData(prev => ({
                            ...prev,
                            items: prev.items.filter((_, idx) => idx !== index)
                          }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-right space-y-2">
                {(() => {
                  let subtotal = 0;
                  let totalTax = 0;
                  
                  invoiceData.items.forEach(item => {
                    const itemSubtotal = item.quantity * item.price;
                    subtotal += itemSubtotal;
                    
                    // Use global tax type if not "per_product", otherwise use individual item tax type
                    const taxTypeToUse = invoiceData.itbisApplicationMode === "per_product" ? (item.taxType || "itbis_18") : (invoiceData.itbisApplicationMode || "itbis_18");
                    const itemTax = calculateItemTax(item.price, item.quantity, 0, taxTypeToUse);
                    totalTax += itemTax;
                  });
                  
                  const total = subtotal + totalTax;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ITBIS:</span>
                        <span>${totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createInvoiceMutation.mutate(invoiceData)}
                disabled={!invoiceData.customerId || invoiceData.items.length === 0 || createInvoiceMutation.isPending}
              >
                Crear Factura
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* View Invoice Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Factura {selectedInvoice?.number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg bg-[#09090b]">
                <div className="bg-[#00418200]">
                  <h3 className="text-lg font-semibold mb-3">Información de la Factura</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Número:</span> {selectedInvoice.number}</p>
                    <p><span className="font-medium">NCF:</span> {selectedInvoice.ncf || "No asignado"}</p>
                    <p><span className="font-medium">Fecha:</span> {format(new Date(selectedInvoice.date), "dd/MM/yyyy")}</p>
                    <p><span className="font-medium">Vencimiento:</span> {format(new Date(selectedInvoice.dueDate), "dd/MM/yyyy")}</p>
                    <div className="flex items-center">
                      <span className="font-medium">Estado:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedInvoice.status)}`}>
                        {getStatusLabel(selectedInvoice.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Cliente</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedInvoice.customerName}</p>
                    <p><span className="font-medium">RNC/Cédula:</span> {selectedInvoice.customerRncCedula || "No especificado"}</p>
                    <p><span className="font-medium">Tipo:</span> {selectedInvoice.customerType || "No especificado"}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Productos/Servicios</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.quantity * parseFloat(item.price)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Totals */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="bg-[#9aa0ad00]">RD$${parseFloat(selectedInvoice.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedInvoice)} disabled={downloadPDFMutation.isPending}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                <Button onClick={() => handleEmailInvoice(selectedInvoice)}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar por Correo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Email Invoice Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Factura por Correo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="emailTo">Destinatario</Label>
              <Input
                id="emailTo"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="emailSubject">Asunto</Label>
              <Input
                id="emailSubject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Asunto del correo"
              />
            </div>
            <div>
              <Label htmlFor="emailMessage">Mensaje</Label>
              <textarea
                id="emailMessage"
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Mensaje personalizado..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => emailInvoiceMutation.mutate({ 
                  invoiceId: selectedInvoice?.id, 
                  emailData 
                })}
                disabled={!emailData.to || !emailData.subject || emailInvoiceMutation.isPending}
              >
                {emailInvoiceMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}