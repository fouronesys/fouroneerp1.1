import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, Smartphone, Monitor, Zap, Shield, Wifi } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      // Show prompt after 30 seconds or on user interaction
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setIsVisible(true);
        }
      }, 30000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: "Instalar en iPhone/iPad",
          steps: [
            "Toca el botón 'Compartir' en Safari",
            "Selecciona 'Añadir a pantalla de inicio'",
            "Confirma tocando 'Añadir'"
          ]
        };
      case 'android':
        return {
          title: "Instalar en Android",
          steps: [
            "Toca 'Instalar App' cuando aparezca",
            "O ve al menú → 'Añadir a pantalla de inicio'",
            "Confirma la instalación"
          ]
        };
      case 'windows':
        return {
          title: "Instalar en Windows",
          steps: [
            "Haz clic en el ícono de instalación en la barra de direcciones",
            "O ve a Menú → 'Instalar Four One Solutions'",
            "Confirma la instalación"
          ]
        };
      default:
        return {
          title: "Instalar como App",
          steps: [
            "Busca el ícono de instalación en tu navegador",
            "Sigue las instrucciones de instalación",
            "Disfruta de la experiencia nativa"
          ]
        };
    }
  };

  if (isInstalled || !isVisible) return null;

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Instalar Four One Solutions</CardTitle>
                <CardDescription>Acceso rápido desde tu dispositivo</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Acceso instantáneo</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm">Funciona offline</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Seguro y confiable</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Monitor className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Interfaz nativa</span>
            </div>
          </div>

          {deferredPrompt ? (
            <div className="space-y-3">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Instalar Aplicación
              </Button>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Instalación con un clic disponible
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">{instructions.title}</h4>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              La aplicación instalada incluye todas las funciones: POS, Contabilidad, Fiscal y más
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}