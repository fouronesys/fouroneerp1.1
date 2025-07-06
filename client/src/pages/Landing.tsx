import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { 
  Check, Shield, Star, Code, Globe, Smartphone, 
  Palette, Mail, Phone, MapPin, Send, ArrowRight,
  Facebook, Twitter, Instagram, Linkedin, Github,
  Zap, Target, Users, Building, PieChart, 
  ShoppingCart, Truck, Factory, Calculator,
  HeadphonesIcon, Cloud, Database, Lock,
  Award, TrendingUp, Clock, CheckCircle2,
  Sparkles, Monitor, BookOpen, MessageSquare
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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Gracias por contactarnos. Te responderemos pronto.",
    });
    setContactForm({ name: '', email: '', phone: '', message: '' });
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
    { icon: Users, number: "500+", label: "Clientes Satisfechos" },
    { icon: CheckCircle2, number: "1000+", label: "Proyectos Completados" },
    { icon: Award, number: "15+", label: "Años de Experiencia" },
    { icon: TrendingUp, number: "99%", label: "Tasa de Éxito" }
  ];

  const testimonials = [
    {
      name: "María González",
      company: "Supermercados González",
      content: "El sistema ERP de Four One Solutions transformó completamente nuestra gestión. Ahora tenemos control total sobre inventarios y finanzas.",
      rating: 5
    },
    {
      name: "Carlos Méndez",
      company: "Restaurante El Sabor",
      content: "El sistema POS es increíble. La integración con impresoras térmicas y la generación automática de NCF nos ahorra horas diarias.",
      rating: 5
    },
    {
      name: "Ana Rodríguez",
      company: "Farmacia Central",
      content: "La app móvil para control de inventarios es perfecta. Podemos gestionar todo desde cualquier lugar de manera profesional.",
      rating: 5
    }
  ];

  return (
    <>
      <SEOHead 
        title="Four One Solutions - Desarrollo de Software y Sistemas ERP en República Dominicana"
        description="Especialistas en desarrollo de software, sistemas ERP, aplicaciones móviles y soluciones tecnológicas empresariales en República Dominicana. Cumplimiento fiscal DGII, facturación NCF automática."
        keywords="desarrollo software dominicana, sistema ERP dominicana, facturación NCF, DGII, aplicaciones móviles, e-commerce, consultoría tecnológica"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
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
                  <span className="text-sm text-blue-300 font-medium">Líder en Soluciones Tecnológicas</span>
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
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
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
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 h-full group">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                          <service.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-3 text-center">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-300 mb-4 text-center">
                          {service.description}
                        </p>
                        <div className="space-y-2">
                          {service.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-xs text-gray-400">
                              <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                              {feature}
                            </div>
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
                    Somos una empresa dominicana con más de 15 años de experiencia en el desarrollo de soluciones tecnológicas. 
                    Nos especializamos en crear sistemas que realmente resuelven los desafíos específicos de las empresas locales.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Cumplimiento total con normativas dominicanas (DGII, TSS)</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-gray-300">Soporte técnico local en español 24/7</span>
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
                      <div className="text-2xl font-bold text-white mb-1">300%</div>
                      <div className="text-sm text-gray-300">ROI Promedio</div>
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
                        <div>
                          <Input
                            placeholder="Tu nombre completo"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Tu número de teléfono"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <Textarea
                            placeholder="Cuéntanos sobre tu proyecto..."
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                            required
                          />
                        </div>
                        <Button 
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensaje
                        </Button>
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
                          <div className="text-gray-300">+1 (809) 555-0123</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Email</div>
                          <div className="text-gray-300">info@fourone.com.do</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center mr-4">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">Ubicación</div>
                          <div className="text-gray-300">Santo Domingo, República Dominicana</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Síguenos</h4>
                    <div className="flex space-x-4">
                      <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-blue-600 hover:border-blue-600">
                        <Facebook className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-blue-400 hover:border-blue-400">
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-pink-600 hover:border-pink-600">
                        <Instagram className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-blue-700 hover:border-blue-700">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-800">
                        <Github className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-800/50 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <img src={logoImage} alt="Four One Solutions Logo" className="w-8 h-8 object-contain" />
                    <span className="text-lg font-bold text-white">Four One Solutions</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Transformando empresas dominicanas a través de soluciones tecnológicas innovadoras y confiables.
                  </p>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-3">Servicios</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Sistemas ERP</li>
                    <li>Desarrollo Web</li>
                    <li>Apps Móviles</li>
                    <li>E-commerce</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-3">Empresa</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Nosotros</li>
                    <li>Casos de Éxito</li>
                    <li>Blog</li>
                    <li>Carreras</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-3">Soporte</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Documentación</li>
                    <li>API</li>
                    <li>Centro de Ayuda</li>
                    <li>Contacto</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                  © 2025 Four One Solutions. Todos los derechos reservados.
                </p>
                <div className="flex space-x-6 mt-4 sm:mt-0 text-sm text-gray-400">
                  <a href="#" className="hover:text-white">Privacidad</a>
                  <a href="#" className="hover:text-white">Términos</a>
                  <a href="#" className="hover:text-white">Cookies</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}