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
  const [isOpen, setIsOpen] = useState(false); // Temporarily disabled
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

  // Generate install options dynamically - Windows installation disabled per user request
  const installOptions: InstallOption[] = [
    // PWA Option - Only installation method available
    {
      platform: 'PWA',
      type: 'pwa',
      title: 'Instalar como App',
      description: 'Instala Four One Solutions como aplicación web progresiva en tu dispositivo',
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
    }
    // All desktop and mobile installations have been disabled per user request
    // Only PWA installation is available
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

  // Temporarily disabled to prevent runtime errors during migration
  return null;
  
  /* return (
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
  ); */
}