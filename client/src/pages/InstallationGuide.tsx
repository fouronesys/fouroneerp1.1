import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Globe, Download, CheckCircle, AlertTriangle, Info, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function InstallationGuide() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Guía de Instalación</h1>
          <p className="text-muted-foreground">
            Instrucciones detalladas para instalar Four One Solutions en tu dispositivo
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* PWA Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Smartphone className="h-6 w-6" />
              Instalación como Aplicación Web Progresiva (PWA)
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Recomendado
              </Badge>
            </CardTitle>
            <CardDescription>
              La forma más rápida y eficiente de usar Four One Solutions como aplicación nativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Chrome/Edge (PC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">1.</span>
                      Busca el ícono "Instalar" en la barra de direcciones
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">2.</span>
                      Haz clic en "Instalar Four One Solutions"
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">3.</span>
                      Confirma la instalación
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">4.</span>
                      Usa la aplicación desde el escritorio
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Safari (iOS)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">1.</span>
                      Toca el botón "Compartir" (cuadro con flecha)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">2.</span>
                      Selecciona "Añadir a pantalla de inicio"
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">3.</span>
                      Edita el nombre si deseas
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">4.</span>
                      Toca "Añadir" para confirmar
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Chrome (Android)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">1.</span>
                      Toca "Instalar aplicación" en la notificación
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">2.</span>
                      O ve al menú → "Instalar aplicación"
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">3.</span>
                      Confirma la instalación
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-medium">4.</span>
                      Encuentra la app en tu cajón de aplicaciones
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Ventajas de la instalación PWA
                  </h4>
                  <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Funciona offline con sincronización automática</li>
                    <li>• Ocupa menos espacio (~5 MB)</li>
                    <li>• Actualizaciones automáticas</li>
                    <li>• Acceso desde pantalla de inicio como app nativa</li>
                    <li>• Notificaciones push (próximamente)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Monitor className="h-6 w-6" />
              Aplicaciones de Escritorio
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Windows Disponible
              </Badge>
            </CardTitle>
            <CardDescription>
              Aplicación nativa para Windows con funcionalidad offline completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Four One ERP para Windows
                  </h4>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                    Descarga la aplicación nativa para Windows con funcionamiento offline completo,
                    integración con impresoras térmicas y sincronización automática.
                  </p>
                  <Button 
                    className="mt-3"
                    onClick={() => window.open('/download/windows', '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar para Windows
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Windows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Instalador .exe con todas las funcionalidades
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• Base de datos SQLite local</li>
                    <li>• Sincronización automática</li>
                    <li>• Integración con Windows</li>
                    <li>• Funcionamiento offline completo</li>
                    <li>• Soporte para impresoras térmicas</li>
                  </ul>
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      Requiere Windows 10+
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">macOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aplicación .dmg nativa para Mac
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• Optimizada para macOS</li>
                    <li>• Integración con Spotlight</li>
                    <li>• Soporte para Touch Bar</li>
                    <li>• Notificaciones nativas</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Linux</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    AppImage universal para todas las distribuciones
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• Compatible con todas las distros</li>
                    <li>• Sin dependencias adicionales</li>
                    <li>• Portable y autónomo</li>
                    <li>• Integración con escritorio</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Web Application */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Globe className="h-6 w-6" />
              Aplicación Web
            </CardTitle>
            <CardDescription>
              Acceso directo desde cualquier navegador web moderno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Navegadores compatibles:</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Chrome/Chromium 80+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Firefox 75+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Safari 13+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Edge 80+
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Características:</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Sin instalación requerida
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Siempre actualizada
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Acceso multiplataforma
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Sincronización en tiempo real
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Crear marcador para acceso rápido:</h4>
              <ol className="text-sm space-y-1">
                <li>1. Presiona Ctrl+D (Cmd+D en Mac) en tu navegador</li>
                <li>2. Guarda el marcador en tu barra de marcadores</li>
                <li>3. Accede rápidamente haciendo clic en el marcador</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Solución de Problemas</CardTitle>
            <CardDescription>
              Problemas comunes y sus soluciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">No veo la opción "Instalar" en mi navegador</h4>
                <p className="text-sm text-muted-foreground">
                  Asegúrate de estar usando un navegador compatible (Chrome, Edge, Firefox) y que el sitio 
                  esté servido a través de HTTPS. Algunos navegadores requieren que el usuario interactúe 
                  con la página antes de mostrar la opción de instalación.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">La aplicación no funciona offline</h4>
                <p className="text-sm text-muted-foreground">
                  Después de instalar la PWA, navega por las secciones principales al menos una vez 
                  mientras tienes conexión a internet. Esto permitirá que se guarden en caché para 
                  uso offline.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">No se sincronizan mis datos</h4>
                <p className="text-sm text-muted-foreground">
                  Verifica tu conexión a internet y asegúrate de estar autenticado. Los datos se 
                  sincronizan automáticamente cuando hay conexión disponible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>¿Necesitas más ayuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Si tienes problemas con la instalación o necesitas asistencia adicional, 
              no dudes en contactarnos.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocation("/")}>
                Volver al inicio
              </Button>
              <Button variant="outline">
                Contactar soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}