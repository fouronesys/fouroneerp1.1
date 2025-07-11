import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { 
  Check, Shield, Star, Code, Smartphone, 
  Mail, Phone, MapPin, Send, ArrowRight,
  Instagram, Github,
  Users, Building, PieChart, 
  ShoppingCart,
  HeadphonesIcon, Cloud,
  Award, TrendingUp, Clock, CheckCircle2,
  Sparkles, Monitor, MessageSquare
} from "lucide-react";
import { InstallButton } from "@/components/InstallButton";
import logoImage from "@assets/Four One Solutions Logo_20250603_002341_0000.png";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Landing() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "¡Mensaje enviado exitosamente!",
          description: "Te contactaremos pronto desde info@fourone.com.do",
        });
        setContactForm({ name: '', email: '', phone: '', message: '' });
      } else {
        toast({
          title: "Error al enviar mensaje",
          description: result.message || "Intenta nuevamente",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Error de conexión",
        description: "Verifica tu conexión e intenta nuevamente",
        variant: "destructive"
      });
    }
  };

  const services = [
    {
      icon: Building,
      title: "Sistemas ERP Empresariales",
      description: "Soluciones completas de planificación de recursos empresariales diseñadas específicamente para empresas dominicanas",
      features: ["Gestión financiera", "Control de inventarios", "Recursos humanos", "Reportes ejecutivos"],
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: Code,
      title: "Desarrollo de Software",
      description: "Desarrollo personalizado de aplicaciones web, móviles y sistemas empresariales con tecnologías modernas",
      features: ["Aplicaciones web", "Apps móviles", "APIs y microservicios", "Integración de sistemas"],
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce y Tiendas Online",
      description: "Plataformas de comercio electrónico completas con pasarelas de pago y gestión de inventarios",
      features: ["Tiendas online", "Pasarelas de pago", "Gestión de productos", "Marketing digital"],
      color: "from-green-600 to-emerald-600"
    },
    {
      icon: Cloud,
      title: "Servicios en la Nube",
      description: "Migración, hosting y gestión de infraestructura en la nube para optimizar costos y rendimiento",
      features: ["Hosting en la nube", "Migración de datos", "Backup automático", "Escalabilidad"],
      color: "from-orange-600 to-red-600"
    },
    {
      icon: Smartphone,
      title: "Aplicaciones Móviles",
      description: "Desarrollo de aplicaciones nativas e híbridas para iOS y Android con diseño intuitivo",
      features: ["Apps iOS y Android", "Diseño UX/UI", "Notificaciones push", "Sincronización offline"],
      color: "from-indigo-600 to-blue-600"
    },
    {
      icon: HeadphonesIcon,
      title: "Consultoría Tecnológica",
      description: "Asesoría especializada en transformación digital y optimización de procesos empresariales",
      features: ["Auditoría tecnológica", "Transformación digital", "Optimización de procesos", "Capacitación"],
      color: "from-teal-600 to-cyan-600"
    },
    {
      icon: Shield,
      title: "Ciberseguridad",
      description: "Protección integral de datos empresariales y cumplimiento de normativas de seguridad",
      features: ["Auditoría de seguridad", "Protección de datos", "Cumplimiento normativo", "Monitoreo 24/7"],
      color: "from-red-600 to-pink-600"
    },
    {
      icon: PieChart,
      title: "Business Intelligence",
      description: "Análisis de datos empresariales y dashboards interactivos para toma de decisiones informadas",
      features: ["Dashboards ejecutivos", "Análisis predictivo", "Reportes automáticos", "KPIs en tiempo real"],
      color: "from-yellow-600 to-orange-600"
    }
  ];

  const stats = [
    { icon: Users, number: "24/7", label: "Soporte Técnico" },
    { icon: CheckCircle2, number: "100%", label: "Código Propio" },
    { icon: Award, number: "RD", label: "Empresa Local" },
    { icon: TrendingUp, number: "DGII", label: "Cumplimiento Fiscal" }
  ];

  const testimonials = [
    {
      name: "Sistema Demo",
      company: "Prueba nuestras funcionalidades",
      content: "Explora todas las características del sistema ERP con datos de demostración. Prueba la gestión de inventarios, facturación NCF y reportes DGII.",
      rating: 5
    },
    {
      name: "Tecnología Moderna",
      company: "Stack tecnológico actualizado",
      content: "React, TypeScript, PostgreSQL y Node.js. Sistema desarrollado con tecnologías modernas y estándares de desarrollo actuales.",
      rating: 5
    },
    {
      name: "Cumplimiento Fiscal",
      company: "Normativas dominicanas",
      content: "Sistema diseñado específicamente para cumplir con todas las regulaciones fiscales de República Dominicana incluyendo NCF y reportes DGII.",
      rating: 5
    }
  ];

  return (
    <>
      <SEOHead 
        title="Four One Solutions - Desarrollo de Software ERP en República Dominicana | Moca"
        description="Desarrollo de software empresarial en República Dominicana. Sistemas ERP, facturación NCF DGII, apps móviles, e-commerce. Ubicados en Moca. ✅ Cumplimiento fiscal dominicano. ☎️ (829) 351-9324"
        keywords="desarrollo software república dominicana, sistema ERP dominicana, facturación NCF DGII, Four One Solutions Moca, software empresarial dominicano, aplicaciones móviles RD, e-commerce dominicana, consultoría tecnológica santiago, POS system dominicana, inventario empresarial, contabilidad automatizada dominicana, transformación digital empresas"
      />
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Four One Solutions",
            "url": "https://fourone.com.do",
            "logo": "https://fourone.com.do/logo.png",
            "description": "Líder en desarrollo de software empresarial, sistemas ERP, y soluciones tecnológicas en República Dominicana",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Moca",
              "addressCountry": "DO",
              "addressRegion": "Espaillat"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-829-351-9324",
              "contactType": "customer service",
              "availableLanguage": "Spanish"
            },
            "sameAs": [
              "https://facebook.com/fouroneolutions",
              "https://twitter.com/fourone_do",
              "https://linkedin.com/company/four-one-solutions"
            ],
            "services": [
              "Desarrollo de Software ERP",
              "Sistemas de Facturación NCF",
              "Aplicaciones Móviles",
              "E-commerce",
              "Consultoría Tecnológica"
            ]
          })
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        {/* Optimized Background Elements */}
        <div className="fixed inset-0 z-0">
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [0, 15, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-96 h-96 bg-purple-500/6 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.08, 0.18, 0.08],
              x: [0, -20, 0],
              y: [0, 12, 0]
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/3 w-80 h-80 bg-green-500/7 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.2, 0.3, 0.2],
              x: [0, 10, 0],
              y: [0, -8, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 8
            }}
          />
        </div>

        {/* Navigation Bar */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-50 border-b border-gray-800/50 bg-black/20 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-2 sm:space-x-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <img 
                  src={logoImage} 
                  alt="Four One Solutions Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                <span className="text-lg sm:text-xl font-bold text-white hidden xs:block">Four One Solutions</span>
                <span className="text-lg font-bold text-white block xs:hidden">Four One</span>
              </motion.div>
              
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
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Nosotros
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Contacto
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => window.location.href = "/sitemap"}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Sitemap
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
                  <span className="sm:hidden">Login</span>
                </Button>
                <Button 
                  onClick={() => window.location.href = "/register"}
                  className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none transition-all"
                >
                  <span className="hidden sm:inline">Comenzar Gratis</span>
                  <span className="sm:hidden">Gratis</span>
                </Button>
              </div>
            </div>
            
            <div className="block sm:hidden mt-3 pt-3 border-t border-gray-800/30">
              <InstallButton />
            </div>
          </div>
        </motion.nav>

        <div className="relative z-10">
          {/* Hero Section */}
          <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <motion.div 
              className="text-center mb-12 sm:mb-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <motion.div 
                className="max-w-5xl mx-auto mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <motion.div 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full px-6 py-2 mb-6 border border-blue-500/30"
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(59, 130, 246, 0.3)", "0 0 40px rgba(59, 130, 246, 0.5)", "0 0 20px rgba(59, 130, 246, 0.3)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-medium">Soluciones Tecnológicas Empresariales</span>
                </motion.div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Four One Solutions
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed max-w-4xl mx-auto">
                  Especialistas en <strong className="text-blue-400">desarrollo de software</strong>, 
                  <strong className="text-purple-400"> sistemas ERP</strong>, 
                  <strong className="text-green-400"> aplicaciones móviles</strong> y 
                  <strong className="text-cyan-400"> soluciones tecnológicas empresariales</strong> en República Dominicana
                </p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <Button 
                    onClick={() => window.location.href = "/quote-request"}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg border-none shadow-lg hover:shadow-xl transition-all group"
                  >
                    Solicitar Cotización
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                    size="lg"
                    className="w-full sm:w-auto border-cyan-400 text-cyan-300 bg-transparent hover:bg-cyan-700 hover:text-white px-8 py-4 text-lg transition-all"
                  >
                    Ver Servicios
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Services Section */}
          <section id="services" className="py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent to-gray-900/50">
            <div className="container mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Nuestros <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Servicios</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Ofrecemos soluciones tecnológicas integrales diseñadas para impulsar el crecimiento y la eficiencia de tu empresa
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {services.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      mass: 0.5
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      y: -12, 
                      scale: 1.03,
                      rotateY: 5,
                      transition: { 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 15,
                        mass: 0.3
                      }
                    }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 hover:border-gray-600/70 transition-all duration-500 h-full group hover:shadow-xl hover:shadow-blue-500/10">
                      <CardContent className="p-6">
                        <motion.div 
                          className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center mx-auto mb-4`}
                          whileHover={{ 
                            scale: 1.15, 
                            rotate: 15,
                            transition: { 
                              duration: 0.3,
                              type: "spring",
                              stiffness: 400,
                              damping: 10
                            }
                          }}
                        >
                          <service.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-white mb-3 text-center group-hover:text-blue-200 transition-colors duration-300">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-300 mb-4 text-center group-hover:text-gray-200 transition-colors duration-300">
                          {service.description}
                        </p>
                        <div className="space-y-2">
                          {service.features.map((feature, idx) => (
                            <motion.div 
                              key={idx} 
                              className="flex items-center text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300"
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index * 0.15) + (idx * 0.1) }}
                              viewport={{ once: true }}
                            >
                              <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                              {feature}
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-20 px-4 sm:px-6">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold text-white mb-6">
                    ¿Por qué elegir <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Four One Solutions</span>?
                  </h2>
                  <p className="text-lg text-gray-300 mb-6">
                    Empresa dominicana especializada en desarrollo de soluciones tecnológicas empresariales. 
                    Nos enfocamos en crear sistemas que cumplen con las normativas locales y resuelven necesidades específicas del mercado dominicano.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Cumplimiento total con normativas dominicanas (DGII, TSS)</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Soporte técnico local en español</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Tecnologías modernas y actualizadas</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Capacitación incluida para tu equipo</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
                    <CardContent className="p-6 text-center">
                      <Monitor className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-white mb-1">100%</div>
                      <div className="text-sm text-gray-300">Digital</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-white mb-1">24/7</div>
                      <div className="text-sm text-gray-300">Soporte</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                    <CardContent className="p-6 text-center">
                      <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-white mb-1">100%</div>
                      <div className="text-sm text-gray-300">Seguro</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-white mb-1">NCF</div>
                      <div className="text-sm text-gray-300">Integrado</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-900/50 to-transparent">
            <div className="container mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  Lo que dicen nuestros <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">clientes</span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Casos de éxito reales de empresas dominicanas que han transformado sus operaciones con nuestras soluciones
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                        <div>
                          <div className="font-semibold text-white">{testimonial.name}</div>
                          <div className="text-sm text-gray-400">{testimonial.company}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20 px-4 sm:px-6">
            <div className="container mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  ¿Listo para <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">transformar</span> tu empresa?
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Contáctanos hoy mismo para una consulta gratuita y descubre cómo podemos ayudarte a alcanzar tus objetivos tecnológicos
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-white mb-6">Envíanos un mensaje</h3>
                      <form onSubmit={handleContactSubmit} className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          viewport={{ once: true }}
                        >
                          <Input
                            placeholder="Tu nombre completo"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                            required
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          viewport={{ once: true }}
                        >
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                            required
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          viewport={{ once: true }}
                        >
                          <Input
                            placeholder="Tu número de teléfono"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          viewport={{ once: true }}
                        >
                          <Textarea
                            placeholder="Cuéntanos sobre tu proyecto..."
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                            required
                          />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          viewport={{ once: true }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              type="submit"
                              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Enviar Mensaje
                            </Button>
                          </motion.div>
                        </motion.div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Información de contacto</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Teléfono</div>
                          <a href="tel:+18293519324" className="text-gray-300 hover:text-white transition-colors">
                            +1 (829) 351-9324
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">WhatsApp</div>
                          <motion.button
                            onClick={() => window.open("https://wa.me/18293519324?text=Hola%2C%20me%20interesa%20conocer%20más%20sobre%20los%20servicios%20de%20Four%20One%20Solutions", "_blank")}
                            className="text-gray-300 hover:text-white transition-colors flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            +1 (829) 351-9324
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-4">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Ubicación</div>
                          <div className="text-gray-300">Moca, República Dominicana</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Email</div>
                          <a href="mailto:info@fourone.com.do" className="text-gray-300 hover:text-white transition-colors">
                            info@fourone.com.do
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Síguenos</h4>
                    <div className="flex space-x-4">
                  
                   
                      <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => window.open("https://instagram.com/fourone.solutionssrl", "_blank")}
                          className="border-gray-600 text-gray-300 hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-all duration-300"
                        >
                          <Instagram className="w-4 h-4" />
                        </Button>
                      </motion.div>
                  
                      <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => window.open("https://github.com/fouronesys/fouroneerp1.1", "_blank")}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-800 hover:text-white transition-all duration-300"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-800/50 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <img src={logoImage} alt="Four One Solutions Logo" className="w-8 h-8 object-contain" />
                    <span className="text-lg font-bold text-white">Four One Solutions</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Transformando empresas dominicanas a través de soluciones tecnológicas innovadoras y confiables.
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <h5 className="text-white font-semibold mb-3">Servicios</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <button 
                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Sistemas ERP
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Desarrollo Web
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Apps Móviles
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        E-commerce
                      </button>
                    </li>
                  </ul>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <h5 className="text-white font-semibold mb-3">Empresa</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <button 
                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Nosotros
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => window.location.href = "/auth"}
                        className="hover:text-white transition-colors text-left"
                      >
                        Casos de Éxito
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => window.location.href = "/auth"}
                        className="hover:text-white transition-colors text-left"
                      >
                        Blog
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Carreras
                      </button>
                    </li>
                  </ul>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <h5 className="text-white font-semibold mb-3">Soporte</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>
                      <button 
                        onClick={() => window.location.href = "/api-docs"}
                        className="hover:text-white transition-colors text-left"
                      >
                        Documentación
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => window.location.href = "/api-docs"}
                        className="hover:text-white transition-colors text-left"
                      >
                        API
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Centro de Ayuda
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-white transition-colors text-left"
                      >
                        Contacto
                      </button>
                    </li>
                  </ul>
                </motion.div>
              </div>
              
              <motion.div 
                className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row justify-between items-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-gray-400 text-sm">
                  © 2025 Four One Solutions. Todos los derechos reservados.
                </p>
                <div className="flex space-x-6 mt-4 sm:mt-0 text-sm text-gray-400">
                  <button 
                    onClick={() => window.location.href = "/auth"}
                    className="hover:text-white transition-colors"
                  >
                    Privacidad
                  </button>
                  <button 
                    onClick={() => window.location.href = "/auth"}
                    className="hover:text-white transition-colors"
                  >
                    Términos
                  </button>
                  <button 
                    onClick={() => window.location.href = "/auth"}
                    className="hover:text-white transition-colors"
                  >
                    Cookies
                  </button>
                </div>
              </motion.div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}