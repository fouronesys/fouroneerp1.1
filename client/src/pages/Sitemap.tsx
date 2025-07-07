import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { 
  Building, Code, Smartphone, ShoppingCart, Cloud, Shield,
  BarChart3, Users, HeadphonesIcon, Wrench, FileText,
  Monitor, Settings, MapPin, Phone, Mail, Download,
  Home, Info, CheckCircle2, Globe
} from "lucide-react";
import { Link } from "wouter";

interface SitemapSection {
  title: string;
  icon: any;
  color: string;
  pages: {
    name: string;
    url: string;
    description: string;
  }[];
}

export default function Sitemap() {
  const sitemapData: SitemapSection[] = [
    {
      title: "Páginas Principales",
      icon: Home,
      color: "from-blue-600 to-cyan-600",
      pages: [
        {
          name: "Inicio",
          url: "/",
          description: "Página principal con información general de la empresa"
        },
        {
          name: "Servicios",
          url: "/#services",
          description: "Todos los servicios tecnológicos que ofrecemos"
        },
        {
          name: "Nosotros",
          url: "/#about",
          description: "Información sobre Four One Solutions"
        },
        {
          name: "Contacto",
          url: "/#contact",
          description: "Formulario de contacto y información de la empresa"
        }
      ]
    },
    {
      title: "Servicios de Desarrollo",
      icon: Code,
      color: "from-purple-600 to-pink-600",
      pages: [
        {
          name: "Desarrollo de Software",
          url: "/servicios/desarrollo-software",
          description: "Desarrollo personalizado de aplicaciones empresariales"
        },
        {
          name: "Aplicaciones Móviles",
          url: "/servicios/aplicaciones-moviles",
          description: "Apps móviles para iOS y Android"
        },
        {
          name: "Desarrollo Web",
          url: "/servicios/desarrollo-web",
          description: "Sitios web corporativos y aplicaciones web"
        },
        {
          name: "APIs y Microservicios",
          url: "/servicios/apis-microservicios",
          description: "Integración de sistemas y arquitectura de microservicios"
        }
      ]
    },
    {
      title: "Sistemas Empresariales",
      icon: Building,
      color: "from-green-600 to-emerald-600",
      pages: [
        {
          name: "Sistemas ERP",
          url: "/servicios/sistemas-erp",
          description: "Planificación de recursos empresariales completa"
        },
        {
          name: "E-commerce",
          url: "/servicios/e-commerce",
          description: "Tiendas online y plataformas de comercio electrónico"
        },
        {
          name: "Sistemas POS",
          url: "/servicios/sistemas-pos",
          description: "Puntos de venta con cumplimiento fiscal dominicano"
        },
        {
          name: "Gestión de Inventarios",
          url: "/servicios/gestion-inventarios",
          description: "Control completo de inventarios y stock"
        }
      ]
    },
    {
      title: "Soluciones Empresariales",
      icon: Wrench,
      color: "from-orange-600 to-red-600",
      pages: [
        {
          name: "Automatización de Procesos",
          url: "/soluciones/automatizacion-procesos",
          description: "Automatización de workflows y procesos empresariales"
        },
        {
          name: "Digitalización Empresarial",
          url: "/soluciones/digitalizacion-empresarial",
          description: "Transformación digital completa de la empresa"
        },
        {
          name: "Transformación Digital",
          url: "/soluciones/transformacion-digital",
          description: "Modernización tecnológica integral"
        },
        {
          name: "Consultoría Tecnológica",
          url: "/soluciones/consultoria-tecnologica",
          description: "Asesoramiento estratégico en tecnología"
        }
      ]
    },
    {
      title: "Soluciones por Industria",
      icon: BarChart3,
      color: "from-indigo-600 to-purple-600",
      pages: [
        {
          name: "Restaurantes",
          url: "/industrias/restaurantes",
          description: "Soluciones específicas para restaurantes y food service"
        },
        {
          name: "Retail y Comercio",
          url: "/industrias/retail",
          description: "Sistemas para tiendas y comercio al detalle"
        },
        {
          name: "Manufactura",
          url: "/industrias/manufactura",
          description: "Gestión de producción y manufactura"
        },
        {
          name: "Servicios Profesionales",
          url: "/industrias/servicios",
          description: "Soluciones para empresas de servicios"
        }
      ]
    },
    {
      title: "Cumplimiento Fiscal",
      icon: FileText,
      color: "from-cyan-600 to-blue-600",
      pages: [
        {
          name: "NCF Management",
          url: "/empresa/ncf-management",
          description: "Gestión de números de comprobante fiscal"
        },
        {
          name: "Reportes DGII",
          url: "/empresa/reportes-dgii",
          description: "Reportes 606, 607 y otros informes fiscales"
        },
        {
          name: "Validación RNC",
          url: "/empresa/validacion-rnc",
          description: "Validación de RNC contra registro DGII"
        },
        {
          name: "Cumplimiento Fiscal",
          url: "/empresa/cumplimiento-fiscal",
          description: "Herramientas de cumplimiento fiscal dominicano"
        }
      ]
    },
    {
      title: "Soporte y Recursos",
      icon: HeadphonesIcon,
      color: "from-teal-600 to-green-600",
      pages: [
        {
          name: "Documentación API",
          url: "/api-docs",
          description: "Documentación completa de nuestras APIs"
        },
        {
          name: "Descargas",
          url: "/downloads",
          description: "Aplicaciones desktop y móviles disponibles"
        },
        {
          name: "Sistema Demo",
          url: "/auth",
          description: "Acceso al sistema de demostración"
        },
        {
          name: "Registro",
          url: "/register",
          description: "Crear nueva cuenta en el sistema"
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead 
        title="Sitemap - Four One Solutions | Mapa del Sitio"
        description="Mapa completo del sitio web de Four One Solutions. Encuentra fácilmente todos nuestros servicios: desarrollo de software, aplicaciones móviles, sistemas ERP, e-commerce y consultoría tecnológica en República Dominicana."
        keywords="sitemap four one solutions, mapa sitio web, desarrollo software dominicana, servicios tecnológicos, aplicaciones móviles rd, sistemas erp, e-commerce dominicana"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full px-6 py-2 mb-6 border border-blue-500/30">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">Mapa del Sitio</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sitemap
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Encuentra fácilmente todos nuestros servicios y páginas. Four One Solutions ofrece 
              soluciones tecnológicas completas para empresas en República Dominicana.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>42 Páginas Indexadas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>7 Categorías de Servicios</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Cumplimiento DGII</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sitemapData.map((section, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.pages.map((page, pageIndex) => (
                      <div key={pageIndex} className="group">
                        <Link href={page.url}>
                          <div className="block p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/60 transition-all duration-200 cursor-pointer">
                            <h4 className="font-medium text-blue-300 group-hover:text-blue-200 mb-1">
                              {page.name}
                            </h4>
                            <p className="text-xs text-gray-400 group-hover:text-gray-300">
                              {page.description}
                            </p>
                            <div className="text-xs text-gray-500 mt-1 font-mono">
                              {page.url}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/30 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  ¿No encuentras lo que buscas?
                </h3>
                <p className="text-gray-300 mb-6">
                  Contáctanos para obtener información personalizada sobre nuestros servicios 
                  de desarrollo de software, aplicaciones móviles y soluciones empresariales.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/#contact">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Contactar
                    </div>
                  </Link>
                  <a 
                    href="tel:+18293519324"
                    className="flex items-center gap-2 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-6 py-3 rounded-lg transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    (829) 351-9324
                  </a>
                  <Link href="/downloads">
                    <div className="flex items-center gap-2 border border-green-600 text-green-300 hover:bg-green-700 hover:text-white px-6 py-3 rounded-lg transition-all cursor-pointer">
                      <Download className="w-4 h-4" />
                      Descargas
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}