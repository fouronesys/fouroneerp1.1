import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Apple, 
  Chrome,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Downloads() {
  const { toast } = useToast();

  // Fetch download statistics
  const { data: downloadStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/downloads/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Download mutations for different platforms
  const desktopWindowsMutation = useMutation({
    mutationFn: () => apiRequest("/api/downloads/desktop/windows"),
    onSuccess: (data: any) => {
      toast({
        title: "Información de descarga",
        description: `${data.fileName} (${data.size}) - Versión ${data.version}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de descarga",
        description: "No se pudo obtener información de Windows",
        variant: "destructive",
      });
    },
  });

  const desktopMacMutation = useMutation({
    mutationFn: () => apiRequest("/api/downloads/desktop/mac"),
    onSuccess: (data: any) => {
      toast({
        title: "Información de descarga",
        description: `${data.fileName} (${data.size}) - Versión ${data.version}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de descarga",
        description: "No se pudo obtener información de macOS",
        variant: "destructive",
      });
    },
  });

  const desktopLinuxMutation = useMutation({
    mutationFn: () => apiRequest("/api/downloads/desktop/linux"),
    onSuccess: (data: any) => {
      toast({
        title: "Información de descarga",
        description: `${data.fileName} (${data.size}) - Versión ${data.version}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de descarga",
        description: "No se pudo obtener información de Linux",
        variant: "destructive",
      });
    },
  });

  const mobileAndroidMutation = useMutation({
    mutationFn: () => apiRequest("/api/downloads/mobile/android"),
    onSuccess: (data: any) => {
      toast({
        title: "Información de descarga",
        description: `${data.fileName} (${data.size}) - Versión ${data.version}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de descarga",
        description: "No se pudo obtener información de Android",
        variant: "destructive",
      });
    },
  });

  const downloadCount = {
    totalDownloads: downloadStats?.totalDownloads || 0,
    weeklyDownloads: downloadStats?.weeklyDownloads || 0,
    platforms: {
      windows: downloadStats?.platforms?.windows || 0,
      mac: downloadStats?.platforms?.mac || 0,
      linux: downloadStats?.platforms?.linux || 0,
      android: downloadStats?.platforms?.android || 0
    }
  };

  const handleDownload = (type: string, platform: string) => {
    const mutationKey = `${type}-${platform}`;
    
    // Direct download URLs
    const downloadUrls: Record<string, string> = {
      'desktop-windows': '/download/windows-exe',
      'desktop-mac': '/download/mac-dmg',
      'desktop-linux': '/download/linux-appimage',
      'mobile-android': '/download/android-apk'
    };
    
    const downloadUrl = downloadUrls[mutationKey];
    
    if (downloadUrl) {
      // Open download URL in new tab
      window.open(downloadUrl, '_blank');
      
      // Show success toast
      toast({
        title: "Descarga iniciada",
        description: "Tu descarga comenzará en breve",
      });
    } else {
      toast({
        title: "Plataforma no soportada",
        description: "La plataforma solicitada no está disponible",
        variant: "destructive",
      });
    }
  };

  const isDownloading = (type: string, platform: string) => {
    // Since we're using direct downloads, we don't track loading state
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Descargar Four One Solutions
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Lleva tu negocio al siguiente nivel con nuestras aplicaciones multiplataforma. 
          Gestión completa de ERP, disponible para escritorio y móvil.
        </p>
      </div>

      {/* Download Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                downloadCount.totalDownloads.toLocaleString()
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Descargas totales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                downloadCount.weeklyDownloads
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Esta semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">4</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plataformas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">1.0.0</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Versión actual</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Desktop Applications */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-6 w-6" />
              <span>Aplicaciones de Escritorio</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300">
              Experiencia completa para Windows, macOS y Linux
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Windows */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Windows</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Windows 10 o superior</p>
                </div>
              </div>
              <Button 
                onClick={() => handleDownload('desktop', 'windows')}
                disabled={isDownloading('desktop', 'windows')}
              >
                {isDownloading('desktop', 'windows') ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar
              </Button>
            </div>

            {/* macOS */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Apple className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold">macOS</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">macOS 10.15+ (Catalina)</p>
                </div>
              </div>
              <Button 
                onClick={() => handleDownload('desktop', 'mac')}
                disabled={isDownloading('desktop', 'mac')}
              >
                {isDownloading('desktop', 'mac') ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar
              </Button>
            </div>

            {/* Linux */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Linux</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ubuntu 18.04+ / AppImage</p>
                </div>
              </div>
              <Button 
                onClick={() => handleDownload('desktop', 'linux')}
                disabled={isDownloading('desktop', 'linux')}
              >
                {isDownloading('desktop', 'linux') ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Applications */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6" />
              <span>Aplicaciones Móviles</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300">
              Gestión móvil para Android e iOS
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Android */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Android</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Android 7.0+ (API 24)</p>
                </div>
              </div>
              <Button 
                onClick={() => handleDownload('mobile', 'android')}
                disabled={isDownloading('mobile', 'android')}
              >
                {isDownloading('mobile', 'android') ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar APK
              </Button>
            </div>

            {/* iOS */}
            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Apple className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">iOS</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">iOS 12.0+ - Próximamente</p>
                </div>
              </div>
              <Button disabled>
                <Clock className="h-4 w-4 mr-2" />
                Próximamente
              </Button>
            </div>

            {/* Installation Instructions for Android */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Aplicación Android</h4>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-green-600 min-w-[20px]">1.</span>
                  <span>Habilita "Fuentes desconocidas" en Configuración &gt; Seguridad</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-green-600 min-w-[20px]">2.</span>
                  <span>Descarga e instala el archivo APK</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-green-600 min-w-[20px]">3.</span>
                  <span>Acepta los permisos necesarios para el funcionamiento</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Alto Rendimiento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optimizado para operaciones rápidas y eficientes en todos los dispositivos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">Seguridad Avanzada</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Encriptación de datos y autenticación segura para proteger tu información
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Multiusuario</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Soporte completo para equipos de trabajo con permisos granulares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statsLoading ? '---' : downloadCount.platforms?.windows || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Windows</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {statsLoading ? '---' : downloadCount.platforms?.mac || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">macOS</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {statsLoading ? '---' : downloadCount.platforms?.linux || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Linux</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statsLoading ? '---' : downloadCount.platforms?.android || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Android</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}