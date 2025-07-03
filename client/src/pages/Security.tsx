import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, Key, AlertTriangle, CheckCircle, Clock, MapPin, Monitor, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Security() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: securityData, isLoading } = useQuery({
    queryKey: ["/api/security/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("/api/security/dashboard");
      return response.json();
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("/api/security/change-password", {
        method: "POST",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente"
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/security/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggle2FAMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const response = await apiRequest("/api/security/two-factor", {
        method: "POST",
        body: JSON.stringify({ enable })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.message,
        description: data.twoFactorEnabled 
          ? "Tu cuenta ahora está más segura"
          : "Autenticación de dos factores deshabilitada"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Cargando información de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Seguridad de la Cuenta</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Security Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Seguridad</CardTitle>
                  <CardDescription>
                    Información general sobre la seguridad de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span>Último cambio de contraseña</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {securityData?.passwordLastChanged 
                        ? format(new Date(securityData.passwordLastChanged), "dd MMM yyyy", { locale: es })
                        : "No disponible"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Autenticación de dos factores</span>
                    </div>
                    <Badge variant={securityData?.twoFactorEnabled ? "default" : "secondary"}>
                      {securityData?.twoFactorEnabled ? "Habilitada" : "Deshabilitada"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span>Sesiones activas</span>
                    </div>
                    <span>{securityData?.activeSessions || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Estado de la cuenta</span>
                    </div>
                    <Badge variant="default">
                      {securityData?.accountStatus || "Activa"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Security Alerts */}
              {securityData?.securityAlerts && securityData.securityAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Alertas de Seguridad
                    </CardTitle>
                    <CardDescription>
                      Actividades sospechosas detectadas recientemente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {securityData.securityAlerts.map((alert: any) => (
                          <div key={alert.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{alert.message}</p>
                              <Badge variant="outline" className="ml-2">
                                {alert.resolved ? "Resuelto" : "Pendiente"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(alert.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Intentos de Inicio de Sesión</CardTitle>
                  <CardDescription>
                    Historial reciente de accesos a tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {securityData?.loginAttempts?.map((attempt: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {attempt.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium">
                                  {attempt.success ? "Inicio exitoso" : "Intento fallido"}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(new Date(attempt.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{attempt.location}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                IP: {attempt.ipAddress} • {attempt.userAgent}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Contraseña actual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>

                  <Button 
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                    className="w-full"
                  >
                    {changePasswordMutation.isPending ? "Actualizando..." : "Cambiar Contraseña"}
                  </Button>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Autenticación de Dos Factores</CardTitle>
                  <CardDescription>
                    Añade una capa extra de seguridad a tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {securityData?.twoFactorEnabled ? "Habilitada" : "Deshabilitada"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {securityData?.twoFactorEnabled 
                          ? "Tu cuenta está protegida con 2FA"
                          : "Habilita 2FA para mayor seguridad"}
                      </p>
                    </div>
                    <Switch
                      checked={securityData?.twoFactorEnabled || false}
                      onCheckedChange={(checked) => toggle2FAMutation.mutate(checked)}
                      disabled={toggle2FAMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Security Tips Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Consejos de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Contraseñas seguras</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Usa al menos 8 caracteres</li>
                  <li>• Combina letras, números y símbolos</li>
                  <li>• No uses información personal</li>
                  <li>• Cambia tu contraseña regularmente</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Protege tu cuenta</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Habilita la autenticación 2FA</li>
                  <li>• Revisa la actividad regularmente</li>
                  <li>• No compartas tus credenciales</li>
                  <li>• Cierra sesión en dispositivos públicos</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Señales de alerta</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Intentos de acceso desconocidos</li>
                  <li>• Cambios no autorizados</li>
                  <li>• Emails sospechosos</li>
                  <li>• Actividad inusual</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}