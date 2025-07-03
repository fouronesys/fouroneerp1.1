import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, Monitor, X, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onDismiss?: () => void;
}

export function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<'windows' | 'android' | 'ios' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isWindows = userAgent.includes('windows');
    const isAndroid = userAgent.includes('android');
    const isIOS = /ipad|iphone|ipod/.test(userAgent);

    if (isWindows) setPlatform('windows');
    else if (isAndroid) setPlatform('android');
    else if (isIOS) setPlatform('ios');

    // Verificar si ya está instalado (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Listener para PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt después de 3 segundos si no está instalado
      if (!standalone) {
        setTimeout(() => {
          const hasShownPrompt = localStorage.getItem('install-prompt-dismissed');
          if (!hasShownPrompt) {
            setShowPrompt(true);
          }
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para Windows, mostrar prompt si no está instalado
    if (isWindows && !standalone) {
      const hasShownWindowsPrompt = localStorage.getItem('windows-install-prompt-dismissed');
      if (!hasShownWindowsPrompt) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDownloadWindows = () => {
    // Redirigir a la descarga de Windows
    window.open('/download/windows', '_blank');
    handleDismiss();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(
      platform === 'windows' ? 'windows-install-prompt-dismissed' : 'install-prompt-dismissed',
      'true'
    );
    onDismiss?.();
  };

  const getInstallContent = () => {
    switch (platform) {
      case 'windows':
        return {
          title: 'Instalar Four One ERP para Windows',
          description: 'Obtén la mejor experiencia con nuestra aplicación nativa para Windows.',
          icon: <Monitor className="h-12 w-12 text-blue-600" />,
          benefits: [
            'Acceso offline completo',
            'Integración con impresoras térmicas',
            'Mejor rendimiento',
            'Sincronización automática',
            'Notificaciones de escritorio'
          ],
          primaryAction: {
            label: 'Descargar para Windows',
            action: handleDownloadWindows,
            available: true
          },
          secondaryAction: {
            label: 'Instalar PWA',
            action: handleInstallPWA,
            available: !!deferredPrompt
          }
        };

      case 'android':
        return {
          title: 'Instalar Four One ERP',
          description: 'Instala nuestra app para un acceso rápido y funcionalidad offline.',
          icon: <Smartphone className="h-12 w-12 text-green-600" />,
          benefits: [
            'Funciona sin internet',
            'Notificaciones push',
            'Acceso directo desde inicio',
            'Sincronización automática',
            'Optimizado para móvil'
          ],
          primaryAction: {
            label: 'Instalar App',
            action: handleInstallPWA,
            available: !!deferredPrompt
          }
        };

      case 'ios':
        return {
          title: 'Agregar a Pantalla de Inicio',
          description: 'Instala Four One ERP en tu iPhone/iPad para mejor experiencia.',
          icon: <Smartphone className="h-12 w-12 text-gray-600" />,
          benefits: [
            'Acceso rápido',
            'Experiencia nativa',
            'Funciona offline',
            'Sin ocupar espacio extra'
          ],
          instructions: 'Toca el botón "Compartir" y selecciona "Agregar a pantalla de inicio"'
        };

      default:
        return {
          title: 'Instalar Four One ERP',
          description: 'Instala nuestra aplicación para una mejor experiencia.',
          icon: <Download className="h-12 w-12 text-blue-600" />,
          benefits: [
            'Acceso offline',
            'Mejor rendimiento',
            'Notificaciones',
            'Actualizaciones automáticas'
          ],
          primaryAction: {
            label: 'Instalar App',
            action: handleInstallPWA,
            available: !!deferredPrompt
          }
        };
    }
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  const content = getInstallContent();

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {content.icon}
            <div>
              <DialogTitle className="text-lg">{content.title}</DialogTitle>
              <DialogDescription className="text-sm">
                {content.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Beneficios */}
          <div>
            <h4 className="font-medium mb-2">Beneficios:</h4>
            <ul className="space-y-1">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Instrucciones para iOS */}
          {platform === 'ios' && content.instructions && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Instrucciones:</strong> {content.instructions}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col gap-2">
            {content.primaryAction && (
              <Button
                onClick={content.primaryAction.action}
                disabled={isInstalling || (content.primaryAction.available !== undefined && !content.primaryAction.available)}
                className="w-full"
              >
                {isInstalling ? 'Instalando...' : content.primaryAction.label}
              </Button>
            )}

            {content.secondaryAction && content.secondaryAction.available && (
              <Button
                variant="outline"
                onClick={content.secondaryAction.action}
                disabled={isInstalling}
                className="w-full"
              >
                {content.secondaryAction.label}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full text-sm"
            >
              Tal vez más tarde
            </Button>
          </div>

          {/* Plataforma detectada */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {platform === 'windows' && 'Windows detectado'}
              {platform === 'android' && 'Android detectado'}
              {platform === 'ios' && 'iOS detectado'}
              {platform === 'other' && 'Plataforma compatible'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InstallPrompt;