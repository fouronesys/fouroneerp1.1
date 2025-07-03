import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Check, Shield, Star, Code, Globe, Smartphone, 
  Palette, Mail, Phone, MapPin, Send,
  Facebook, Twitter, Instagram, Linkedin, Github
} from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import logoImage from "@assets/Four One Solutions Logo_20250603_002341_0000.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Gracias por contactarnos. Te responderemos pronto.",
    });
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={logoImage} 
                alt="Four One Solutions Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-white hidden xs:block">Four One Solutions</span>
              <span className="text-lg font-bold text-white block xs:hidden">Four One</span>
            </div>
            
            {/* Mobile-friendly button layout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden lg:flex items-center space-x-2 mr-4">
                <Button 
                  variant="ghost"
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Servicios
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Contacto
                </Button>
              </div>
              
              <div className="hidden sm:block">
                <InstallButton />
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/api-docs"}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm border-blue-500 text-blue-300 bg-transparent hover:bg-blue-700 hover:text-white transition-all"
              >
                <span className="hidden sm:inline">API Docs</span>
                <span className="sm:hidden">API</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/auth"}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border h-10 px-2 sm:px-4 py-2 sm:text-sm border-gray-500 text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white transition-all text-[12px] font-black"
              >
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Iniciar Sesión</span>
              </Button>
              <Button 
                onClick={() => window.location.href = "/register"}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none transition-all"
              >
                <span className="hidden sm:inline">Registrarse</span>
                <span className="sm:hidden">Registro</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile Install Button */}
          <div className="block sm:hidden mt-3 pt-3 border-t border-gray-800/30">
            <InstallButton />
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">Sistema ERP para República Dominicana</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              <strong>Four One Solutions</strong> es un sistema ERP empresarial con facturación automática NCF para DGII, 
              POS especializado para restaurantes, gestión de inventarios y contabilidad empresarial. 
              Compatible con las normativas fiscales dominicanas e integración con impresoras térmicas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Button 
                onClick={() => window.location.href = "/auth"}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg border-none"
              >
                Comenzar Ahora
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="w-full sm:w-auto border-blue-400 text-blue-300 bg-transparent hover:bg-blue-700 hover:text-white px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                Ver Servicios
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="w-full sm:w-auto border-purple-400 text-purple-300 bg-transparent hover:bg-purple-700 hover:text-white px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                Contactar
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Sistema de Verificación RNC */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Verificación RNC DGII Automática
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Validación automática de RNC con base de datos oficial DGII República Dominicana. Verificación instantánea de estatus tributario.
              </p>
            </CardContent>
          </Card>

          {/* Generación de Imágenes IA */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Búsqueda Inteligente de Imágenes
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Encuentra automáticamente imágenes profesionales de productos desde Google Images y Unsplash
              </p>
            </CardContent>
          </Card>

          {/* Asistente Virtual IA */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Asistente Virtual IA
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Consulta datos, analiza ventas y recibe recomendaciones inteligentes para tu negocio
              </p>
            </CardContent>
          </Card>

          {/* Facturación y Cumplimiento Fiscal */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Facturación y Cumplimiento
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                NCF automáticos, reportes 606/607 para DGII, validación completa
              </p>
            </CardContent>
          </Card>

          {/* POS y Punto de Venta */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                POS y Ventas
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Punto de venta profesional con impresión térmica 80mm
              </p>
            </CardContent>
          </Card>

          {/* Inventario y Almacén */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Inventario Inteligente
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Multi-almacén, códigos QR, alertas de stock mínimo
              </p>
            </CardContent>
          </Card>

          {/* Producción y Manufactura */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Módulo de Producción
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                BOM, recetas, órdenes de producción y costos reales
              </p>
            </CardContent>
          </Card>

          {/* Recursos Humanos */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Recursos Humanos
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Nómina, tiempo de trabajo, licencias y beneficios
              </p>
            </CardContent>
          </Card>

          {/* Multiplataforma y Offline */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Multiplataforma
              </h3>
              <p className="text-sm sm:text-base text-gray-300">
                Web, desktop, PWA con funcionamiento offline completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Features Section */}
        <div className="max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Características Avanzadas Incluidas
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Nuestro sistema incluye tecnologías de vanguardia para llevar tu negocio al siguiente nivel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Verificación RNC DGII */}
            <Card className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border-blue-500/40 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Verificación RNC Oficial</h3>
                </div>
                <p className="text-gray-200 mb-4">
                  Integración directa con la base de datos oficial de la DGII para validación automática de RNC en tiempo real.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Validación instantánea de RNC
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Base de datos DGII actualizada
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Verificación de estado fiscal
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* API para Desarrolladores */}
            <Card className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/40 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">API para Desarrolladores</h3>
                </div>
                <p className="text-gray-200 mb-4">
                  Acceso gratuito a nuestras APIs para verificación de RNC, tasas de cambio y más servicios empresariales.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    API de validación RNC gratis
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Tasas de cambio en tiempo real
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Documentación completa
                  </li>
                </ul>
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.href = "/api-registration"}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Obtener API Key
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Búsqueda Inteligente de Imágenes */}
            <Card className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 border-purple-500/40 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Búsqueda de Imágenes</h3>
                </div>
                <p className="text-gray-200 mb-4">
                  Encuentra automáticamente imágenes profesionales de productos desde Google Images y Unsplash.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Búsqueda automática en Google
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Imágenes de alta calidad Unsplash
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Optimización automática
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Asistente de IA */}
            <Card className="bg-gradient-to-br from-emerald-900/60 to-teal-900/60 border-emerald-500/40 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Herramientas de IA</h3>
                </div>
                <p className="text-gray-200 mb-4">
                  Asistente inteligente para análisis de ventas, optimización de inventario y generación de reportes.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Análisis predictivo de ventas
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Optimización de inventario
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    Reportes inteligentes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Planes Diseñados Para Tu Empresa
            </h2>
            <p className="text-base sm:text-lg text-gray-300">
              Comienza con 7 días gratis, sin compromiso
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Plan Mensual */}
            <Card className="border-2 border-gray-600 bg-gray-800/70 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Plan Mensual</h3>
                  <p className="text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">Flexibilidad mes a mes</p>
                  <div className="mt-3 sm:mt-4">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">RD$ 5,000</span>
                    <span className="text-gray-300 text-sm sm:text-base"> instalación</span>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">RD$ 3,500</span>
                    <span className="text-gray-300 text-sm sm:text-base">/mes</span>
                  </div>
                </div>
                
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {[
                    "Facturación completa con NCF",
                    "Verificación RNC automática DGII",
                    "Punto de venta (POS)",
                    "Gestión de inventario",
                    "Búsqueda automática de imágenes",
                    "Herramientas básicas de IA",
                    "Clientes y proveedores", 
                    "Reportes básicos",
                    "Hasta 5 usuarios"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-white text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    onClick={() => window.location.href = "/auth"}
                    className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white border-none text-sm sm:text-base py-2 sm:py-3"
                  >
                    Comenzar Ahora
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = "/auth"}
                    className="w-full border-gray-400 text-gray-300 bg-transparent hover:bg-gray-300 hover:text-black text-sm sm:text-base py-2 sm:py-3"
                  >
                    Registrar Nueva Empresa
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Anual */}
            <Card className="border-2 border-green-600 bg-gray-800/70 backdrop-blur-sm relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Ahorra RD$ 18,000
                </div>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Plan Anual</h3>
                  <p className="text-gray-300 mt-2">2 meses gratis al pagar anual</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">RD$ 35,000</span>
                    <span className="text-gray-300"> instalación</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">RD$ 24,000</span>
                    <span className="text-gray-300">/año</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-sm text-gray-400 line-through">RD$ 42,000/año</span>
                    <span className="text-sm bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent ml-2 font-medium">¡Ahorra RD$ 18,000!</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    "Todo del plan mensual incluido",
                    "✨ Herramientas IA avanzadas completas",
                    "✨ Verificación RNC premium con historial",
                    "✨ Búsqueda ilimitada de imágenes",
                    "Módulo de producción completo",
                    "Lista de materiales (BOM)",
                    "Gestión de recetas",
                    "Reportes avanzados con IA",
                    "Usuarios ilimitados",
                    "Soporte prioritario 24/7",
                    "2 meses gratis",
                    "Descuentos en hosting"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-400 mr-3" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.location.href = "/register"}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none"
                  >
                    Comenzar Ahora
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = "/register"}
                    className="w-full border-green-400 text-green-300 bg-transparent hover:bg-green-400 hover:text-black"
                  >
                    Registrar Nueva Empresa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-4">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              Sistema profesional • Soporte técnico incluido • Cumple normativas RD
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cumplimos con todas las normativas de República Dominicana (DGII, ITBIS, NCF)
            </p>
          </div>
        </div>

        {/* SEO Rich Content Section for Dominican Republic */}
        <div className="max-w-6xl mx-auto mt-16 mb-12">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Características Especializadas para República Dominicana
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-300 mb-3">
                  🇩🇴 Especializado para República Dominicana
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Facturación NCF automática</strong> - Cumplimiento total con DGII sin complicaciones</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Base de datos RNC oficial</strong> - Verificación instantánea de empresas dominicanas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Reportes DGII automatizados</strong> - Formatos 606, 607 y declaraciones fiscales</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Moneda dominicana (DOP)</strong> - Configuración nativa para pesos dominicanos</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-300 mb-3">
                  🚀 Tecnología Avanzada Adaptada al Mercado Local
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>POS para restaurantes dominicanos</strong> - Impresión térmica 58mm y 80mm</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Aplicación Windows y Android</strong> - Funciona offline para negocios móviles</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Soporte en español</strong> - Atención técnica 24/7 en horario dominicano</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span><strong>Precios en pesos dominicanos</strong> - Sin comisiones por cambio de divisa</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4">
                Sistema ERP Especializado para Empresas Dominicanas
              </h3>
              <p className="text-gray-300 mb-6">
                Four One Solutions está diseñado específicamente para el mercado dominicano con características 
                especializadas como facturación NCF automática para DGII, soporte para impresoras térmicas, 
                y cumplimiento total con las regulaciones fiscales de República Dominicana.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <span>✓ Compatible DGII</span>
                <span>✓ NCF Automático</span>
                <span>✓ Impresión Térmica</span>
                <span>✓ Reportes 606/607</span>
                <span>✓ Moneda DOP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Services Section */}
        <div id="services" className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Servicios de Desarrollo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Web Development */}
              <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Desarrollo Web</h3>
                  <p className="text-gray-300 mb-4">
                    Creación de páginas web modernas, responsivas y optimizadas para SEO
                  </p>
                  <ul className="text-left space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Landing Pages profesionales
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      E-commerce completo
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Sistemas web a medida
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Mobile Development */}
              <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Apps Móviles</h3>
                  <p className="text-gray-300 mb-4">
                    Desarrollo de aplicaciones nativas y multiplataforma
                  </p>
                  <ul className="text-left space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Apps Android nativas
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Progressive Web Apps
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      React Native / Flutter
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Custom Software */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Software a Medida</h3>
                  <p className="text-gray-300 mb-4">
                    Soluciones personalizadas para tu negocio
                  </p>
                  <ul className="text-left space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Sistemas ERP personalizados
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Automatización de procesos
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Integración de APIs
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="py-20 px-4 sm:px-6 bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Contáctanos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-8">
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Nombre</label>
                      <Input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        className="bg-gray-900/50 border-gray-600 text-white"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Email</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="bg-gray-900/50 border-gray-600 text-white"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Teléfono</label>
                      <Input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        className="bg-gray-900/50 border-gray-600 text-white"
                        placeholder="+1 809-000-0000"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Mensaje</label>
                      <Textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                        placeholder="¿En qué podemos ayudarte?"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Email</h3>
                        <p className="text-gray-300">info@fouronesolutions.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Teléfono</h3>
                        <p className="text-gray-300">+1 (829) 351-9324</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Ubicación</h3>
                        <p className="text-gray-300">Moca, República Dominicana</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Síguenos en Redes Sociales
            </h2>
            
            <div className="flex justify-center space-x-6">
              <a 
                href="https://facebook.com/fouronesolutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-6 w-6 text-white" />
              </a>
              
              <a 
                href="https://twitter.com/fouronesolutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
              >
                <Twitter className="h-6 w-6 text-white" />
              </a>
              
              <a 
                href="https://instagram.com/fouronesolutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Instagram className="h-6 w-6 text-white" />
              </a>
              
              <a 
                href="https://linkedin.com/company/fouronesolutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
              >
                <Linkedin className="h-6 w-6 text-white" />
              </a>
              
              <a 
                href="https://github.com/fouronesolutions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Github className="h-6 w-6 text-white" />
              </a>
            </div>
            
            <p className="text-gray-400 mt-8">
              Mantente actualizado con las últimas novedades y actualizaciones de Four One Solutions
            </p>
          </div>
        </div>

        {/* Keywords for SEO */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Four One Solutions</strong> - Sistema ERP República Dominicana, Software facturación NCF DGII, 
            Sistema POS restaurante dominicana, ERP empresarial Santo Domingo, Software contabilidad DGII, 
            Facturación electrónica República Dominicana, Sistema inventario RD, POS impresión térmica, 
            Software empresarial dominicano, Sistema punto venta Santiago, ERP restaurantes RD, 
            Facturación automática NCF, Software DGII República Dominicana, Sistema gestión empresarial RD,
            Desarrollo web República Dominicana, Desarrollo aplicaciones móviles RD, Desarrollo software a medida Santo Domingo.
          </p>
        </div>
      </div>
    </div>
  );
}
