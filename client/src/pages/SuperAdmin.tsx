import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type Company } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Building2, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  Crown,
  Calendar,
  DollarSign,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  RefreshCw,
  Send
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RNCCompanySuggestions } from "@/components/RNCCompanySuggestions";

// Schema for admin form with ownerEmail and paymentConfirmed
const companySchemaForAdmin = z.object({
  name: z.string().min(1, "Nombre requerido"),
  businessName: z.string().optional(),
  rnc: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  industry: z.string().optional(),
  subscriptionPlan: z.enum(["trial", "monthly", "annual"]),
  isActive: z.boolean(),
  paymentConfirmed: z.boolean().default(false),
  ownerEmail: z.string().email("Email del propietario requerido"),
});

type CompanyFormData = z.infer<typeof companySchemaForAdmin>;

export default function SuperAdmin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [rncValidationResult, setRncValidationResult] = useState<any>(null);
  const [isVerifyingRNC, setIsVerifyingRNC] = useState(false);

  // RNC verification function
  const handleRNCVerification = async (rncValue: string) => {
    if (!rncValue || rncValue.length < 9) {
      setRncValidationResult({
        valid: false,
        message: "RNC debe tener al menos 9 caracteres",
      });
      return;
    }

    setIsVerifyingRNC(true);
    try {
      const cleanRnc = rncValue.replace(/\D/g, "");
      const response = await fetch(`/api/verify-rnc/${cleanRnc}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.valid) {
        setRncValidationResult({
          valid: true,
          message: "RNC válido y registrado en DGII",
          data: result.data,
        });

        // Auto-fill company name if available
        if (result.data?.companyName && !form.getValues("name")) {
          form.setValue("name", result.data.companyName);
        }
      } else {
        setRncValidationResult({
          valid: false,
          message: result.message || "RNC no válido",
        });
      }
    } catch (error) {
      console.error("Error verifying RNC:", error);
      setRncValidationResult({
        valid: false,
        message: "Error al verificar el RNC. Inténtalo de nuevo.",
      });
    } finally {
      setIsVerifyingRNC(false);
    }
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchemaForAdmin),
    defaultValues: {
      name: "",
      businessName: "",
      rnc: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      industry: "",
      subscriptionPlan: "trial",
      isActive: true,
      paymentConfirmed: false,
      ownerEmail: "",
    },
  });

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      // Auto-authenticate as admin first
      try {
        await apiRequest('/api/admin/auto-login', {
          method: 'POST',
          body: {}
        });
      } catch (error) {
        console.log('Auto-login attempt completed');
      }
      
      // Then fetch companies
      const response = await apiRequest('/api/admin/companies');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await apiRequest("/api/admin/companies", {
        method: "POST",
        body: data
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa creada",
        description: "La empresa ha sido creada exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la empresa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (!editingCompany) throw new Error("No company selected for editing");
      const response = await apiRequest(`/api/companies/${editingCompany.id}`, {
        method: "PUT",
        body: data
      });
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Empresa actualizada",
        description: data.emailChanged 
          ? `Empresa actualizada. ${data.emailSent ? 'Nueva invitación enviada.' : 'Error enviando invitación.'}`
          : "La empresa ha sido actualizada exitosamente.",
        variant: data.emailChanged && !data.emailSent ? "destructive" : "default",
      });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
      setRncValidationResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: (error: Error) => {
      console.error("Company update error:", error);
      toast({
        title: "Error al actualizar empresa",
        description: error.message || "No se pudo actualizar la empresa.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest(`/api/companies/${id}/status`, {
        method: "PATCH",
        body: { isActive }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la empresa ha sido actualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest(`/api/companies/${companyId}`, {
        method: "DELETE"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa eliminada",
        description: "La empresa ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa.",
        variant: "destructive",
      });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest(`/api/companies/${companyId}/resend-email`, {
        method: "POST",
        body: {}
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Éxito",
        description: data.emailSent ? "Invitación reenviada exitosamente" : "Error en el envío del correo",
        variant: data.emailSent ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: (error: Error) => {
      console.error("Error resending email:", error);
      toast({
        title: "Error",
        description: "No se pudo reenviar la invitación",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    try {
      console.log("Form submitted with data:", data);
      console.log("Form errors:", form.formState.errors);
      
      if (editingCompany) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error en el formulario",
        description: "Error al procesar el formulario",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      businessName: company.businessName || "",
      rnc: company.rnc || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      industry: company.industry || "",
      subscriptionPlan: company.subscriptionPlan as "trial" | "monthly" | "annual",
      isActive: company.isActive,
      paymentConfirmed: company.paymentConfirmed || false,
      ownerEmail: company.ownerEmail || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewCompany = () => {
    setEditingCompany(null);
    form.reset();
    setRncValidationResult(null);
    setIsDialogOpen(true);
  };

  const handleResendEmail = (company: Company) => {
    if (confirm(`¿Reenviar invitación por email a ${company.ownerEmail || company.email}?`)) {
      resendEmailMutation.mutate(company.id);
    }
  };



  const bulkActivateMutation = useMutation({
    mutationFn: async (companyIds: number[]) => {
      const response = await apiRequest("/api/companies/bulk-activate", {
        method: "PATCH",
        body: { companyIds }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresas activadas",
        description: "Las empresas seleccionadas han sido activadas.",
      });
      setSelectedCompanies([]);
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron activar las empresas.",
        variant: "destructive",
      });
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async (companyIds: number[]) => {
      const response = await apiRequest("/api/companies/bulk-deactivate", {
        method: "PATCH",
        body: { companyIds }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresas desactivadas",
        description: "Las empresas seleccionadas han sido desactivadas.",
      });
      setSelectedCompanies([]);
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron desactivar las empresas.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort companies
  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.rnc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && company.isActive) ||
      (statusFilter === "inactive" && !company.isActive);
    
    const matchesPlan = planFilter === "all" || company.subscriptionPlan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "businessName":
        comparison = (a.businessName || "").localeCompare(b.businessName || "");
        break;
      case "createdAt":
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      case "subscriptionPlan":
        comparison = (a.subscriptionPlan || "trial").localeCompare(b.subscriptionPlan || "trial");
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies?.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies?.map(c => c.id) || []);
    }
  };

  const handleSelectCompany = (id: number) => {
    setSelectedCompanies(prev => 
      prev.includes(id) 
        ? prev.filter(companyId => companyId !== id)
        : [...prev, id]
    );
  };

  const isAllSelected = selectedCompanies.length === filteredCompanies?.length && filteredCompanies?.length > 0;
  const isSomeSelected = selectedCompanies.length > 0;

  const getStatusBadge = (company: Company) => {
    if (!company.isActive) {
      return <Badge variant="destructive">Inactiva</Badge>;
    }
    
    // Check payment status for active companies
    switch (company.paymentStatus) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-600">Pagado</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-600">Pendiente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-600">Pendiente</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "trial":
        return <Badge variant="outline">Prueba</Badge>;
      case "monthly":
        return <Badge variant="default">Mensual</Badge>;
      case "annual":
        return <Badge variant="secondary">Anual</Badge>;
      default:
        return <Badge variant="outline">Prueba</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Panel de Super Administrador" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando empresas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header title="Panel de Super Administrador" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies?.filter(c => c.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies?.filter(c => c.registrationStatus === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Premium</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies?.filter(c => c.subscriptionPlan !== "trial").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestión de Empresas
            </CardTitle>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full lg:w-64"
                />
              </div>
              
              {/* Filters */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full lg:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewCompany}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompany ? "Editar Empresa" : "Crear Nueva Empresa"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCompany 
                        ? "Modifica los datos de la empresa" 
                        : "Crea una nueva empresa en el sistema"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Comercial *</FormLabel>
                              <FormControl>
                                <RNCCompanySuggestions
                                  label=""
                                  placeholder="Buscar empresa por nombre..."
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  onCompanySelect={(company) => {
                                    form.setValue("name", company.name);
                                    form.setValue("rnc", company.rnc);
                                    toast({
                                      title: "Empresa seleccionada",
                                      description: `${company.name} - RNC: ${company.rnc}`,
                                    });
                                  }}
                                  className="text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ownerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email del Propietario *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  placeholder="propietario@empresa.com" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="rnc"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>RNC (Registro Nacional del Contribuyente)</FormLabel>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Ej: 131-12345-6"
                                    onBlur={(e) => {
                                      const rncValue = e.target.value;
                                      if (rncValue && rncValue.length >= 9) {
                                        handleRNCVerification(rncValue);
                                      }
                                    }}
                                    className={`${rncValidationResult?.valid === true ? "border-green-500" : 
                                              rncValidationResult?.valid === false ? "border-red-500" : ""} flex-1`}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isVerifyingRNC || !field.value}
                                  onClick={() => handleRNCVerification(field.value || "")}
                                  className="w-full sm:w-auto"
                                >
                                  {isVerifyingRNC ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      Verificando...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verificar
                                    </>
                                  )}
                                </Button>
                              </div>
                              {rncValidationResult && (
                                <div className={`text-sm p-3 rounded-lg ${
                                  rncValidationResult.valid 
                                    ? "bg-green-50 text-green-700 border border-green-200" 
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                  {rncValidationResult.valid ? (
                                    <div className="space-y-1">
                                      <p className="font-medium flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        RNC válido y registrado en DGII
                                      </p>
                                      {rncValidationResult.data?.companyName && (
                                        <p className="text-xs">
                                          Empresa: {rncValidationResult.data.companyName}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="flex items-center">
                                      <AlertCircle className="h-4 w-4 mr-2" />
                                      {rncValidationResult.message}
                                    </p>
                                  )}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="(809) 555-0123" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email de la Empresa</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="info@empresa.com" />
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
                                <Input {...field} placeholder="https://empresa.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industria</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Retail, Manufactura, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subscriptionPlan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plan de Suscripción</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="trial">Prueba</SelectItem>
                                  <SelectItem value="monthly">Mensual</SelectItem>
                                  <SelectItem value="annual">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Empresa Activa</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Permite que la empresa acceda al sistema
                                </p>
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

                        <FormField
                          control={form.control}
                          name="paymentConfirmed"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Pago Confirmado</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Marca el pago como confirmado por el administrador
                                </p>
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

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Dirección completa de la empresa"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
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
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {createMutation.isPending || updateMutation.isPending ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              {editingCompany ? "Actualizando..." : "Creando..."}
                            </>
                          ) : (
                            editingCompany ? "Actualizar Empresa" : "Crear Empresa"
                          )}
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
          {/* Bulk Actions */}
          {isSomeSelected && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {selectedCompanies.length} empresa(s) seleccionada(s)
                </span>
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => bulkActivateMutation.mutate(selectedCompanies)}
                    disabled={bulkActivateMutation.isPending}
                  >
                    Activar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => bulkDeactivateMutation.mutate(selectedCompanies)}
                    disabled={bulkDeactivateMutation.isPending}
                  >
                    Desactivar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>RNC</TableHead>
                  <TableHead>Email Propietario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => handleSelectCompany(company.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.businessName && (
                          <div className="text-sm text-muted-foreground">
                            {company.businessName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.rnc || "N/A"}</TableCell>
                    <TableCell>{company.ownerEmail || company.email || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(company)}</TableCell>
                    <TableCell>{getPlanBadge(company.subscriptionPlan || 'free' as any)}</TableCell>
                    <TableCell>
                      {company.createdAt 
                        ? new Date(company.createdAt).toLocaleDateString()
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleResendEmail(company)}
                            disabled={!company.ownerEmail && !company.email}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Reenviar Invitación
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleStatusMutation.mutate({
                              id: company.id,
                              isActive: !company.isActive
                            })}
                          >
                            {company.isActive ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("¿Estás seguro de eliminar esta empresa?")) {
                                deleteCompanyMutation.mutate(company.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCompanies?.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No hay empresas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || planFilter !== "all"
                  ? "No se encontraron empresas con los filtros aplicados."
                  : "Comienza creando tu primera empresa."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}