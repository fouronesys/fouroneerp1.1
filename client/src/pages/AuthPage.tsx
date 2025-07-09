import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Building, Lock, Mail, User, Search, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import fourOneLogo from "@assets/Four One Solutions Logo.png";
import { useLocation, useRouter } from "wouter";
import { ROUTES } from "@/config/routes";
import FourOneLoginAnimation from "@/components/FourOneLoginAnimation";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(1, "Company name is required"),
  rnc: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface RNCValidationResult {
  valid: boolean;
  message: string;
  data?: {
    rnc: string;
    name?: string;
    razonSocial?: string;
    categoria?: string;
    estado?: string;
  };
}

interface RNCSuggestion {
  rnc: string;
  name: string;
  razonSocial?: string;
  categoria?: string;
  estado?: string;
}

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [isVerifyingRNC, setIsVerifyingRNC] = useState(false);
  const [rncValidationResult, setRncValidationResult] = useState<RNCValidationResult | null>(null);
  const [rncSuggestions, setRncSuggestions] = useState<RNCSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

 const router = useRouter();
 const [location] = useLocation();

  // Automatically switch to register tab if accessing via /register route
  useEffect(() => {
  if (location === ROUTES.REGISTER) {
    setActiveTab("register");
  } else if (location === "/forgot-password") {
    setActiveTab("forgot-password");
  }
}, [location]);

  const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  router.navigate(
    tab === "login" 
      ? ROUTES.LOGIN 
      : tab === "register" 
        ? ROUTES.REGISTER 
        : "/forgot-password"
  );
};

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      companyName: "",
      rnc: "",
    },
  });

  const handleRNCVerification = async (rncValue: string) => {
    if (!rncValue || rncValue.length < 9) return;
    
    setIsVerifyingRNC(true);
    setRncValidationResult(null);
    
    try {
      const response = await apiRequest(`/api/dgii/rnc-lookup?rnc=${encodeURIComponent(rncValue)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setRncValidationResult({
          valid: true,
          message: "RNC válido y encontrado en DGII",
          data: result.data
        });
        
        // Auto-llenar campos si están vacíos
        if (result.data.name && !registerForm.getValues("companyName")) {
          registerForm.setValue("companyName", result.data.name);
        }
        
        toast({
          title: "RNC Verificado",
          description: `Empresa: ${result.data.name || result.data.razonSocial}`,
        });
      } else {
        setRncValidationResult({
          valid: false,
          message: result.message || "RNC no encontrado en DGII"
        });
      }
    } catch (error) {
      console.error('Error verifying RNC:', error);
      setRncValidationResult({
        valid: false,
        message: "Error al verificar RNC. Intente nuevamente."
      });
    } finally {
      setIsVerifyingRNC(false);
    }
  };

  const searchRNCCompanies = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setRncSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await apiRequest(`/api/dgii/search-companies?query=${encodeURIComponent(searchTerm)}`);
      const result = await response.json();
      
      console.log('Search companies result:', result); // Debug log
      
      if (result.success && result.data && Array.isArray(result.data)) {
        const suggestions = result.data.slice(0, 5).map((company: any) => ({
          rnc: company.rnc,
          name: company.razonSocial || company.name || 'Empresa sin nombre',
          razonSocial: company.razonSocial,
          categoria: company.categoria || company.category,
          estado: company.estado || company.status
        }));
        
        console.log('Mapped suggestions:', suggestions); // Debug log
        setRncSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setRncSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      setRncSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectRNCFromSuggestion = (suggestion: RNCSuggestion) => {
    registerForm.setValue("rnc", suggestion.rnc);
    registerForm.setValue("companyName", suggestion.name);
    
    setRncValidationResult({
      valid: true,
      message: "RNC seleccionado de la lista DGII",
      data: {
        rnc: suggestion.rnc,
        name: suggestion.name,
        razonSocial: suggestion.razonSocial,
        categoria: suggestion.categoria,
        estado: suggestion.estado
      }
    });
    
    setShowSuggestions(false);
    setRncSuggestions([]);
    
    toast({
      title: "Empresa Seleccionada",
      description: `${suggestion.name} - RNC: ${suggestion.rnc}`,
    });
  };

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = "Login failed";
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || "Invalid credentials";
          } else {
            errorMessage = await response.text() || "Server error";
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: (user) => {
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente.",
      });
      
      // Clear browser cache and show animation
      queryClient.clear();
      setShowLoginAnimation(true);
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      console.log("Error type:", typeof error);
      console.log("Error message:", error?.message);
      
      // Extract error message from the error object
      let errorMessage = "Credenciales inválidas";
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      }
      
      console.log("Final error message:", errorMessage);
      
      // Handle specific error types
      if (errorMessage === "processing") {
        toast({
          title: "Orden en Procesamiento",
          description: "Su pago ha sido confirmado y su cuenta está siendo procesada.",
          variant: "default",
        });
      } else if (errorMessage === "payment_required") {
        toast({
          title: "Pago Requerido",
          description: "Debe completar el pago para activar su cuenta.",
          variant: "destructive",
        });
        setTimeout(() => {
          router.navigate(ROUTES.PAYMENT);
        }, 2000);
      } else {
        // Parse the error message if it contains status codes
        if (errorMessage.includes("401:")) {
          errorMessage = "Email o contraseña incorrectos";
        } else if (errorMessage.includes("500:")) {
          errorMessage = "Error interno del servidor";
        } else if (errorMessage.includes("Invalid email or password")) {
          errorMessage = "Email o contraseña incorrectos. Por favor, verifique sus credenciales.";
        } else if (errorMessage.includes("intentos restantes")) {
          // Show warning with remaining attempts
          toast({
            title: "⚠️ Advertencia de seguridad",
            description: errorMessage,
            variant: "destructive",
            duration: 6000,
          });
          return;
        } else if (errorMessage.includes("bloqueada temporalmente")) {
          // Show account locked message
          toast({
            title: "🔒 Cuenta bloqueada",
            description: errorMessage,
            variant: "destructive",
            duration: 10000,
          });
          return;
        }
        
        toast({
          title: "Error de inicio de sesión",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      console.log('Sending registration data:', data); // Debug log
      
      // Prepare data with RNC information
      const registrationData = {
        ...data,
        rnc: data.rnc || null, // Include RNC if provided
        rncValidation: rncValidationResult // Include validation result
      };
      
      const response = await apiRequest("/api/register", {
        method: "POST",
        body: registrationData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la cuenta");
      }
      
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Ahora debes completar tu pago para activar tu cuenta.",
      });
      // Redirect to setup page for trial users
      router.navigate(ROUTES.SETUP);
    },
    onError: (error: any) => {
      console.error('Registration error:', error); // Debug log
      toast({
        title: "Error en el registro",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error enviando email de recuperación");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Si existe una cuenta con ese email, se ha enviado un enlace de recuperación.",
      });
      forgotPasswordForm.reset();
      setActiveTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error enviando email de recuperación",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const onForgotPassword = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleAnimationComplete = () => {
    setShowLoginAnimation(false);
    // Redirect to dashboard after successful login
    router.navigate(ROUTES.DASHBOARD);
  };

  return (
    <>
      <FourOneLoginAnimation 
        isVisible={showLoginAnimation} 
        onComplete={handleAnimationComplete}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="flex min-h-screen">
        {/* Left Column - Hero Section */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12 bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative z-10 max-w-md">
            <div className="mb-8">
              <img
                src={fourOneLogo}
                alt="Four One Solutions"
                className="h-20 w-auto mb-6 filter brightness-0 invert"
              />
              <h1 className="text-4xl font-bold text-white mb-4">
                Sistema de Gestión Empresarial
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Solución integral para empresas dominicanas con módulos de manufactura, POS, inventario, RRHH y nómina.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Gestión Completa</h3>
                  <p className="text-blue-100">Manufactura, POS, inventario y más en una sola plataforma</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Seguro y Confiable</h3>
                  <p className="text-blue-100">Cumplimiento fiscal dominicano y seguridad de datos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Multi-usuario</h3>
                  <p className="text-blue-100">Roles y permisos personalizados para tu equipo</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-blue-400/30">
              <p className="text-blue-100 text-sm">
                "Four One Solutions ha transformado completamente nuestra operación empresarial"
              </p>
              <p className="text-blue-200 text-xs mt-2 font-medium">
                - Empresas líderes en República Dominicana
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8 lg:hidden">
              <img
                src={fourOneLogo}
                alt="Four One Solutions Logo"
                className="h-16 w-auto mx-auto mb-4"
              />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeTab === "login" ? "Bienvenido de vuelta" : "Únete a nosotros"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {activeTab === "login" 
                  ? "Accede a tu cuenta para continuar" 
                  : "Crea tu cuenta y comienza a gestionar tu empresa"}
              </p>
              

            </div>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="lg:hidden flex justify-center mb-4">
                  <img src={fourOneLogo} alt="Four One Solutions" className="h-12 w-auto" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Four One Solutions</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Sistema de gestión empresarial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                    <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300">Registrarse</TabsTrigger>
                    <TabsTrigger value="forgot-password" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300">Recuperar</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Correo Electrónico</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type="email"
                                    placeholder="Ingresa tu email"
                                    className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Contraseña</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ingresa tu contraseña"
                                    className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                        
                        <div className="text-center mt-4">
                          <Button
                            type="button"
                            variant="link"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0"
                            onClick={() => setActiveTab('forgot-password')}
                          >
                            ¿Olvidaste tu contraseña?
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Register Tab */}
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 dark:text-gray-200">Nombre</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                      placeholder="Tu nombre"
                                      className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-red-400" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 dark:text-gray-200">Apellido</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                      placeholder="Tu apellido"
                                      className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-red-500 dark:text-red-400" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Nombre de la Empresa</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    placeholder="Nombre de tu empresa o buscar por RNC"
                                    className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      // Buscar empresas si se está escribiendo texto
                                      if (e.target.value.length >= 3) {
                                        searchRNCCompanies(e.target.value);
                                      } else {
                                        setShowSuggestions(false);
                                      }
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                              
                              {/* Sugerencias de empresas */}
                              {showSuggestions && rncSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {rncSuggestions.map((suggestion, index) => (
                                    <div
                                      key={index}
                                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                      onClick={() => selectRNCFromSuggestion(suggestion)}
                                    >
                                      <div className="font-medium text-gray-900 dark:text-white truncate">
                                        {suggestion.name}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        RNC: {suggestion.rnc}
                                      </div>
                                      {suggestion.categoria && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400">
                                          {suggestion.categoria}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="rnc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                RNC (Registro Nacional del Contribuyente)
                                {isVerifyingRNC && <Search className="h-3 w-3 animate-spin" />}
                              </FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                      placeholder="131-12345-6 (opcional)"
                                      className={`pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 ${
                                        rncValidationResult?.valid === true 
                                          ? "border-green-500 bg-green-50 dark:bg-green-950" 
                                          : rncValidationResult?.valid === false 
                                          ? "border-red-500 bg-red-50 dark:bg-red-950" 
                                          : ""
                                      }`}
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        // Limpiar validación anterior
                                        if (rncValidationResult) {
                                          setRncValidationResult(null);
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const rncValue = e.target.value?.replace(/\D/g, '') || '';
                                        if (rncValue && rncValue.length >= 9) {
                                          handleRNCVerification(rncValue);
                                        }
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isVerifyingRNC || !field.value}
                                    onClick={() => {
                                      const rncValue = field.value?.replace(/\D/g, '') || '';
                                      if (rncValue) {
                                        handleRNCVerification(rncValue);
                                      }
                                    }}
                                    className="px-3"
                                  >
                                    {isVerifyingRNC ? (
                                      <Search className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Verificar"
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              
                              {/* Resultado de verificación de RNC */}
                              {rncValidationResult && (
                                <div className={`mt-2 p-2 rounded-md text-sm ${
                                  rncValidationResult.valid
                                    ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {rncValidationResult.valid ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4" />
                                    )}
                                    <span>{rncValidationResult.message}</span>
                                  </div>
                                  {rncValidationResult.data && (
                                    <div className="mt-1 space-y-1">
                                      {rncValidationResult.data.name && (
                                        <div>Empresa: {rncValidationResult.data.name}</div>
                                      )}
                                      {rncValidationResult.data.categoria && (
                                        <Badge variant="secondary" className="text-xs">
                                          {rncValidationResult.data.categoria}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Correo Electrónico</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type="email"
                                    placeholder="Ingresa tu email"
                                    className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Contraseña</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ingresa tu contraseña"
                                    className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Confirmar Contraseña</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirma tu contraseña"
                                    className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Forgot Password Tab */}
                  <TabsContent value="forgot-password">
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recuperar Contraseña</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                          </p>
                        </div>
                        
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 dark:text-gray-200">Correo Electrónico</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <Input
                                    type="email"
                                    placeholder="Ingresa tu email"
                                    className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          disabled={forgotPasswordMutation.isPending}
                        >
                          {forgotPasswordMutation.isPending ? "Enviando email..." : "Enviar Enlace de Recuperación"}
                        </Button>
                        
                        <div className="text-center mt-4">
                          <Button
                            type="button"
                            variant="link"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0"
                            onClick={() => setActiveTab('login')}
                          >
                            ← Volver al login
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>


              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  © 2025 Four One Solutions. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sistema ERP para empresas dominicanas
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Section */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white">
                  Solución ERP Integral para República Dominicana
                </h1>
                <p className="text-xl text-gray-300">
                  Gestiona tu empresa con tecnología de vanguardia. Sistema completo de gestión empresarial con facturación DGII, punto de venta, inventario y más.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-blue-400 mb-2">Gestión de Inventario</h3>
                  <p className="text-gray-400">Control completo de productos, stock y almacenes en tiempo real</p>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-blue-400 mb-2">Punto de Venta</h3>
                  <p className="text-gray-400">Sistema POS moderno con impresión térmica y sincronización automática</p>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-blue-400 mb-2">Facturación DGII</h3>
                  <p className="text-gray-400">Cumplimiento total con regulaciones dominicanas y NCF automáticos</p>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-blue-400 mb-2">Reportes Avanzados</h3>
                  <p className="text-gray-400">Análisis detallados y reportes personalizables para tomar mejores decisiones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
