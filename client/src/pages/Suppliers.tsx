import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Building, Package, DollarSign, Calendar, TrendingUp, Edit, Trash2, Eye, FileText, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";

// Schema for supplier form
const supplierSchema = z.object({
  code: z.string().min(1, "Código es requerido"),
  businessName: z.string().min(1, "Razón social es requerida"),
  tradeName: z.string().optional(),
  rnc: z.string().optional(),
  contactName: z.string().min(1, "Nombre de contacto es requerido"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default("República Dominicana"),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default("DOP"),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().optional(),
  leadTimeDays: z.number().optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  onTimeDeliveryRate: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [rncValidating, setRncValidating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: "",
      businessName: "",
      tradeName: "",
      rnc: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      province: "",
      country: "República Dominicana",
      postalCode: "",
      taxId: "",
      currency: "DOP",
      paymentTerms: "",
      creditLimit: 0,
      leadTimeDays: 7,
      qualityRating: 5,
      onTimeDeliveryRate: 100,
      category: "",
      status: "active",
      notes: "",
    },
  });

  // Query for suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Query for supplier statistics
  const { data: supplierStats = {} } = useQuery({
    queryKey: ["/api/suppliers/statistics"],
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: (data: SupplierFormData) => apiRequest("/api/suppliers", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/statistics"] });
      setShowSupplierDialog(false);
      supplierForm.reset();
      toast({
        title: "Éxito",
        description: "Proveedor creado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear proveedor",
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/suppliers/${id}`, {
      method: "PUT",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/statistics"] });
      setShowSupplierDialog(false);
      setEditingSupplier(null);
      supplierForm.reset();
      toast({
        title: "Éxito",
        description: "Proveedor actualizado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar proveedor",
        variant: "destructive",
      });
    },
  });

  // Filter suppliers based on search term
  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter((supplier: any) =>
    supplier?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.rnc?.includes(searchTerm)
  ) : [];

  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    supplierForm.reset();
    setShowSupplierDialog(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    supplierForm.reset({
      code: supplier.code || "",
      businessName: supplier.businessName || "",
      tradeName: supplier.tradeName || "",
      rnc: supplier.rnc || "",
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      website: supplier.website || "",
      address: supplier.address || "",
      city: supplier.city || "",
      province: supplier.province || "",
      country: supplier.country || "República Dominicana",
      postalCode: supplier.postalCode || "",
      taxId: supplier.taxId || "",
      currency: supplier.currency || "DOP",
      paymentTerms: supplier.paymentTerms || "",
      creditLimit: supplier.creditLimit || 0,
      leadTimeDays: supplier.leadTimeDays || 7,
      qualityRating: supplier.qualityRating || 5,
      onTimeDeliveryRate: supplier.onTimeDeliveryRate || 100,
      category: supplier.category || "",
      status: supplier.status || "active",
      notes: supplier.notes || "",
    });
    setShowSupplierDialog(true);
  };

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, ...data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const generateSupplierCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    supplierForm.setValue("code", `PROV${timestamp}`);
  };

  return (
    <div className="space-y-6">
      <Header title="Gestión de Proveedores" />
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Building className="h-8 w-8 text-blue-600" />
                  Gestión de Proveedores
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Administra tu red de proveedores y relaciones comerciales
                </p>
              </div>
              <Button onClick={handleCreateSupplier} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, contacto o RNC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="performance">Rendimiento</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                        <p className="text-2xl font-bold">{Array.isArray(suppliers) ? suppliers.length : 0}</p>
                      </div>
                      <Building className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600">+8% este mes</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                        <p className="text-2xl font-bold">
                          {Array.isArray(suppliers) ? suppliers.filter((s: any) => s.status === "active").length : 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                        <p className="text-2xl font-bold">4.8</p>
                      </div>
                      <Package className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gasto Mensual</p>
                        <p className="text-2xl font-bold">RD$ 2.8M</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600">+12% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Suppliers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Proveedores</CardTitle>
                  <CardDescription>
                    Gestiona la información de todos tus proveedores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Código</th>
                          <th className="text-left p-4">Razón Social</th>
                          <th className="text-left p-4">Contacto</th>
                          <th className="text-left p-4">RNC</th>
                          <th className="text-left p-4">Estado</th>
                          <th className="text-left p-4">Calificación</th>
                          <th className="text-left p-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8">
                              Cargando proveedores...
                            </td>
                          </tr>
                        ) : filteredSuppliers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8">
                              No se encontraron proveedores
                            </td>
                          </tr>
                        ) : (
                          filteredSuppliers.map((supplier: any) => (
                            <tr key={supplier.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-4 font-medium">{supplier.code}</td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{supplier.businessName}</div>
                                  {supplier.tradeName && (
                                    <div className="text-sm text-gray-500">{supplier.tradeName}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{supplier.contactName}</div>
                                  {supplier.email && (
                                    <div className="text-sm text-gray-500">{supplier.email}</div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">{supplier.rnc || "N/A"}</td>
                              <td className="p-4">
                                <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                                  {supplier.status === "active" ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                              <td className="p-4">
                                {supplier.qualityRating ? (
                                  <div className="flex items-center">
                                    <span className="text-yellow-500">★</span>
                                    <span className="ml-1">{supplier.qualityRating}/5</span>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSupplier(supplier)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="h-[calc(100vh-220px)] overflow-y-auto">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendimiento de Proveedores</CardTitle>
                      <CardDescription>
                        Análisis de rendimiento y métricas de calidad
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Análisis de rendimiento pendiente de implementación...</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="h-[calc(100vh-220px)] overflow-y-auto">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análisis de Proveedores</CardTitle>
                      <CardDescription>
                        Análisis detallado y tendencias
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Análisis detallado pendiente de implementación...</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <div className="h-[calc(100vh-220px)] overflow-y-auto">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Documentos</CardTitle>
                      <CardDescription>
                        Contratos, certificados y documentos relevantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Gestión de documentos pendiente de implementación...</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Proveedor" : "Crear Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Actualiza la información del proveedor"
                : "Ingresa los datos del nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>

          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información Básica</h3>
                  
                  <FormField
                    control={supplierForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} placeholder="PROV001" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateSupplierCode}
                          >
                            Generar
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Empresa ABC S.R.L." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="tradeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Comercial</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ABC Suministros" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="rnc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RNC</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información de Contacto</h3>
                  
                  <FormField
                    control={supplierForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Contacto</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contacto@proveedor.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(809) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.proveedor.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dirección</h3>
                  
                  <FormField
                    control={supplierForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Calle Principal #123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Santo Domingo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una provincia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Distrito Nacional">Distrito Nacional</SelectItem>
                            <SelectItem value="Santiago">Santiago</SelectItem>
                            <SelectItem value="San Pedro de Macorís">San Pedro de Macorís</SelectItem>
                            <SelectItem value="La Altagracia">La Altagracia</SelectItem>
                            <SelectItem value="Puerto Plata">Puerto Plata</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles Comerciales</h3>
                  
                  <FormField
                    control={supplierForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="materiales">Materiales</SelectItem>
                            <SelectItem value="servicios">Servicios</SelectItem>
                            <SelectItem value="equipos">Equipos</SelectItem>
                            <SelectItem value="tecnologia">Tecnología</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos de Pago</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="30 días" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de Crédito</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="50000"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={supplierForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Notas adicionales sobre el proveedor..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSupplierDialog(false);
                    setEditingSupplier(null);
                    supplierForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending || updateSupplierMutation.isPending
                    ? "Guardando..."
                    : editingSupplier ? "Actualizar" : "Crear Proveedor"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}