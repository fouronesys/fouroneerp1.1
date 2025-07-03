import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Monitor, Smartphone, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InstallOption {
  platform: string;
  type: 'desktop' | 'pwa' | 'web';
  title: string;
  description: string;
  size: string;
  features: string[];
  downloadUrl?: string;
  installSteps: string[];
  icon: React.ReactNode;
  available: boolean;
  recommended?: boolean;
}

export function InstallButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [userPlatform, setUserPlatform] = useState<string>('unknown');
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  // Fetch available downloads from server
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery({
    queryKey: ['/api/downloads/available'],
    retry: false,
  });

  useEffect(() => {
    // Detect user platform
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (platform.includes('win')) {
      setUserPlatform('windows');
    } else if (platform.includes('mac')) {
      setUserPlatform('macos');
    } else if (platform.includes('linux')) {
      setUserPlatform('linux');
    } else if (userAgent.includes('android')) {
      setUserPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setUserPlatform('ios');
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
      setCanInstallPWA(true);
    };

    // Check if app is already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;

    // Always enable PWA install option for browsers that support it
    if (!isInstalled && ('serviceWorker' in navigator)) {
      setCanInstallPWA(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Generate install options dynamically
  const installOptions: InstallOption[] = [
    // PWA Option - Always show if supported
    {
      platform: 'PWA',
      type: 'pwa',
      title: 'Instalar como App',
      description: 'Instala Four One Solutions como aplicación en tu dispositivo',
      size: '~5 MB',
      features: [
        'Funcionalidad offline',
        'Sincronización automática',
        'Acceso desde pantalla de inicio',
        'Notificaciones push',
        'Actualizaciones automáticas'
      ],
      installSteps: [
        'Hacer clic en "Instalar PWA"',
        'Confirmar instalación en el navegador',
        'Acceder desde pantalla de inicio'
      ],
      icon: <Smartphone className="h-8 w-8" />,
      available: canInstallPWA,
      recommended: true
    },
    // Desktop options
    {
      platform: 'Windows',
      type: 'desktop',
      title: 'Four One Solutions Desktop',
      description: 'Aplicación nativa para Windows con funcionalidad offline completa',
      size: '~150 MB',
      features: [
        'Funcionalidad offline completa',
        'Base de datos SQLite local',
        'Sincronización automática',
        'Instalador profesional',
        'Integración con Windows'
      ],
      downloadUrl: '/download/windows-exe',
      installSteps: [
        'Descargar el instalador',
        'Ejecutar como administrador',
        'Seguir el asistente de instalación',
        'Configurar ubicación de base de datos',
        'Completar instalación'
      ],
      icon: <Monitor className="h-8 w-8" />,
      available: true,
      recommended: userPlatform === 'windows'
    },
    {
      platform: 'macos',
      type: 'desktop',
      title: 'Four One Solutions para macOS',
      description: 'Aplicación nativa para Mac con todas las funcionalidades',
      size: '~140 MB',
      features: [
        'Funcionalidad offline completa',
        'Base de datos SQLite local',
        'Sincronización automática',
        'Instalador .dmg',
        'Integración con macOS'
      ],
      downloadUrl: '/downloads/desktop/Four-One-Solutions.dmg',
      installSteps: [
        'Descargar archivo .dmg',
        'Abrir imagen de disco',
        'Arrastrar a Aplicaciones',
        'Permitir aplicación de desarrollador no identificado',
        'Abrir desde Aplicaciones'
      ],
      icon: <Monitor className="h-8 w-8" />,
      available: true,
      recommended: userPlatform === 'macos'
    },
    {
      platform: 'linux',
      type: 'desktop',
      title: 'Four One Solutions para Linux',
      description: 'AppImage universal compatible con todas las distribuciones',
      size: '~135 MB',
      features: [
        'Funcionalidad offline completa',
        'Base de datos SQLite local',
        'Sincronización automática',
        'AppImage portable',
        'Compatible con todas las distros'
      ],
      downloadUrl: '/downloads/desktop/Four-One-Solutions.AppImage',
      installSteps: [
        'Descargar AppImage',
        'Dar permisos de ejecución: chmod +x',
        'Ejecutar directamente',
        'Opcional: integrar al sistema',
        'Configurar base de datos local'
      ],
      icon: <Monitor className="h-8 w-8" />,
      available: true,
      recommended: userPlatform === 'linux'
    },
    // Mobile options
    {
      platform: 'Android',
      type: 'desktop',
      title: 'Four One Solutions Android',
      description: 'Aplicación nativa para Android con funcionalidad offline',
      size: '32.4 MB',
      features: [
        'Funcionalidad offline completa',
        'Base de datos local SQLite',
        'Sincronización automática',
        'Interfaz móvil optimizada',
        'Soporte para impresoras bluetooth'
      ],
      downloadUrl: '/download/android-apk',
      installSteps: [
        'Descargar archivo APK',
        'Permitir instalación de orígenes desconocidos en Configuración',
        'Abrir archivo APK descargado',
        'Tocar "Instalar"',
        'Abrir la aplicación'
      ],
      icon: <Smartphone className="h-8 w-8" />,
      available: true,
      recommended: userPlatform === 'android'
    },
    {
      platform: 'pwa',
      type: 'pwa',
      title: 'Aplicación Web Progresiva',
      description: 'Instala desde tu navegador, funciona offline',
      size: '~5 MB cache',
      features: [
        'Instalación desde navegador',
        'Cache inteligente offline',
        'Sincronización en segundo plano',
        'Notificaciones push',
        'Actualizaciones automáticas'
      ],
      installSteps: 
        userPlatform === 'ios' ? [
          'Abrir en Safari',
          'Tocar el botón Compartir',
          'Seleccionar "Añadir a pantalla de inicio"',
          'Confirmar instalación',
          'Usar como app nativa'
        ] : userPlatform === 'android' ? [
          'Abrir en Chrome/Edge',
          'Tocar "Instalar aplicación"',
          'Confirmar instalación',
          'Encontrar en apps instaladas',
          'Usar como app nativa'
        ] : [
          'Abrir en Chrome/Edge/Firefox',
          'Buscar icono "Instalar" en barra de direcciones',
          'Hacer clic en "Instalar"',
          'Confirmar instalación',
          'Usar como app nativa'
        ],
      icon: <Smartphone className="h-8 w-8" />,
      available: true,
      recommended: userPlatform === 'ios'
    },
    {
      platform: 'web',
      type: 'web',
      title: 'Aplicación Web',
      description: 'Acceso directo desde cualquier navegador',
      size: 'Sin descarga',
      features: [
        'Sin instalación requerida',
        'Siempre actualizada',
        'Acceso desde cualquier dispositivo',
        'Sincronización en tiempo real',
        'Respaldos automáticos en la nube'
      ],
      installSteps: [
        'Abrir navegador web',
        'Navegar a la aplicación',
        'Iniciar sesión',
        'Comenzar a usar inmediatamente',
        'Crear marcador para acceso rápido'
      ],
      icon: <Globe className="h-8 w-8" />,
      available: true
    }
  ];

  const handlePWAInstall = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPWA(false);
        setPwaPrompt(null);
        setIsOpen(false);
      }
    } else {
      // Fallback: provide instructions for manual installation
      alert('Para instalar como PWA:\n\n1. En Chrome/Edge: Busca el ícono "Instalar" en la barra de direcciones\n2. En Firefox: Menú → "Instalar esta aplicación"\n3. En Safari (iOS): Compartir → "Agregar a pantalla de inicio"');
    }
  };

  const handleDownload = async (option: InstallOption) => {
    if (option.type === 'pwa') {
      handlePWAInstall();
    } else if (option.type === 'web') {
      // Already using the web app, show message
      alert('Ya estás usando la aplicación web. Puedes crear un marcador para acceso rápido.');
    } else if (option.downloadUrl) {
      try {
        // Open download URL in new tab for desktop applications
        window.open(option.downloadUrl, '_blank');
        setIsOpen(false);
      } catch (error) {
        console.error('Download error:', error);
        alert('Error al iniciar la descarga. Por favor, intenta usar la versión PWA o web.');
      }
    }
  };

  const recommendedOption = installOptions.find(opt => opt.recommended);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Instalar Aplicación
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="install-description">
        <DialogHeader>
          <DialogTitle className="text-2xl">Instalar Four One Solutions</DialogTitle>
          <p id="install-description" className="text-muted-foreground">
            Elige la mejor opción de instalación para tu dispositivo y necesidades
          </p>
        </DialogHeader>

        {recommendedOption && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Recomendado para {userPlatform}
                </Badge>
              </div>
              <CardTitle className="flex items-center gap-3">
                {recommendedOption.icon}
                {recommendedOption.title}
              </CardTitle>
              <CardDescription>{recommendedOption.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Tamaño: {recommendedOption.size}
                </div>
                <Button 
                  onClick={() => handleDownload(recommendedOption)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {recommendedOption.type === 'pwa' ? 'Instalar PWA' : 'Descargar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {installOptions.map((option) => (
            <Card key={option.platform} className={option.recommended ? 'opacity-50' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  {option.icon}
                  {option.title}
                  {option.available ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <strong>Tamaño:</strong> {option.size}
                </div>
                
                <div>
                  <strong className="text-sm">Características:</strong>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="text-sm">Pasos de instalación:</strong>
                  <ol className="mt-1 text-sm text-muted-foreground space-y-1">
                    {option.installSteps.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-blue-600 font-medium">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {!option.recommended && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleDownload(option)}
                    disabled={!option.available}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {option.type === 'pwa' ? 'Instalar PWA' : 
                     option.type === 'web' ? 'Usar Web App' : 'Descargar'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>
            ¿Necesitas ayuda con la instalación? 
            <button 
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/help/installation';
              }}
              className="text-blue-600 hover:underline ml-1 cursor-pointer"
            >
              Ver guía completa
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}