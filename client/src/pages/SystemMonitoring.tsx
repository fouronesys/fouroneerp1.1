import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Clock, Activity, Database, Server, Users, Download, Upload, Trash2, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: number;
  userId?: string;
  companyId?: number;
  module: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface ErrorStats {
  total: number;
  byModule: Record<string, number>;
  bySeverity: Record<string, number>;
  recent: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  authentication: 'healthy' | 'warning' | 'error';
  modules: Record<string, 'healthy' | 'warning' | 'error'>;
  uptime: number;
  errors24h: number;
}

interface BackupRecord {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'rnc_only';
  description: string;
  size: number;
  createdAt: string;
  createdBy: string;
}

interface BackupStatus {
  isEnabled: boolean;
  frequencyHours: number;
  lastBackup?: string;
  nextBackup?: string;
  totalBackups: number;
}

// Backup Management Component
function BackupManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [frequencyHours, setFrequencyHours] = useState(24);
  const [autoEnabled, setAutoEnabled] = useState(true);

  // Fetch backup status
  const { data: backupStatus, isLoading: statusLoading } = useQuery<BackupStatus>({
    queryKey: ['/api/system/backups/status'],
    refetchInterval: 30000,
  });

  // Fetch backup list
  const { data: backups, isLoading: backupsLoading } = useQuery<BackupRecord[]>({
    queryKey: ['/api/system/backups'],
    refetchInterval: 30000,
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async (data: { type: string; description: string }) => {
      const response = await fetch('/api/system/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create backup');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/backups'] });
      toast({ title: "Respaldo creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear respaldo", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update schedule mutation  
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { frequencyHours: number; enabled: boolean }) => {
      const response = await fetch('/api/system/backups/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/backups/status'] });
      toast({ title: "Configuración de respaldos actualizada" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al actualizar configuración", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-DO');
  };

  return (
    <div className="space-y-6">
      {/* Backup Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {statusLoading ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : (
                <>
                  <Badge variant={backupStatus?.isEnabled ? "default" : "secondary"}>
                    {backupStatus?.isEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Cada {backupStatus?.frequencyHours || 24}h
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Respaldo</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {backupStatus?.lastBackup ? 
                formatDate(backupStatus.lastBackup) : 
                "Sin respaldos"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Respaldos</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupStatus?.totalBackups || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Respaldos Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-backup"
              checked={autoEnabled}
              onCheckedChange={setAutoEnabled}
            />
            <Label htmlFor="auto-backup">Respaldos automáticos habilitados</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia (horas)</Label>
            <Input
              id="frequency"
              type="number"
              min="1"
              max="168"
              value={frequencyHours}
              onChange={(e) => setFrequencyHours(parseInt(e.target.value) || 24)}
              className="w-32"
            />
          </div>

          <Button
            onClick={() => updateScheduleMutation.mutate({ frequencyHours, enabled: autoEnabled })}
            disabled={updateScheduleMutation.isPending}
          >
            {updateScheduleMutation.isPending ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Backup Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Crear Respaldo Manual
          </CardTitle>
          <CardDescription>
            Crear un respaldo completo del sistema de forma manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => createBackupMutation.mutate({ 
              type: 'full', 
              description: 'Respaldo manual desde panel de administración' 
            })}
            disabled={createBackupMutation.isPending}
            className="w-full"
          >
            {createBackupMutation.isPending ? "Creando respaldo..." : "Crear Respaldo Completo"}
          </Button>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Lista de Respaldos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {backupsLoading ? (
                <div className="text-center py-4">Cargando respaldos...</div>
              ) : backups && backups.length > 0 ? (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{backup.name}</span>
                        <span className="text-sm text-gray-500">{backup.description}</span>
                        <span className="text-xs text-gray-400">
                          {formatDate(backup.createdAt)} • {formatFileSize(backup.size)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={backup.type === 'full' ? 'default' : 'secondary'}>
                        {backup.type === 'full' ? 'Completo' : 
                         backup.type === 'incremental' ? 'Incremental' : 'RNC'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No hay respaldos disponibles
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SystemMonitoring() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const queryClient = useQueryClient();

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/errors/stats'] });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, queryClient]);

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit/logs'],
    queryFn: async () => {
      const response = await fetch('/api/audit/logs?limit=50');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    }
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/system/health'],
    queryFn: async () => {
      const response = await fetch('/api/system/health');
      if (!response.ok) throw new Error('Failed to fetch system health');
      return response.json();
    }
  });

  const { data: errorStats, isLoading: statsLoading } = useQuery<ErrorStats>({
    queryKey: ['/api/errors/stats'],
    queryFn: async () => {
      const response = await fetch('/api/errors/stats');
      if (!response.ok) throw new Error('Failed to fetch error stats');
      return response.json();
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-red-400';
      case 'warning': return 'bg-yellow-400';
      case 'info': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (logsLoading || healthLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Monitoreo del Sistema</h1>
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries();
            }}
          >
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Badge variant="secondary">
            Auto-refresh: {refreshInterval / 1000}s
          </Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
            <Database className={`h-4 w-4 ${getHealthColor(systemHealth?.database || 'error')}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getHealthIcon(systemHealth?.database || 'error')}
              <span className={`text-sm font-medium ${getHealthColor(systemHealth?.database || 'error')}`}>
                {systemHealth?.database === 'healthy' ? 'Operacional' : 
                 systemHealth?.database === 'warning' ? 'Advertencia' : 'Error'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autenticación</CardTitle>
            <Users className={`h-4 w-4 ${getHealthColor(systemHealth?.authentication || 'error')}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getHealthIcon(systemHealth?.authentication || 'error')}
              <span className={`text-sm font-medium ${getHealthColor(systemHealth?.authentication || 'error')}`}>
                {systemHealth?.authentication === 'healthy' ? 'Operacional' : 
                 systemHealth?.authentication === 'warning' ? 'Advertencia' : 'Error'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores 24h</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {systemHealth?.errors24h || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Activo</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemHealth?.uptime ? Math.round(systemHealth.uptime / 3600) + 'h' : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Health Status */}
      {systemHealth?.modules && typeof systemHealth.modules === 'object' && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Módulos</CardTitle>
            <CardDescription>Estado operacional de cada módulo del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(systemHealth.modules || {}).map(([module, status]) => (
                <div key={module} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {getHealthIcon(status)}
                  <div>
                    <p className="text-sm font-medium">{module}</p>
                    <p className={`text-xs ${getHealthColor(status)}`}>
                      {status === 'healthy' ? 'OK' : 
                       status === 'warning' ? 'Advertencia' : 'Error'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Statistics */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Errores por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(errorStats.byModule || {}).map(([module, count]) => (
                  <div key={module} className="flex justify-between items-center">
                    <span className="text-sm">{module}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Errores por Severidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(errorStats.bySeverity || {}).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></div>
                      <span className="text-sm capitalize">{severity}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Logs */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Actividad Reciente</TabsTrigger>
          <TabsTrigger value="errors">Solo Errores</TabsTrigger>
          <TabsTrigger value="backups">Respaldos</TabsTrigger>
          <TabsTrigger value="all">Todos los Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente del Sistema</CardTitle>
              <CardDescription>Últimas 50 acciones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {auditLogs?.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(log.severity)}`}></div>
                        <div>
                          <p className="text-sm font-medium">
                            {log.module} - {log.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.entityType} {log.entityId && `#${log.entityId}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {!log.success && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Errores</CardTitle>
              <CardDescription>Solo eventos con errores o advertencias</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {auditLogs?.filter(log => !log.success || log.severity === 'error' || log.severity === 'critical').map((log) => (
                    <Alert key={log.id} variant={log.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong>{log.module} - {log.action}</strong>
                            <p className="text-sm">{log.errorMessage}</p>
                            <p className="text-xs text-gray-500">
                              {log.entityType} {log.entityId && `#${log.entityId}`}
                            </p>
                          </div>
                          <Badge variant={log.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {log.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro Completo de Auditoría</CardTitle>
              <CardDescription>Todos los eventos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(log.severity)}`}></div>
                        <span className="font-medium">{log.module}</span>
                        <span className="text-gray-500">→</span>
                        <span>{log.action}</span>
                        <span className="text-gray-400">({log.entityType})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!log.success && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}