import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { 
  ArrowLeft, Send, Building, Code, ShoppingCart, 
  Smartphone, Cloud, HeadphonesIcon, Shield, PieChart,
  Loader2, CheckCircle2, AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function QuoteRequest() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rncValidation, setRncValidation] = useState<{
    isValid: boolean | null;
    companyName: string;
    isValidating: boolean;
  }>({
    isValid: null,
    companyName: '',
    isValidating: false
  });

  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    rnc: '',
    service: '',
    projectDescription: '',
    budget: '',
    timeline: ''
  });

  const services = [
    { value: 'erp', label: 'Sistema ERP Empresarial', icon: Building },
    { value: 'software', label: 'Desarrollo de Software', icon: Code },
    { value: 'ecommerce', label: 'E-commerce y Tienda Online', icon: ShoppingCart },
    { value: 'mobile', label: 'Aplicación Móvil', icon: Smartphone },
    { value: 'cloud', label: 'Servicios en la Nube', icon: Cloud },
    { value: 'consulting', label: 'Consultoría Tecnológica', icon: HeadphonesIcon },
    { value: 'security', label: 'Ciberseguridad', icon: Shield },
    { value: 'analytics', label: 'Business Intelligence', icon: PieChart }
  ];

  const validateRNC = async (rnc: string) => {
    if (!rnc || rnc.length < 9) {
      setRncValidation({ isValid: null, companyName: '', isValidating: false });
      return;
    }

    setRncValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch('/api/validate-rnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rnc })
      });

      const result = await response.json();

      if (response.ok && result.isValid) {
        setRncValidation({
          isValid: true,
          companyName: result.companyName || '',
          isValidating: false
        });
        
        // Auto-fill company name if available
        if (result.companyName && !quoteForm.company) {
          setQuoteForm(prev => ({ ...prev, company: result.companyName }));
        }
      } else {
        setRncValidation({
          isValid: false,
          companyName: '',
          isValidating: false
        });
      }
    } catch (error) {
      console.error('RNC validation error:', error);
      setRncValidation({
        isValid: false,
        companyName: '',
        isValidating: false
      });
    }
  };

  const handleRNCChange = (rnc: string) => {
    setQuoteForm(prev => ({ ...prev, rnc }));
    
    // Debounce RNC validation
    const timeoutId = setTimeout(() => {
      validateRNC(rnc);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quoteForm,
          rncValid: rncValidation.isValid,
          companyNameFromRNC: rncValidation.companyName
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "¡Solicitud enviada exitosamente!",
          description: "Te contactaremos pronto para discutir tu proyecto",
        });
        
        // Reset form
        setQuoteForm({
          name: '', email: '', phone: '', company: '', rnc: '',
          service: '', projectDescription: '', budget: '', timeline: ''
        });
        setRncValidation({ isValid: null, companyName: '', isValidating: false });
      } else {
        toast({
          title: "Error al enviar solicitud",
          description: result.message || "Intenta nuevamente",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending quote request:', error);
      toast({
        title: "Error de conexión",
        description: "Verifica tu conexión e intenta nuevamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead 
        title="Solicitar Cotización - Four One Solutions | Desarrollo de Software RD"
        description="Solicita una cotización gratuita para tu proyecto de software empresarial. Sistemas ERP, aplicaciones móviles, e-commerce. Verificación RNC incluida."
        keywords="cotización software república dominicana, presupuesto ERP dominicana, solicitar precio desarrollo software, Four One Solutions cotización, sistema empresarial presupuesto"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        {/* Navigation */}
        <nav className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white">Solicitar Cotización</h1>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-white text-center">
                  Solicitud de Cotización
                </CardTitle>
                <p className="text-gray-400 text-center">
                  Completa el formulario y te contactaremos para discutir tu proyecto
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Nombre Completo *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={quoteForm.name}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-white">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="(809) 000-0000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="company" className="text-white">Empresa *</Label>
                      <Input
                        id="company"
                        type="text"
                        value={quoteForm.company}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, company: e.target.value }))}
                        required
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                  </div>

                  {/* RNC Verification */}
                  <div>
                    <Label htmlFor="rnc" className="text-white">
                      RNC (Opcional)
                      <span className="text-gray-400 text-sm ml-1">- Verificación automática</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="rnc"
                        type="text"
                        value={quoteForm.rnc}
                        onChange={(e) => handleRNCChange(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white pr-10"
                        placeholder="Ej: 106001201, 133320681"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rncValidation.isValidating && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!rncValidation.isValidating && rncValidation.isValid === true && (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        )}
                        {!rncValidation.isValidating && rncValidation.isValid === false && (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    {rncValidation.isValid === true && rncValidation.companyName && (
                      <p className="text-green-400 text-sm mt-1">
                        ✓ RNC válido: {rncValidation.companyName}
                      </p>
                    )}
                    {rncValidation.isValid === false && quoteForm.rnc && (
                      <p className="text-red-400 text-sm mt-1">
                        ✗ RNC no encontrado en el registro DGII
                      </p>
                    )}
                  </div>

                  {/* Service Selection */}
                  <div>
                    <Label htmlFor="service" className="text-white">Tipo de Servicio *</Label>
                    <Select
                      value={quoteForm.service}
                      onValueChange={(value) => setQuoteForm(prev => ({ ...prev, service: value }))}
                      required
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Selecciona el tipo de servicio que necesitas" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {services.map((service) => (
                          <SelectItem key={service.value} value={service.value} className="text-white hover:bg-gray-700">
                            <div className="flex items-center">
                              <service.icon className="w-4 h-4 mr-2" />
                              {service.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Description */}
                  <div>
                    <Label htmlFor="projectDescription" className="text-white">Descripción del Proyecto *</Label>
                    <Textarea
                      id="projectDescription"
                      value={quoteForm.projectDescription}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                      required
                      className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                      placeholder="Describe detalladamente qué necesitas, funcionalidades específicas, objetivos del proyecto, etc."
                    />
                  </div>

                  {/* Budget and Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget" className="text-white">Presupuesto Estimado</Label>
                      <Select
                        value={quoteForm.budget}
                        onValueChange={(value) => setQuoteForm(prev => ({ ...prev, budget: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Selecciona tu rango de presupuesto" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="5k-15k" className="text-white">RD$ 5,000 - 15,000</SelectItem>
                          <SelectItem value="15k-50k" className="text-white">RD$ 15,000 - 50,000</SelectItem>
                          <SelectItem value="50k-100k" className="text-white">RD$ 50,000 - 100,000</SelectItem>
                          <SelectItem value="100k-250k" className="text-white">RD$ 100,000 - 250,000</SelectItem>
                          <SelectItem value="250k+" className="text-white">RD$ 250,000+</SelectItem>
                          <SelectItem value="discuss" className="text-white">Prefiero discutirlo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timeline" className="text-white">Tiempo Deseado</Label>
                      <Select
                        value={quoteForm.timeline}
                        onValueChange={(value) => setQuoteForm(prev => ({ ...prev, timeline: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="¿Cuándo necesitas el proyecto?" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="urgent" className="text-white">Urgente (1-2 semanas)</SelectItem>
                          <SelectItem value="1month" className="text-white">1 mes</SelectItem>
                          <SelectItem value="2-3months" className="text-white">2-3 meses</SelectItem>
                          <SelectItem value="3-6months" className="text-white">3-6 meses</SelectItem>
                          <SelectItem value="flexible" className="text-white">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando Solicitud...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Solicitud de Cotización
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}