import { useState, useEffect } from "react";
import { Bell, Settings, X, Check, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  salesAlerts: boolean;
  inventoryAlerts: boolean;
  systemAlerts: boolean;
  financialAlerts: boolean;
  userActivityAlerts: boolean;
  soundEnabled: boolean;
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const notificationColors = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: settings } = useQuery<NotificationSettings>({
    queryKey: ["/api/notifications/settings"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("POST", `/api/notifications/${notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/mark-all-read", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      apiRequest("PUT", "/api/notifications/settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      toast({
        title: "Configuración actualizada",
        description: "Las preferencias de notificaciones han sido guardadas",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("DELETE", `/api/notifications/${notificationId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const category = notification.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Centro de Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todo
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
                        {category}
                      </h4>
                      <AnimatePresence>
                        {categoryNotifications.map((notification) => {
                          const IconComponent = notificationIcons[notification.type];
                          const iconColor = notificationColors[notification.type];
                          
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={`p-3 mb-2 rounded-lg border transition-colors ${
                                notification.read
                                  ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                                  : "bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <IconComponent className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className={`text-sm font-medium ${
                                        notification.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"
                                      }`}>
                                        {notification.title}
                                      </h5>
                                      <p className={`text-xs mt-1 ${
                                        notification.read ? "text-gray-500 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                                      }`}>
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-500">
                                          {new Date(notification.createdAt).toLocaleDateString('es-DO', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                        {notification.actionUrl && (
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs"
                                            onClick={() => {
                                              window.location.href = notification.actionUrl!;
                                              handleMarkAsRead(notification.id);
                                            }}
                                          >
                                            {notification.actionText || "Ver más"}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      {!notification.read && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMarkAsRead(notification.id)}
                                          disabled={markAsReadMutation.isPending}
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        disabled={deleteNotificationMutation.isPending}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Método de Entrega</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                      <Switch
                        id="email-notifications"
                        checked={settings?.emailNotifications ?? true}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Notificaciones Push</Label>
                      <Switch
                        id="push-notifications"
                        checked={settings?.pushNotifications ?? true}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Categorías de Alertas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sales-alerts">Alertas de Ventas</Label>
                      <Switch
                        id="sales-alerts"
                        checked={settings?.salesAlerts ?? true}
                        onCheckedChange={(checked) => handleSettingChange('salesAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="inventory-alerts">Alertas de Inventario</Label>
                      <Switch
                        id="inventory-alerts"
                        checked={settings?.inventoryAlerts ?? true}
                        onCheckedChange={(checked) => handleSettingChange('inventoryAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-alerts">Alertas del Sistema</Label>
                      <Switch
                        id="system-alerts"
                        checked={settings?.systemAlerts ?? true}
                        onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="financial-alerts">Alertas Financieras</Label>
                      <Switch
                        id="financial-alerts"
                        checked={settings?.financialAlerts ?? true}
                        onCheckedChange={(checked) => handleSettingChange('financialAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="user-activity-alerts">Actividad de Usuarios</Label>
                      <Switch
                        id="user-activity-alerts"
                        checked={settings?.userActivityAlerts ?? false}
                        onCheckedChange={(checked) => handleSettingChange('userActivityAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Preferencias Adicionales</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound-enabled">Sonidos de Notificación</Label>
                      <Switch
                        id="sound-enabled"
                        checked={settings?.soundEnabled ?? true}
                        onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}