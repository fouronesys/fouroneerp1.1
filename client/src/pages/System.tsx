import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Database, 
  Server, 
  HardDrive,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Camera,
  Sparkles,
  Image as ImageIcon,
  Search,
  XCircle,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ImageHistoryRecord {
  id: number;
  productId: number;
  productName: string;
  imageUrl: string;
  source: 'gemini' | 'unsplash' | 'google' | 'manual';
  prompt?: string;
  generatedAt: string;
  userId: string;
  companyId: number;
  success: boolean;
  errorMessage?: string;
}

interface ImageGenerationStats {
  totalGenerated: number;
  successCount: number;
  errorCount: number;
  geminiCount: number;
  unsplashCount: number;
  googleCount: number;
  successRate: number;
  lastGeneratedAt?: string;
}

function ImageHistoryContent() {
  const { data: history, isLoading: historyLoading } = useQuery<ImageHistoryRecord[]>({
    queryKey: ['/api/image-generation/history'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ImageGenerationStats>({
    queryKey: ['/api/image-generation/statistics']
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gemini':
        return <Sparkles className="h-4 w-4" />;
      case 'unsplash':
        return <Camera className="h-4 w-4" />;
      case 'google':
        return <Search className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'gemini':
        return 'bg-purple-100 text-purple-800';
      case 'unsplash':
        return 'bg-blue-100 text-blue-800';
      case 'google':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (historyLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generadas</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              Imágenes generadas en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.successCount || 0} exitosas, {stats?.errorCount || 0} errores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemini AI</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.geminiCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Generadas con IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otras Fuentes</CardTitle>
            <Camera className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.unsplashCount || 0) + (stats?.googleCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Unsplash: {stats?.unsplashCount || 0}, Google: {stats?.googleCount || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Generación de Imágenes</CardTitle>
          <CardDescription>
            Registro de todas las imágenes generadas para productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {history && history.length > 0 ? (
                history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-start space-x-4">
                      {record.imageUrl && record.success ? (
                        <img
                          src={record.imageUrl}
                          alt={record.productName}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                          <XCircle className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{record.productName}</p>
                          {record.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getSourceColor(record.source)}>
                            <span className="flex items-center space-x-1">
                              {getSourceIcon(record.source)}
                              <span>{record.source}</span>
                            </span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(record.generatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        {record.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">{record.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {record.userId === 'batch-process' ? 'Proceso por lotes' : 'Manual'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de generación de imágenes
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

export default function System() {
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const { toast } = useToast();

  const { data: systemInfo, isLoading: isLoadingSystem } = useQuery({
    queryKey: ["/api/system/info"],
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const { data: systemConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["/api/system/config"],
  });

  const { data: backupHistory } = useQuery({
    queryKey: ["/api/system/backups"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: any) =>
      apiRequest("/api/system/config", {
        method: "PATCH",
        body: JSON.stringify(config),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/config"] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios han sido guardados exitosamente.",
      });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/system/backup", {
        method: "POST",
      }),
    onMutate: () => {
      setIsBackupRunning(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/backups"] });
      toast({
        title: "Respaldo creado",
        description: "El respaldo se ha creado exitosamente.",
      });
    },
    onSettled: () => {
      setIsBackupRunning(false);
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: (backupId: string) =>
      apiRequest(`/api/system/restore/${backupId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast({
        title: "Restauración completada",
        description: "El sistema ha sido restaurado exitosamente.",
      });
    },
  });

  const updateDGIIMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/system/dgii/update", {
        method: "POST",
      }),
    onSuccess: () => {
      toast({
        title: "Actualización DGII",
        description: "El registro RNC ha sido actualizado.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "error": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 h-screen overflow-y-auto max-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Estado del Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor((systemInfo as any)?.status || "unknown")}`}>
              {(systemInfo as any)?.status === "healthy" ? "Saludable" : 
               (systemInfo as any)?.status === "warning" ? "Advertencia" : "Error"}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {(systemInfo as any)?.uptime || "0h"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(systemInfo as any)?.database?.connections || 0}/{(systemInfo as any)?.database?.maxConnections || 100}
            </div>
            <p className="text-xs text-muted-foreground">
              Conexiones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Almacenamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(systemInfo as any)?.storage?.usedPercentage || 0}%
            </div>
            <Progress value={(systemInfo as any)?.storage?.usedPercentage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes((systemInfo as any)?.storage?.used || 0)} / {formatBytes((systemInfo as any)?.storage?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(systemInfo as any)?.performance?.cpu || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              RAM: {(systemInfo as any)?.performance?.memory || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="backup">Respaldos</TabsTrigger>
          <TabsTrigger value="dgii">DGII</TabsTrigger>
          <TabsTrigger value="images">Imágenes IA</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajustes básicos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">Nombre del Sistema</Label>
                  <Input
                    id="system-name"
                    value={(systemConfig as any)?.name || "Four One Solutions"}
                    onChange={(e) => updateConfigMutation.mutate({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={(systemConfig as any)?.timezone || "America/Santo_Domingo"}
                    onValueChange={(value) => updateConfigMutation.mutate({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Santo_Domingo">Santo Domingo</SelectItem>
                      <SelectItem value="America/New_York">New York</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                      <SelectItem value="America/Bogota">Bogotá</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select 
                    value={(systemConfig as any)?.currency || "DOP"}
                    onValueChange={(value) => updateConfigMutation.mutate({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={(systemConfig as any)?.language || "es"}
                    onValueChange={(value) => updateConfigMutation.mutate({ language: value })}
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
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Modo de Mantenimiento</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquea el acceso a usuarios no administradores
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={(systemConfig as any)?.maintenanceMode || false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ maintenanceMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup">Respaldo Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realiza respaldos diarios automáticamente
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={(systemConfig as any)?.autoBackup || false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ autoBackup: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Respaldos</CardTitle>
                  <CardDescription>
                    Crea y restaura copias de seguridad del sistema
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => createBackupMutation.mutate()}
                  disabled={isBackupRunning || createBackupMutation.isPending}
                >
                  {isBackupRunning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Crear Respaldo
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(backupHistory) && backupHistory.length > 0 ? (
                  backupHistory.map((backup: any) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(backup.createdAt).toLocaleString()} - {formatBytes(backup.size)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm("¿Estás seguro de restaurar este respaldo?")) {
                              restoreBackupMutation.mutate(backup.id);
                            }
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Restaurar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No hay respaldos disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dgii" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración DGII</CardTitle>
              <CardDescription>
                Ajustes para el cumplimiento fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Estado del Registro RNC</p>
                  <p className="text-sm text-muted-foreground">
                    Última actualización: {(systemInfo as any)?.dgii?.lastUpdate || "Nunca"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(systemInfo as any)?.dgii?.status === "online" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateDGIIMutation.mutate()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dgii-auto-update">Actualización Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Actualiza el registro RNC diariamente
                    </p>
                  </div>
                  <Switch
                    id="dgii-auto-update"
                    checked={(systemConfig as any)?.dgii?.autoUpdate || false}
                    onCheckedChange={(checked) => 
                      updateConfigMutation.mutate({ dgii: { autoUpdate: checked } })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registros RNC</Label>
                    <div className="text-2xl font-bold">{(systemInfo as any)?.dgii?.totalRecords || 0}</div>
                    <p className="text-xs text-muted-foreground">Total en base de datos</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tamaño del Registro</Label>
                    <div className="text-2xl font-bold">{formatBytes((systemInfo as any)?.dgii?.size || 0)}</div>
                    <p className="text-xs text-muted-foreground">Espacio utilizado</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-6 space-y-6">
          <ImageHistoryContent />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Ajustes técnicos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={(systemConfig as any)?.sessionTimeout || 30}
                    onChange={(e) => updateConfigMutation.mutate({ sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Tamaño Máximo de Archivo (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={(systemConfig as any)?.maxFileSize || 10}
                    onChange={(e) => updateConfigMutation.mutate({ maxFileSize: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-retention">Retención de Logs (días)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    value={(systemConfig as any)?.logRetention || 90}
                    onChange={(e) => updateConfigMutation.mutate({ logRetention: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Información del Sistema</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Versión:</span>
                    <span className="ml-2 font-mono">{(systemInfo as any)?.version || "1.0.0"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entorno:</span>
                    <span className="ml-2 font-mono">{(systemInfo as any)?.environment || "production"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Node.js:</span>
                    <span className="ml-2 font-mono">{(systemInfo as any)?.nodeVersion || "20.x"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base de Datos:</span>
                    <span className="ml-2 font-mono">PostgreSQL {(systemInfo as any)?.database?.version || "15.x"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}