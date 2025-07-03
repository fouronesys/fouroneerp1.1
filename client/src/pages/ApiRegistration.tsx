import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Code, Shield, Zap, Globe } from "lucide-react";
import { Link } from "wouter";

const registrationSchema = z.object({
  email: z.string().email("Email inválido"),
  companyName: z.string().min(2, "Nombre de empresa debe tener al menos 2 caracteres"),
  contactName: z.string().min(2, "Nombre de contacto debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  description: z.string().min(10, "Descripción debe tener al menos 10 caracteres"),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function ApiRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      companyName: "",
      contactName: "", 
      phone: "",
      website: "",
      description: "",
    },
  });

  const onSubmit = async (data: RegistrationData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/developers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setApiKey(result.apiKey);
      setRegistrationComplete(true);
      toast({
        title: "Registro exitoso",
        description: "Tu clave API ha sido generada y enviada por correo electrónico",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email para acceder a tu API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/developers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: loginEmail })
      });

      if (response.ok) {
        const result = await response.json();
        setApiKey(result.apiKey);
        setRegistrationComplete(true);
        setShowLogin(false);
        toast({
          title: "Acceso exitoso",
          description: "Tu API key ha sido enviada por correo electrónico",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error de acceso",
          description: error.message || "No se encontró una cuenta con este email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copiado",
        description: "Clave API copiada al portapapeles",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar la clave",
        variant: "destructive",
      });
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Registro Completado!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Tu clave API ha sido generada exitosamente
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Tu Clave API:</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white dark:bg-gray-900 border rounded text-sm font-mono">
                      {apiKey}
                    </code>
                    <Button onClick={copyApiKey} variant="outline" size="sm">
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="text-left space-y-4">
                  <h3 className="font-semibold">Próximos pasos:</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Guarda tu clave API en un lugar seguro
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Consulta la documentación de la API para comenzar a integrar
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      Todas las llamadas a la API deben incluir el header: Authorization: Bearer {apiKey ? apiKey.substring(0, 10) + '...' : '[tu-api-key]'}
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <Link href="/api-docs">Ver Documentación</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/">Volver al Inicio</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            API para Desarrolladores
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Accede a nuestras APIs para validación de RNC, consultas fiscales y más
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Seguro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                APIs seguras con autenticación por clave
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Rápido</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Respuestas en tiempo real
              </p>
            </div>
            <div className="text-center">
              <Code className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Fácil</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Documentación completa y ejemplos
              </p>
            </div>
            <div className="text-center">
              <Globe className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Gratuito</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Acceso gratuito para todos
              </p>
            </div>
          </div>
        </div>

        {/* Toggle between Registration and Login */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border">
            <Button
              variant={!showLogin ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowLogin(false)}
            >
              Nuevo Registro
            </Button>
            <Button
              variant={showLogin ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowLogin(true)}
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>

        {/* Registration/Login Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{showLogin ? "Acceder a mi API Key" : "Registro de Desarrollador"}</CardTitle>
            <CardDescription>
              {showLogin 
                ? "Ingresa tu email para recibir tu clave API por correo"
                : "Completa este formulario para obtener tu clave API gratuita"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLogin ? (
              // Login Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="tu-email@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  disabled={isLoggingIn || !loginEmail}
                  className="w-full"
                >
                  {isLoggingIn ? "Enviando..." : "Enviar API Key por Correo"}
                </Button>
              </div>
            ) : (
              // Registration Form
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Contacto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="juan@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Empresa SRL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="809-123-4567" {...field} />
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
                          <Input placeholder="https://miempresa.com" {...field} />
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
                      <FormLabel>Descripción del Proyecto *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe brevemente cómo planeas usar nuestras APIs..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : "Registrar y Obtener API Key"}
                </Button>
              </form>
            </Form>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}