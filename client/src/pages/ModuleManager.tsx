import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Building,
  Users,
  Database,
  BarChart3,
  Package,
  CreditCard,
  MessageSquare,
  Calendar,
  FileText,
  Wrench,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Module Management Types
interface SystemModule {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  isCore: boolean;
  requiresSubscription: boolean;
  subscriptionTiers: string[];
  dependencies: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CompanyModule {
  id: number;
  companyId: number;
  moduleId: number;
  isEnabled: boolean;
  enabledAt: string;
  enabledBy: string;
  disabledAt?: string;
  disabledBy?: string;
  settings: any;
  module: SystemModule;
}

interface Company {
  id: number;
  name: string;
  businessName: string;
  rnc: string;
  subscriptionPlan: string;
}

// Icon mapping for modules
const moduleIcons: Record<string, any> = {
  Settings,
  Building,
  Users,
  Database,
  BarChart3,
  Package,
  CreditCard,
  MessageSquare,
  Calendar,
  FileText,
  Wrench,
  Shield,
  ShieldCheck
};

// Module form schema
const moduleSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  displayName: z.string().min(1, "Nombre para mostrar es requerido"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoría es requerida"),
  icon: z.string().min(1, "Icono es requerido"),
  version: z.string().default("1.0.0"),
  isCore: z.boolean().default(false),
  requiresSubscription: z.boolean().default(false),
  subscriptionTiers: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0)
});

type ModuleFormData = z.infer<typeof moduleSchema>;

export default function ModuleManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [editingModule, setEditingModule] = useState<SystemModule | null>(null);

  // Form setup
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      category: "",
      icon: "Settings",
      version: "1.0.0",
      isCore: false,
      requiresSubscription: false,
      subscriptionTiers: [],
      dependencies: [],
      isActive: true,
      sortOrder: 0
    }
  });

  // Fetch system modules
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/admin/modules"],
    enabled: true
  });

  // Fetch companies for module management
  const { data: companiesData } = useQuery({
    queryKey: ["/api/companies"],
    enabled: true
  });

  // Fetch company modules when company is selected
  const { data: companyModulesData, isLoading: companyModulesLoading } = useQuery({
    queryKey: [`/api/admin/company/${selectedCompany}/modules`],
    enabled: !!selectedCompany
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      return apiRequest("/api/admin/modules", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({
        title: "Módulo Creado",
        description: "El módulo ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setShowCreateModule(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creando el módulo",
        variant: "destructive",
      });
    }
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ModuleFormData> }) => {
      return apiRequest(`/api/admin/modules/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      toast({
        title: "Módulo Actualizado",
        description: "El módulo ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setEditingModule(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error actualizando el módulo",
        variant: "destructive",
      });
    }
  });

  // Toggle company module mutation
  const toggleCompanyModuleMutation = useMutation({
    mutationFn: async ({ companyId, moduleId, enabled }: { companyId: number; moduleId: number; enabled: boolean }) => {
      const action = enabled ? "enable" : "disable";
      return apiRequest(`/api/admin/company/${companyId}/modules/${moduleId}/${action}`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Módulo Actualizado",
        description: "El estado del módulo ha sido actualizado",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/company/${selectedCompany}/modules`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error actualizando el módulo",
        variant: "destructive",
      });
    }
  });

  const modules = modulesData?.modules || [];
  const companies = companiesData?.companies || [];
  const companyModules = companyModulesData?.modules || [];

  // Filter modules
  const filteredModules = modules.filter((module: SystemModule) => {
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
    const matchesSearch = module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = Array.from(new Set(modules.map((m: SystemModule) => m.category)));

  // Handle form submission
  const onSubmit = (data: ModuleFormData) => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data });
    } else {
      createModuleMutation.mutate(data);
    }
  };

  // Handle edit module
  const handleEditModule = (module: SystemModule) => {
    setEditingModule(module);
    form.reset({
      name: module.name,
      displayName: module.displayName,
      description: module.description || "",
      category: module.category,
      icon: module.icon,
      version: module.version,
      isCore: module.isCore,
      requiresSubscription: module.requiresSubscription,
      subscriptionTiers: module.subscriptionTiers || [],
      dependencies: module.dependencies || [],
      isActive: module.isActive,
      sortOrder: module.sortOrder
    });
    setShowCreateModule(true);
  };

  // Handle toggle company module
  const handleToggleCompanyModule = (companyModule: CompanyModule) => {
    if (!selectedCompany) return;
    
    toggleCompanyModuleMutation.mutate({
      companyId: selectedCompany,
      moduleId: companyModule.moduleId,
      enabled: !companyModule.isEnabled
    });
  };

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Módulos</h1>
          <p className="text-muted-foreground">
            Administre los módulos del sistema y sus permisos por empresa
          </p>
        </div>
        <Button onClick={() => setShowCreateModule(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Módulo
        </Button>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Módulos del Sistema</TabsTrigger>
          <TabsTrigger value="company-modules">Permisos por Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar módulos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module: SystemModule) => {
              const IconComponent = moduleIcons[module.icon] || Settings;
              
              return (
                <Card key={module.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-8 h-8 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{module.displayName}</CardTitle>
                          <p className="text-sm text-muted-foreground">v{module.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {module.isCore && (
                          <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            Core
                          </Badge>
                        )}
                        <Badge variant={module.isActive ? "default" : "secondary"}>
                          {module.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Categoría:</span>
                      <Badge variant="outline">{module.category}</Badge>
                    </div>

                    {module.requiresSubscription && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Requiere suscripción:</span>
                        <div className="flex space-x-1">
                          {module.subscriptionTiers?.map((tier) => (
                            <Badge key={tier} variant="outline" className="text-xs">
                              {tier}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {module.dependencies && module.dependencies.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Dependencias:</span>
                        <div className="flex flex-wrap gap-1">
                          {module.dependencies.map((dep) => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="company-modules" className="space-y-6">
          {/* Company Selection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedCompany?.toString() || ""} onValueChange={(value) => setSelectedCompany(parseInt(value))}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company: Company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.businessName || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Company Modules */}
          {selectedCompany && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyModulesLoading ? (
                <div className="col-span-full flex justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                companyModules.map((companyModule: CompanyModule) => {
                  const IconComponent = moduleIcons[companyModule.module.icon] || Settings;
                  
                  return (
                    <Card key={companyModule.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="w-6 h-6 text-primary" />
                            <div>
                              <CardTitle className="text-base">{companyModule.module.displayName}</CardTitle>
                              <p className="text-sm text-muted-foreground">v{companyModule.module.version}</p>
                            </div>
                          </div>
                          <Switch
                            checked={companyModule.isEnabled}
                            onCheckedChange={() => handleToggleCompanyModule(companyModule)}
                            disabled={companyModule.module.isCore || toggleCompanyModuleMutation.isPending}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{companyModule.module.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge variant={companyModule.isEnabled ? "default" : "secondary"}>
                            {companyModule.isEnabled ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Habilitado
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Deshabilitado
                              </>
                            )}
                          </Badge>
                        </div>

                        {companyModule.enabledAt && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Habilitado:</span>
                            <span>{new Date(companyModule.enabledAt).toLocaleDateString()}</span>
                          </div>
                        )}

                        {companyModule.module.isCore && (
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Shield className="w-3 h-3" />
                            <span>Módulo esencial - No se puede deshabilitar</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Module Dialog */}
      <Dialog open={showCreateModule} onOpenChange={setShowCreateModule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Editar Módulo" : "Crear Nuevo Módulo"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Módulo</FormLabel>
                      <FormControl>
                        <Input placeholder="pos_system" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre para Mostrar</FormLabel>
                      <FormControl>
                        <Input placeholder="Sistema POS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del módulo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="core">Core</SelectItem>
                          <SelectItem value="pos">POS</SelectItem>
                          <SelectItem value="accounting">Contabilidad</SelectItem>
                          <SelectItem value="hr">Recursos Humanos</SelectItem>
                          <SelectItem value="inventory">Inventario</SelectItem>
                          <SelectItem value="sales">Ventas</SelectItem>
                          <SelectItem value="reports">Reportes</SelectItem>
                          <SelectItem value="communication">Comunicación</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar icono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(moduleIcons).map((iconName) => (
                            <SelectItem key={iconName} value={iconName}>
                              {iconName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isCore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Módulo Esencial</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          No se puede deshabilitar
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

                <FormField
                  control={form.control}
                  name="requiresSubscription"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requiere Suscripción</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Solo para planes pagos
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModule(false);
                    setEditingModule(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                >
                  {createModuleMutation.isPending || updateModuleMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {editingModule ? "Actualizar" : "Crear"} Módulo
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}