import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Settings,
  Clock,
  Trash2,
  Volume2,
  VolumeX
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  salesAlerts: boolean;
  inventoryAlerts: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  soundEnabled: boolean;
}

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<"notifications" | "settings">("notifications");

  // Fetch notifications from server
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    salesAlerts: true,
    inventoryAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
    soundEnabled: true,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      await apiRequest("PUT", "/api/notifications/settings", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Las preferencias de notificaciones han sido guardadas.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada exitosamente.",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas.",
        variant: "destructive",
      });
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/notifications/clear-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificaciones limpiadas",
        description: "Todas las notificaciones han sido eliminadas.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron eliminar las notificaciones.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAll = () => {
    clearAllNotificationsMutation.mutate();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBadgeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minutos`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-full">
      <Header title="Notificaciones" subtitle="Gestiona tus alertas y preferencias de notificación" />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("notifications")}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </div>

          {activeTab === "notifications" && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Marcar todas como leídas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearAll}
                disabled={clearAllNotificationsMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar todo
              </Button>
            </div>
          )}
        </div>

        {activeTab === "notifications" ? (
          /* Notifications List */
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Todas las notificaciones aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={getNotificationBadgeColor(notification.type)}>
                              {notification.type === "success" ? "Éxito" :
                               notification.type === "warning" ? "Alerta" :
                               notification.type === "error" ? "Error" : "Info"}
                            </Badge>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Marcar como leída
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Settings */
          <div className="space-y-6">
            {/* Communication Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Preferencias de Comunicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        Notificaciones por Email
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Recibe alertas importantes por correo electrónico
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label htmlFor="sms-notifications" className="font-medium">
                        Notificaciones SMS
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Recibe alertas críticas por mensaje de texto
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">
                        Notificaciones Push
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Notificaciones en tiempo real en el navegador
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-gray-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    )}
                    <div>
                      <Label htmlFor="sound-enabled" className="font-medium">
                        Sonido de Notificaciones
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reproducir sonido cuando lleguen notificaciones
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => handleSettingChange("soundEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sales-alerts" className="font-medium">
                      Alertas de Ventas
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Notificaciones sobre nuevas ventas y transacciones
                    </p>
                  </div>
                  <Switch
                    id="sales-alerts"
                    checked={settings.salesAlerts}
                    onCheckedChange={(checked) => handleSettingChange("salesAlerts", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inventory-alerts" className="font-medium">
                      Alertas de Inventario
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Notificaciones sobre stock bajo y movimientos de inventario
                    </p>
                  </div>
                  <Switch
                    id="inventory-alerts"
                    checked={settings.inventoryAlerts}
                    onCheckedChange={(checked) => handleSettingChange("inventoryAlerts", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-updates" className="font-medium">
                      Actualizaciones del Sistema
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Información sobre nuevas características y mantenimiento
                    </p>
                  </div>
                  <Switch
                    id="system-updates"
                    checked={settings.systemUpdates}
                    onCheckedChange={(checked) => handleSettingChange("systemUpdates", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="font-medium">
                      Emails de Marketing
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Promociones, consejos y noticias de la empresa
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}