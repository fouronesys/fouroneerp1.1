import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  User, 
  Mail, 
  Calendar, 
  Building2, 
  Crown, 
  Edit3, 
  Save, 
  X,
  Camera,
  CreditCard,
  TrendingUp,
  Star,
  Check,
  ArrowRight,
  Gift,
  Zap,
  Shield,
  Users,
  Database,
  Smartphone,
  FileText,
  BarChart3,
  Palette,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType, Company } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { currentPlan, planConfig, daysUntilExpiry } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/current"],
  });

  const { data: billingHistory } = useQuery({
    queryKey: ["/api/billing/history"],
    enabled: !!user,
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/currency/rates"],
    enabled: !!user,
  });

  const subscriptionPlans = [
    {
      id: 'monthly',
      name: 'Plan Mensual',
      price: 3500,
      currency: 'DOP',
      period: 'mes',
      description: 'Solución completa para empresas dominicanas',
      features: [
        'POS completo con impresión térmica',
        'Facturación electrónica NCF',
        'Reportes DGII 606/607',
        'Multi-moneda automática',
        'Inventario completo',
        'Usuarios ilimitados',
        'Soporte técnico completo',
        'Todas las funcionalidades'
      ],
      icon: Zap,
      color: 'bg-blue-500',
      popular: false
    },
    {
      id: 'annual',
      name: 'Plan Anual',
      price: 24000,
      currency: 'DOP',
      period: 'año',
      description: 'Ahorra con el plan anual completo',
      originalPrice: 42000,
      savings: 18000,
      features: [
        'Todas las funcionalidades del plan mensual',
        'Ahorro de RD$18,000 al año',
        'Soporte prioritario 24/7',
        'Capacitación personalizada',
        'Actualizaciones automáticas',
        'Backup en la nube incluido',
        'Integración contable avanzada',
        'Reportes personalizados'
      ],
      icon: Crown,
      color: 'bg-purple-500',
      popular: true
    }
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const upgradePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("/api/billing/upgrade-plan", {
        method: "POST",
        body: { planId }
      });
    },
    onSuccess: (data: any) => {
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        toast({
          title: "Plan actualizado",
          description: data.message || "Plan actualizado exitosamente",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/companies/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/billing/history"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleUpgradePlan = (planId: string) => {
    upgradePlanMutation.mutate(planId);
  };

  const getPlanBadgeColor = () => {
    switch (currentPlan) {
      case "annual":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "monthly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "trial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Mi Perfil" subtitle="Gestiona tu información personal y configuración" />
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-32">
        {/* Profile Overview */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback className="text-lg sm:text-xl bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full p-0"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <Badge className={getPlanBadgeColor()}>
                    {currentPlan === "trial" ? "Prueba" : 
                     currentPlan === "monthly" ? "Mensual" : "Anual"}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {user?.email}
                </p>
                {company && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {company.name}
                  </p>
                )}
              </div>
              
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                size="sm"
                className="self-start"
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="subscription">Suscripción</TabsTrigger>
                <TabsTrigger value="billing">Facturación</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          placeholder="Ingresa tu nombre"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{user?.firstName || "No especificado"}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          placeholder="Ingresa tu apellido"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{user?.lastName || "No especificado"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="Ingresa tu email"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{user?.email}</span>
                      </div>
                    )}
                  </div>

                  {company && (
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{company.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Miembro desde</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {new Date().toLocaleDateString("es-DO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>Guardando...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Plan Actual</h3>
                    <Badge className={getPlanBadgeColor()}>
                      {currentPlan === "trial" ? "Prueba Gratuita" : 
                       currentPlan === "monthly" ? "Plan Mensual" : "Plan Anual"}
                    </Badge>
                  </div>

                  {daysUntilExpiry !== null && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800 dark:text-orange-200">
                          Tu plan vence en {daysUntilExpiry} días
                        </span>
                      </div>
                      <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                        Actualiza tu plan para continuar disfrutando de todas las funciones.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-semibold">Planes Disponibles</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      {subscriptionPlans.map((plan) => {
                        const IconComponent = plan.icon;
                        const isCurrentPlan = company?.subscriptionPlan === plan.id;
                        
                        return (
                          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-purple-500' : ''}`}>
                            {plan.popular && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-purple-500 text-white">Más Popular</Badge>
                              </div>
                            )}
                            
                            <CardHeader className="text-center pb-2">
                              <div className={`w-12 h-12 ${plan.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="space-y-1">
                                <div className="text-3xl font-bold">
                                  RD${plan.price.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">por {plan.period}</div>
                                {plan.savings && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Ahorras RD${plan.savings.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                {plan.description}
                              </p>
                              
                              <ul className="space-y-2">
                                {plan.features.map((feature, index) => (
                                  <li key={index} className="flex items-center space-x-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              <Button 
                                className="w-full" 
                                variant={isCurrentPlan ? "outline" : "default"}
                                disabled={isCurrentPlan || upgradePlanMutation.isPending}
                                onClick={() => handleUpgradePlan(plan.id)}
                              >
                                {upgradePlanMutation.isPending ? (
                                  "Procesando..."
                                ) : isCurrentPlan ? (
                                  "Plan Actual"
                                ) : (
                                  <>
                                    Elegir Plan
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Historial de Facturación</h3>
                  
                  {billingHistory && billingHistory.billingHistory && Array.isArray(billingHistory.billingHistory) && billingHistory.billingHistory.length > 0 ? (
                    <div className="space-y-3">
                      {billingHistory.billingHistory.map((bill: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {bill.description || "Pago de suscripción"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(bill.date).toLocaleDateString("es-DO", {
                                    timeZone: "America/Santo_Domingo",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">RD${bill.amount.toLocaleString()}</p>
                              <Badge variant="outline" className="text-xs">
                                {bill.status === 'paid' ? "Pagado" : bill.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              Próximo pago: {(billingHistory as any)?.currentPlan === 'annual' ? 'RD$24,000' : 'RD$3,500'}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                              Vence: {new Date((billingHistory as any)?.expirationDate || new Date()).toLocaleDateString("es-DO", {
                                timeZone: "America/Santo_Domingo",
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('/billing-history', '_blank')}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ver Historial
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          No hay historial de facturación
                        </h4>
                        <p className="text-gray-500 text-sm">
                          Los pagos y facturas aparecerán aquí una vez que realices tu primera transacción.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Ingresa tu nombre"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Ingresa tu apellido"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Ingresa tu email"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nombre completo</p>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</p>
                      <p className="font-medium">
                        {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString('es-DO') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Información de Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-semibold">{planConfig?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan actual</p>
                </div>
                <Badge className={getPlanBadgeColor()}>
                  {currentPlan === "trial" ? "Prueba" : 
                   currentPlan === "monthly" ? "Mensual" : "Anual"}
                </Badge>
              </div>

              {daysUntilExpiry > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Tu suscripción expira en {daysUntilExpiry} días
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Funcionalidades incluidas:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {planConfig?.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                      <span className="capitalize">{feature.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Actualizar Plan
                </Button>
                <Button variant="outline" className="w-full">
                  Ver Historial de Facturación
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Information */}
        {company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                
                {company.businessName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Razón Social</p>
                    <p className="font-medium">{company.businessName}</p>
                  </div>
                )}
                
                {company.rnc && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">RNC</p>
                    <p className="font-medium">{company.rnc}</p>
                  </div>
                )}
                
                {company.industry && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Industria</p>
                    <p className="font-medium">{company.industry}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                  <Badge variant={company.isActive ? "default" : "destructive"}>
                    {company.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}