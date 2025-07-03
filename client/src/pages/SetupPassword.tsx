import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const passwordSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/\d/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SetupPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await apiRequest("POST", "/api/validate-token", { token });
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
          setIsRecovery(data.isRecovery || false);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: PasswordFormData) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Token no válido",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/setup-password", {
        token,
        password: data.password
      });

      setShowSuccess(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al establecer la contraseña",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return "bg-red-500";
    if (strength < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 2) return "Débil";
    if (strength < 4) return "Media";
    return "Fuerte";
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Validando enlace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enlace No Válido
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                El enlace ha expirado o no es válido. Por favor solicita uno nuevo.
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isRecovery ? "¡Contraseña actualizada!" : "¡Cuenta configurada!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {isRecovery 
                  ? "Tu contraseña ha sido actualizada exitosamente."
                  : "Tu cuenta ha sido configurada exitosamente. Ya puedes iniciar sesión."}
              </p>
              <Button 
                onClick={() => setLocation("/auth")}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(form.watch("password") || "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">
            {isRecovery ? "Recuperar Contraseña" : "Configurar Contraseña"}
          </CardTitle>
          <CardDescription>
            {isRecovery 
              ? "Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta"
              : "Establece una contraseña segura para acceder a tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="Ingresa tu contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password strength indicator */}
              {form.watch("password") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Fortaleza:</span>
                    <span className={`font-medium ${
                      passwordStrength < 2 ? 'text-red-500' : 
                      passwordStrength < 4 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...form.register("confirmPassword")}
                  placeholder="Confirma tu contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password requirements */}
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-medium">La contraseña debe contener:</p>
              <ul className="space-y-1 ml-4">
                <li className={`flex items-center gap-2 ${
                  (form.watch("password")?.length || 0) >= 8 ? 'text-green-600' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    (form.watch("password")?.length || 0) >= 8 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Al menos 8 caracteres
                </li>
                <li className={`flex items-center gap-2 ${
                  /[A-Z]/.test(form.watch("password") || '') ? 'text-green-600' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    /[A-Z]/.test(form.watch("password") || '') ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Una letra mayúscula
                </li>
                <li className={`flex items-center gap-2 ${
                  /[a-z]/.test(form.watch("password") || '') ? 'text-green-600' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    /[a-z]/.test(form.watch("password") || '') ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Una letra minúscula
                </li>
                <li className={`flex items-center gap-2 ${
                  /\d/.test(form.watch("password") || '') ? 'text-green-600' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    /\d/.test(form.watch("password") || '') ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Un número
                </li>
                <li className={`flex items-center gap-2 ${
                  /[^A-Za-z0-9]/.test(form.watch("password") || '') ? 'text-green-600' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    /[^A-Za-z0-9]/.test(form.watch("password") || '') ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Un carácter especial
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || passwordStrength < 5}
            >
              {isSubmitting ? "Configurando..." : isRecovery ? "Actualizar Contraseña" : "Establecer Contraseña"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>¿Necesitas ayuda?</p>
            <p>Contacta: <span className="text-blue-600">soporte@fourone.com.do</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}