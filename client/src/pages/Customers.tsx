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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CedulaInput from "@/components/CedulaInput";
import { 
  Users, Plus, Search, Edit, Eye, Download, Send, Printer, 
  Calculator, Package, Calendar, AlertTriangle, CheckCircle,
  DollarSign, Receipt, Building, User, CreditCard, Clock, Filter,
  ArrowUp, ArrowDown, RotateCcw, Copy, Trash2, ExternalLink,
  Building2, MapPin, Phone, Mail, UserCheck, UserX, UserPlus,
  FileText, History, Star, TrendingUp, TrendingDown, AlertCircle,
  Globe, Smartphone, Flag, Shield, Settings, Target, Zap, Loader2,
  BarChart3, PieChart, Activity, Award, Crown, HeartHandshake,
  UserMinus, UserCog, Briefcase, Home, MapPinIcon
} from "lucide-react";

// Enhanced Customer Schema with Dominican Requirements
const customerSchema = z.object({
  // Basic Information
  customerType: z.enum(["individual", "business", "government"], {
    required_error: "El tipo de cliente es requerido"
  }),
  name: z.string().min(1, "El nombre es requerido"),
  businessName: z.string().optional(),
  rnc: z.string().optional(),
  cedula: z.string().optional(),
  passport: z.string().optional(),
  
  // Contact Information
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  
  // Address Information
  address: z.string().optional(),
  sector: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("República Dominicana"),
  
  // Business Information
  industry: z.string().optional(),
  taxType: z.enum(["regular", "exempt", "special"]).default("regular"),
  creditLimit: z.number().min(0, "El límite de crédito debe ser mayor o igual a 0").optional(),
  paymentTerms: z.number().default(0),
  
  // Classification
  customerGroup: z.string().optional(),
  salesRepId: z.number().optional(),
  priceListId: z.number().optional(),
  
  // Preferences
  preferredCurrency: z.string().default("DOP"),
  language: z.string().default("es"),
  invoiceByEmail: z.boolean().default(false),
  
  // Status
  isActive: z.boolean().default(true),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("customers");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [rncValidating, setRncValidating] = useState(false);
  const [rncValidation, setRncValidation] = useState<any>(null);

  // Data queries
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: true
  });

  const { data: customerStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/customers/statistics"],
    enabled: true
  });

  // Form setup
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: "individual",
      name: "",
      businessName: "",
      rnc: "",
      cedula: "",
      passport: "",
      email: "",
      phone: "",
      mobile: "",
      website: "",
      address: "",
      sector: "",
      neighborhood: "",
      city: "",
      province: "",
      postalCode: "",
      country: "República Dominicana",
      industry: "",
      taxType: "regular",
      creditLimit: 0,
      paymentTerms: 0,
      customerGroup: "",
      salesRepId: 0,
      priceListId: 0,
      preferredCurrency: "DOP",
      language: "es",
      invoiceByEmail: false,
      isActive: true,
      notes: ""
    }
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      return apiRequest("/api/customers", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/statistics"] });
      setShowCustomerDialog(false);
      form.reset();
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el cliente",
        variant: "destructive"
      });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData & { id: number }) => {
      return apiRequest(`/api/customers/${data.id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/statistics"] });
      setShowCustomerDialog(false);
      setEditingCustomer(null);
      form.reset();
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el cliente",
        variant: "destructive"
      });
    }
  });

  // RNC Validation function
  const validateRNC = async (rnc: string) => {
    if (!rnc || rnc.length < 9) return;
    
    setRncValidating(true);
    setRncValidation(null);
    
    try {
      const response = await apiRequest(`/api/dgii/rnc-lookup?rnc=${encodeURIComponent(rnc)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // RNC is valid, auto-fill form data
        const companyName = result.data.razonSocial || result.data.name;
        if (companyName && !form.getValues('name')) {
          form.setValue('name', companyName);
        }
        
        if (result.data.nombreComercial && !form.getValues('businessName')) {
          form.setValue('businessName', result.data.nombreComercial);
        }
        
        // Set customer type to business if it's a company
        if (companyName && !form.getValues('customerType')) {
          form.setValue('customerType', 'business');
        }
        
        setRncValidation({ 
          valid: true, 
          rnc, 
          data: {
            name: companyName,
            businessName: result.data.nombreComercial,
            status: result.data.estado,
            category: result.data.categoria
          }
        });
        
        toast({
          title: "RNC válido",
          description: `Contribuyente: ${companyName}. Datos rellenados automáticamente.`
        });
      } else {
        setRncValidation({ valid: false, rnc });
        toast({
          title: "RNC no válido",
          description: result.message || "El RNC ingresado no existe en el registro DGII",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('RNC validation error:', error);
      setRncValidation({ valid: false, rnc });
      toast({
        title: "Error de validación",
        description: "No se pudo verificar el RNC",
        variant: "destructive"
      });
    } finally {
      setRncValidating(false);
    }
  };

  // Filter customers
  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.rnc?.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && customer.status === "active") ||
                         (statusFilter === "inactive" && customer.status === "inactive");

    return matchesSearch && matchesStatus;
  }) : [];

  // Form handlers
  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setRncValidating(false);
    setRncValidation(null);
    form.reset({
      customerType: customer.customerType || "individual",
      name: customer.name || "",
      businessName: customer.businessName || "",
      rnc: customer.rnc || "",
      cedula: customer.cedula || "",
      passport: customer.passport || "",
      email: customer.email || "",
      phone: customer.phone || "",
      mobile: customer.mobile || "",
      website: customer.website || "",
      address: customer.address || "",
      sector: customer.sector || "",
      neighborhood: customer.neighborhood || "",
      city: customer.city || "",
      province: customer.province || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "República Dominicana",
      industry: customer.industry || "",
      taxType: customer.taxType || "regular",
      creditLimit: customer.creditLimit || 0,
      paymentTerms: customer.paymentTerms || 0,
      customerGroup: customer.customerGroup || "",
      salesRepId: customer.salesRepId || 0,
      priceListId: customer.priceListId || 0,
      preferredCurrency: customer.preferredCurrency || "DOP",
      language: customer.language || "es",
      invoiceByEmail: customer.invoiceByEmail || false,
      isActive: customer.status === "active",
      notes: customer.notes || ""
    });
    setShowCustomerDialog(true);
  };

  const handleCreateUser = async (customerId: number) => {
    try {
      const response = await apiRequest(`/api/customers/${customerId}/create-user`, {
        method: 'POST',
      });
      
      toast({
        title: "Usuario creado exitosamente",
        description: (response as any).message || "Se ha creado un usuario para este cliente y se ha enviado un email con las credenciales.",
      });
      
      // Refresh customers list to update hasUser status
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    } catch (error: any) {
      toast({
        title: "Error al crear usuario",
        description: error.message || "No se pudo crear el usuario. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setRncValidating(false);
    setRncValidation(null);
    form.reset();
    setShowCustomerDialog(true);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Header 
        title="Gestión de Clientes" 
        subtitle="Sistema integral de gestión de clientes y relaciones comerciales"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="segments">Segmentación</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Main Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Directorio de Clientes
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre, RNC, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-80"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="inactive">Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleNewCustomer} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Nuevo Cliente</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay clientes</h3>
                    <p className="text-gray-500">Crea tu primer cliente para comenzar</p>
                    <Button onClick={handleNewCustomer} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer cliente
                    </Button>
                  </div>
                ) : (
       <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>RNC/Cédula</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              {customer.businessName && (
                                <div className="text-sm text-gray-500">{customer.businessName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="text-sm">{customer.email}</div>
                              )}
                              {customer.phone && (
                                <div className="text-sm text-gray-500">{customer.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.rnc && (
                              <Badge variant="outline">{customer.rnc}</Badge>
                            )}
                            {customer.cedula && (
                              <Badge variant="outline">{customer.cedula}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                              {customer.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {customer.email && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleCreateUser(customer.id)}
                                  title="Create User"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              )}
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

        {/* Other tabs with minimal content for now */}
        <TabsContent value="segments" className="space-y-6">
          <div className="h-[calc(100vh-220px)] overflow-y-auto">
            <CustomerSegmentation />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="h-[calc(100vh-220px)] overflow-y-auto">
            <CustomerAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="h-[calc(100vh-220px)] overflow-y-auto">
            <CustomerReports />
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={(open) => {
        setShowCustomerDialog(open);
        if (!open) {
          setRncValidating(false);
          setRncValidation(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del cliente. Los campos marcados son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  
                  <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cliente *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Persona Física</SelectItem>
                            <SelectItem value="business">Empresa</SelectItem>
                            <SelectItem value="government">Gobierno</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre/Razón Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo o razón social" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rnc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          RNC
                          {rncValidating && <Loader2 className="h-3 w-3 animate-spin" />}
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="Ej: 123456789" 
                              {...field}
                              className="flex-1"
                              onBlur={(e) => {
                                field.onBlur();
                                const rnc = e.target.value.trim();
                                if (rnc && rnc.length >= 9) {
                                  validateRNC(rnc);
                                }
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const rnc = field.value?.trim();
                              if (rnc && rnc.length >= 9) {
                                validateRNC(rnc);
                              }
                            }}
                            disabled={rncValidating || !field.value || field.value.length < 9}
                          >
                            {rncValidating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Verificar"
                            )}
                          </Button>
                        </div>
                        {rncValidation && (
                          <div className={`mt-2 p-2 rounded text-sm ${
                            rncValidation.valid 
                              ? "bg-green-50 text-green-800 border border-green-200" 
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}>
                            {rncValidation.valid 
                              ? `✓ RNC válido: ${rncValidation.data?.name || 'Datos encontrados'}`
                              : `✗ RNC no válido o no encontrado`
                            }
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("customerType") === "business" && (
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Comercial</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre comercial de la empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cedula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cédula</FormLabel>
                          <FormControl>
                            <Input placeholder="000-0000000-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pasaporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de pasaporte" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información de Contacto</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Móvil</FormLabel>
                          <FormControl>
                            <Input placeholder="(809) 987-6543" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio Web</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dirección</h3>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Dirección completa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector</FormLabel>
                          <FormControl>
                            <Input placeholder="Sector o zona" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barrio</FormLabel>
                          <FormControl>
                            <Input placeholder="Barrio o vecindario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar provincia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Azua">Azua</SelectItem>
                              <SelectItem value="Baoruco">Baoruco</SelectItem>
                              <SelectItem value="Barahona">Barahona</SelectItem>
                              <SelectItem value="Dajabón">Dajabón</SelectItem>
                              <SelectItem value="Distrito Nacional">Distrito Nacional</SelectItem>
                              <SelectItem value="Duarte">Duarte</SelectItem>
                              <SelectItem value="Elías Piña">Elías Piña</SelectItem>
                              <SelectItem value="El Seibo">El Seibo</SelectItem>
                              <SelectItem value="Espaillat">Espaillat</SelectItem>
                              <SelectItem value="Hato Mayor">Hato Mayor</SelectItem>
                              <SelectItem value="Hermanas Mirabal">Hermanas Mirabal</SelectItem>
                              <SelectItem value="Independencia">Independencia</SelectItem>
                              <SelectItem value="La Altagracia">La Altagracia</SelectItem>
                              <SelectItem value="La Romana">La Romana</SelectItem>
                              <SelectItem value="La Vega">La Vega</SelectItem>
                              <SelectItem value="María Trinidad Sánchez">María Trinidad Sánchez</SelectItem>
                              <SelectItem value="Monseñor Nouel">Monseñor Nouel</SelectItem>
                              <SelectItem value="Monte Cristi">Monte Cristi</SelectItem>
                              <SelectItem value="Monte Plata">Monte Plata</SelectItem>
                              <SelectItem value="Pedernales">Pedernales</SelectItem>
                              <SelectItem value="Peravia">Peravia</SelectItem>
                              <SelectItem value="Puerto Plata">Puerto Plata</SelectItem>
                              <SelectItem value="Samaná">Samaná</SelectItem>
                              <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                              <SelectItem value="San José de Ocoa">San José de Ocoa</SelectItem>
                              <SelectItem value="San Juan">San Juan</SelectItem>
                              <SelectItem value="San Pedro de Macorís">San Pedro de Macorís</SelectItem>
                              <SelectItem value="Sánchez Ramírez">Sánchez Ramírez</SelectItem>
                              <SelectItem value="Santiago">Santiago</SelectItem>
                              <SelectItem value="Santiago Rodríguez">Santiago Rodríguez</SelectItem>
                              <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                              <SelectItem value="Valverde">Valverde</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal</FormLabel>
                          <FormControl>
                            <Input placeholder="00000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Comercial</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar industria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="retail">Comercio al detalle</SelectItem>
                              <SelectItem value="manufacturing">Manufactura</SelectItem>
                              <SelectItem value="services">Servicios</SelectItem>
                              <SelectItem value="construction">Construcción</SelectItem>
                              <SelectItem value="technology">Tecnología</SelectItem>
                              <SelectItem value="healthcare">Salud</SelectItem>
                              <SelectItem value="education">Educación</SelectItem>
                              <SelectItem value="tourism">Turismo</SelectItem>
                              <SelectItem value="agriculture">Agricultura</SelectItem>
                              <SelectItem value="other">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Tributario</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="exempt">Exento</SelectItem>
                              <SelectItem value="special">Especial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Límite de Crédito</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Términos de Pago (días)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="invoiceByEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enviar facturas por email
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Las facturas se enviarán automáticamente al email del cliente.
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
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notas Adicionales</h3>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Información adicional sobre el cliente..." 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Estado del Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Estado del Cliente</h3>
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Cliente Activo
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Permite que el cliente aparezca en las listas y pueda realizar transacciones.
                          </div>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isActive"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">
                              {field.value ? "Activo" : "Inactivo"}
                            </label>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomerDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                  >
                    {editingCustomer ? "Actualizar" : "Crear"} Cliente
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Customer Analytics Component
function CustomerAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/customers/analytics"],
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalCustomers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$ {analytics?.totalRevenue?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RD$ {analytics?.averageLTV?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.customerTypes && Object.entries(analytics.customerTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="capitalize">{type === 'individual' ? 'Personal' : type === 'business' ? 'Empresa' : 'Gobierno'}</span>
                  </div>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Frequency Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Análisis de Frecuencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.frequencyAnalysis && Object.entries(analytics.frequencyAnalysis).map(([segment, count]) => (
                <div key={segment} className="flex items-center justify-between">
                  <span>{segment}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Top 10 Clientes por Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Promedio Orden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.topCustomers?.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.type === 'individual' ? 'Personal' : customer.type === 'business' ? 'Empresa' : 'Gobierno'}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.purchaseCount}</TableCell>
                    <TableCell>RD$ {customer.totalValue.toLocaleString()}</TableCell>
                    <TableCell>RD$ {customer.averageOrderValue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Customer Segmentation Component
function CustomerSegmentation() {
  const { data: segments, isLoading } = useQuery({
    queryKey: ["/api/customers/segments"],
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getSegmentIcon = (name: string) => {
    switch (name) {
      case 'Champions': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'Loyal Customers': return <Award className="h-5 w-5 text-blue-500" />;
      case 'Potential Loyalists': return <Star className="h-5 w-5 text-green-500" />;
      case 'New Customers': return <UserPlus className="h-5 w-5 text-purple-500" />;
      case 'Promising': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'Need Attention': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'About to Sleep': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'At Risk': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Cannot Lose Them': return <HeartHandshake className="h-5 w-5 text-pink-500" />;
      case 'Hibernating': return <UserMinus className="h-5 w-5 text-gray-500" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getSegmentDescription = (name: string) => {
    switch (name) {
      case 'Champions': return 'Compran frecuentemente y gastaron mucho. Son nuestros mejores clientes.';
      case 'Loyal Customers': return 'Gastan mucho dinero y responden a promociones.';
      case 'Potential Loyalists': return 'Clientes recientes con alto valor promedio.';
      case 'New Customers': return 'Compraron hace poco tiempo pero con bajo gasto.';
      case 'Promising': return 'Compradores recientes con potencial de gasto moderado.';
      case 'Need Attention': return 'Valor y frecuencia promedio, requieren atención.';
      case 'About to Sleep': return 'Frecuencia inferior al promedio, pueden irse.';
      case 'At Risk': return 'Gastaron mucho y compraban frecuentemente, pero no los vemos.';
      case 'Cannot Lose Them': return 'Compraban frecuentemente pero llevamos tiempo sin verlos.';
      case 'Hibernating': return 'Última compra fue hace mucho tiempo.';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Segmentación RFM (Recencia, Frecuencia, Monetario)
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Análisis automático de clientes basado en su comportamiento de compra
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments?.segments?.map((segment: any) => (
              <Card key={segment.name} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSegmentIcon(segment.name)}
                      <CardTitle className="text-sm">{segment.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{segment.percentage}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {getSegmentDescription(segment.name)}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Clientes:</span> {segment.count}
                      </div>
                      <div>
                        <span className="font-medium">Valor Total:</span> RD$ {segment.totalValue.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Valor Promedio:</span> RD$ {segment.averageValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Resumen de Segmentación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {segments?.totalCustomers || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total de Clientes</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {segments?.segments?.filter((s: any) => ['Champions', 'Loyal Customers', 'Potential Loyalists'].includes(s.name))
                  .reduce((sum: number, s: any) => sum + s.count, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Clientes de Alto Valor</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {segments?.segments?.filter((s: any) => ['At Risk', 'Cannot Lose Them', 'About to Sleep'].includes(s.name))
                  .reduce((sum: number, s: any) => sum + s.count, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Clientes en Riesgo</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Customer Reports Component
function CustomerReports() {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["/api/customers/reports", { reportType, ...dateRange }],
    queryFn: () => apiRequest(`/api/customers/reports?reportType=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
    enabled: true
  });

  const downloadReport = () => {
    if (!reportData) return;
    
    const data = reportType === 'summary' ? [reportData] : reportData;
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_clientes_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de Reportes de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumen</SelectItem>
                  <SelectItem value="detailed">Detallado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Generar
              </Button>
              <Button variant="outline" onClick={downloadReport} disabled={!reportData}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === 'summary' ? 'Reporte Resumen' : 'Reporte Detallado'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === 'summary' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {reportData.totalCustomers}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Clientes</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reportData.activeCustomers}
                  </div>
                  <div className="text-sm text-muted-foreground">Activos</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {reportData.inactiveCustomers}
                  </div>
                  <div className="text-sm text-muted-foreground">Inactivos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    RD$ {reportData.totalRevenue?.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Ingresos Totales</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    RD$ {reportData.averageOrderValue?.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Valor Promedio Orden</div>
                </div>
                <div className="text-center p-4 bg-teal-50 dark:bg-teal-950 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {reportData.totalOrders}
                  </div>
                  <div className="text-sm text-muted-foreground">Órdenes Totales</div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>RNC</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Órdenes</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Última Compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.rnc || 'N/A'}</TableCell>
                        <TableCell>{customer.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {customer.type === 'individual' ? 'Personal' : 
                             customer.type === 'business' ? 'Empresa' : 'Gobierno'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                            {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>RD$ {customer.totalValue.toLocaleString()}</TableCell>
                        <TableCell>{customer.lastPurchase}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
