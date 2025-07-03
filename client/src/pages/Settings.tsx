import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Globe, 
  Lock, 
  Database,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Save,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Key,
  Eye,
  EyeOff,
  Bell,
  Printer,
  Wifi,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Volume2,
  VolumeX
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useThemeContext } from "@/components/ThemeProvider";

interface SystemSettings {
  theme: "light" | "dark" | "system";
  language: "es" | "en";
  currency: "DOP" | "USD" | "EUR";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  autoSave: boolean;
  autoBackup: boolean;
  showTooltips: boolean;
  compactMode: boolean;
  highContrast: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordChangeRequired: boolean;
  loginNotifications: boolean;
}

interface PrinterSettings {
  defaultPrinter: string;
  paperSize: "58mm" | "80mm";
  printLogo: boolean;
  printQR: boolean;
  autoOpenDrawer: boolean;
}

interface DataSettings {
  autoBackupInterval: "daily" | "weekly" | "monthly";
  backupLocation: "local" | "cloud";
  dataRetention: number;
  syncEnabled: boolean;
}

interface POSSettings {
  printerWidth: "58mm" | "80mm";
  showNCF: boolean;
  autoOpenCashDrawer: boolean;
  requireCustomer: boolean;
  defaultPaymentMethod: "cash" | "card" | "transfer";
  receiptFooter: string;
  showCompanyLogo: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useThemeContext();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    theme: "light",
    language: "es",
    currency: "DOP",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    autoSave: true,
    autoBackup: true,
    showTooltips: true,
    compactMode: false,
    highContrast: false,
    soundEnabled: true,
    notificationsEnabled: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordChangeRequired: false,
    loginNotifications: true,
  });

  const [posSettings, setPosSettings] = useState<POSSettings>({
    printerWidth: "80mm",
    showNCF: true,
    autoOpenCashDrawer: false,
    requireCustomer: false,
    defaultPaymentMethod: "cash",
    receiptFooter: "¡Gracias por su compra!",
    showCompanyLogo: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      return await apiRequest("/api/settings/system", {
        method: "PUT",
        body: settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Las preferencias del sistema han sido guardadas.",
      });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (settings: SecuritySettings) => {
      return await apiRequest("/api/settings/security", {
        method: "PUT",
        body: settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración de seguridad actualizada",
        description: "Los ajustes de seguridad han sido guardados.",
      });
    },
  });

  const updatePOSMutation = useMutation({
    mutationFn: async (settings: POSSettings) => {
      return await apiRequest("/api/pos/print-settings", {
        method: "PUT",
        body: settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuración del POS actualizada",
        description: "Los ajustes del punto de venta han sido guardados.",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      return await apiRequest("/api/auth/change-password", {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica tu contraseña actual.",
        variant: "destructive",
      });
    },
  });

  const handleSystemSettingChange = (key: keyof SystemSettings, value: any) => {
    const newSettings = { ...systemSettings, [key]: value };
    setSystemSettings(newSettings);
    
    if (key === "theme") {
      setTheme(value);
    }
    
    updateSystemMutation.mutate(newSettings);
  };

  const handleSecuritySettingChange = (key: keyof SecuritySettings, value: any) => {
    const newSettings = { ...securitySettings, [key]: value };
    setSecuritySettings(newSettings);
    updateSecurityMutation.mutate(newSettings);
  };

  const handlePOSSettingChange = (key: keyof POSSettings, value: any) => {
    const newSettings = { ...posSettings, [key]: value };
    setPosSettings(newSettings);
    updatePOSMutation.mutate(newSettings);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordForm);
  };

  const exportSettings = () => {
    const allSettings = {
      system: systemSettings,
      security: { ...securitySettings, twoFactorEnabled: false },
      pos: posSettings,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `four-one-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuración exportada",
      description: "El archivo de configuración ha sido descargado.",
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Configuración" subtitle="Personaliza tu experiencia y ajustes del sistema" />
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-32">
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datos
            </TabsTrigger>
          </TabsList>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apariencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={systemSettings.theme}
                    onValueChange={(value) => handleSystemSettingChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Oscuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo compacto</Label>
                    <p className="text-sm text-gray-500">Reduce el espaciado entre elementos</p>
                  </div>
                  <Switch
                    checked={systemSettings.compactMode}
                    onCheckedChange={(checked) => handleSystemSettingChange("compactMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sonidos habilitados</Label>
                    <p className="text-sm text-gray-500">Reproduce sonidos de notificación</p>
                  </div>
                  <Switch
                    checked={systemSettings.soundEnabled}
                    onCheckedChange={(checked) => handleSystemSettingChange("soundEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones habilitadas</Label>
                    <p className="text-sm text-gray-500">Permite mostrar notificaciones del sistema</p>
                  </div>
                  <Switch
                    checked={systemSettings.notificationsEnabled}
                    onCheckedChange={(checked) => handleSystemSettingChange("notificationsEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Región y Formato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => handleSystemSettingChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={systemSettings.currency}
                    onValueChange={(value) => handleSystemSettingChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOP">Peso Dominicano (RD$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (US$)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de fecha</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => handleSystemSettingChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Autenticación y Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de dos factores</Label>
                    <p className="text-sm text-gray-500">Añade una capa extra de seguridad</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => handleSecuritySettingChange("twoFactorEnabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tiempo de sesión (minutos)</Label>
                  <Select
                    value={securitySettings.sessionTimeout.toString()}
                    onValueChange={(value) => handleSecuritySettingChange("sessionTimeout", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones de inicio de sesión</Label>
                    <p className="text-sm text-gray-500">Recibe alertas cuando alguien accede</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => handleSecuritySettingChange("loginNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Ingresa una nueva contraseña"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POS Settings Tab */}
          <TabsContent value="pos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Configuración de Impresión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tamaño de papel</Label>
                  <Select
                    value={posSettings.printerWidth}
                    onValueChange={(value) => handlePOSSettingChange("printerWidth", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm (Móvil)</SelectItem>
                      <SelectItem value="80mm">80mm (Estándar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar NCF en recibos</Label>
                    <p className="text-sm text-gray-500">Incluye números de comprobante fiscal</p>
                  </div>
                  <Switch
                    checked={posSettings.showNCF}
                    onCheckedChange={(checked) => handlePOSSettingChange("showNCF", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar logo de empresa</Label>
                    <p className="text-sm text-gray-500">Incluye el logo en recibos</p>
                  </div>
                  <Switch
                    checked={posSettings.showCompanyLogo}
                    onCheckedChange={(checked) => handlePOSSettingChange("showCompanyLogo", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pie de página personalizado</Label>
                  <Input
                    value={posSettings.receiptFooter}
                    onChange={(e) => handlePOSSettingChange("receiptFooter", e.target.value)}
                    placeholder="Mensaje que aparece al final del recibo"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Configuración de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Método de pago por defecto</Label>
                  <Select
                    value={posSettings.defaultPaymentMethod}
                    onValueChange={(value) => handlePOSSettingChange("defaultPaymentMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir cliente</Label>
                    <p className="text-sm text-gray-500">Obliga a seleccionar cliente para cada venta</p>
                  </div>
                  <Switch
                    checked={posSettings.requireCustomer}
                    onCheckedChange={(checked) => handlePOSSettingChange("requireCustomer", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Abrir cajón automáticamente</Label>
                    <p className="text-sm text-gray-500">Abre el cajón al completar una venta</p>
                  </div>
                  <Switch
                    checked={posSettings.autoOpenCashDrawer}
                    onCheckedChange={(checked) => handlePOSSettingChange("autoOpenCashDrawer", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings Tab */}
          <TabsContent value="data" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Respaldo y Exportación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportSettings} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Configuración
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Configuración
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Guardado automático</Label>
                      <p className="text-sm text-gray-500">Guarda cambios automáticamente</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoSave}
                      onCheckedChange={(checked) => handleSystemSettingChange("autoSave", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Respaldo automático</Label>
                      <p className="text-sm text-gray-500">Crea respaldos de forma automática</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => handleSystemSettingChange("autoBackup", checked)}
                    />
                  </div>
                </div>

                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Respaldo Manual
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Crear un respaldo completo de todos los datos
                  </p>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Crear Respaldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}