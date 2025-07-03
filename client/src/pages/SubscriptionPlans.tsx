import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Star, Crown, Zap, Building2, Globe } from 'lucide-react';
import fourOneLogo from '@assets/Four One Solutions Logo.png';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isPopular?: boolean;
  icon: any;
  maxUsers: number;
  maxCompanies: number;
  storage: string;
  support: string;
  integrations: number;
  features: PlanFeature[];
}

export default function SubscriptionPlans() {
  const [isYearly, setIsYearly] = useState(false);

  const plans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Iniciador',
      description: 'Perfecto para pequeños negocios que están comenzando',
      monthlyPrice: 29,
      yearlyPrice: 290,
      icon: Zap,
      maxUsers: 3,
      maxCompanies: 1,
      storage: '10 GB',
      support: 'Email',
      integrations: 5,
      features: [
        { name: 'Punto de venta (POS)', included: true },
        { name: 'Facturación básica', included: true },
        { name: 'Inventario simple', included: true },
        { name: 'Reportes básicos', included: true },
        { name: 'Chat interno', included: true },
        { name: 'Documentos fiscales', included: true },
        { name: 'Manufactura avanzada', included: false },
        { name: 'Nómina y RRHH', included: false },
        { name: 'IA Insights', included: false },
        { name: 'Multi-almacén', included: false },
        { name: 'API avanzada', included: false },
      ]
    },
    {
      id: 'professional',
      name: 'Profesional',
      description: 'Ideal para empresas en crecimiento con necesidades avanzadas',
      monthlyPrice: 79,
      yearlyPrice: 790,
      isPopular: true,
      icon: Star,
      maxUsers: 10,
      maxCompanies: 3,
      storage: '50 GB',
      support: 'Email + Chat',
      integrations: 15,
      features: [
        { name: 'Todo del plan Iniciador', included: true },
        { name: 'Manufactura y BOM', included: true },
        { name: 'Gestión de almacenes', included: true },
        { name: 'Nómina básica', included: true },
        { name: 'IA Insights básico', included: true },
        { name: 'Reportes avanzados', included: true },
        { name: 'Integraciones API', included: true },
        { name: 'Multiempresa (3 max)', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'Backup automático', included: true },
        { name: 'RRHH avanzado', included: false },
        { name: 'Consultoría personalizada', included: false },
      ]
    },
    {
      id: 'business',
      name: 'Empresarial',
      description: 'Para empresas establecidas que requieren funcionalidades completas',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      icon: Building2,
      maxUsers: 25,
      maxCompanies: 10,
      storage: '200 GB',
      support: 'Email + Chat + Teléfono',
      integrations: 50,
      features: [
        { name: 'Todo del plan Profesional', included: true },
        { name: 'RRHH completo', included: true },
        { name: 'IA Insights avanzado', included: true },
        { name: 'API completa', included: true },
        { name: 'Multiempresa (10 max)', included: true },
        { name: 'Dashboard ejecutivo', included: true },
        { name: 'Reportes personalizados', included: true },
        { name: 'Integración bancaria', included: true },
        { name: 'Gestión de proyectos', included: true },
        { name: 'Entrenamiento online', included: true },
        { name: 'Soporte 24/7', included: false },
      ]
    },
    {
      id: 'enterprise',
      name: 'Corporativo',
      description: 'Solución completa para grandes corporaciones',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      icon: Crown,
      maxUsers: 100,
      maxCompanies: 999,
      storage: '1 TB',
      support: 'Dedicado 24/7',
      integrations: 999,
      features: [
        { name: 'Todo del plan Empresarial', included: true },
        { name: 'Soporte 24/7 dedicado', included: true },
        { name: 'Consultoría personalizada', included: true },
        { name: 'Implementación asistida', included: true },
        { name: 'SLA garantizado', included: true },
        { name: 'Entrenamiento presencial', included: true },
        { name: 'Desarrollo personalizado', included: true },
        { name: 'Integración empresarial', included: true },
        { name: 'Backup en tiempo real', included: true },
        { name: 'Hosting dedicado', included: true },
        { name: 'Auditoría de seguridad', included: true },
      ]
    },
    {
      id: 'enterprise-plus',
      name: 'Corporativo Plus',
      description: 'Máximo nivel con soporte 24/7 y consultoría personalizada',
      monthlyPrice: 599,
      yearlyPrice: 5990,
      icon: Globe,
      maxUsers: 999,
      maxCompanies: 999,
      storage: 'Ilimitado',
      support: 'Concierge 24/7',
      integrations: 999,
      features: [
        { name: 'Todo del plan Corporativo', included: true },
        { name: 'Desarrollo ilimitado', included: true },
        { name: 'Arquitecto de soluciones', included: true },
        { name: 'Hosting premium', included: true },
        { name: 'CDN global', included: true },
        { name: 'Disaster recovery', included: true },
        { name: 'Compliance avanzado', included: true },
        { name: 'AI/ML personalizado', included: true },
        { name: 'Integración blockchain', included: true },
        { name: 'IoT y sensores', included: true },
        { name: 'Soporte ejecutivo', included: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={fourOneLogo} alt="Four One Solutions" className="h-8 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planes de Suscripción</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Elige el plan perfecto para tu empresa</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pricing Toggle */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700">
            <span className={`px-4 py-2 text-sm font-medium transition-colors ${!isYearly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensual
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`px-4 py-2 text-sm font-medium transition-colors ${isYearly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Ahorras 2 meses
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const savings = isYearly ? ((plan.monthlyPrice * 12) - plan.yearlyPrice) : 0;
            
            return (
              <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                plan.isPopular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:scale-105'
              }`}>
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-2 text-sm font-medium">
                    Más Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.isPopular ? 'pt-12' : 'pt-6'}`}>
                  <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 h-12 flex items-center justify-center text-center">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="py-4">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${price}
                      <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                        /{isYearly ? 'año' : 'mes'}
                      </span>
                    </div>
                    {isYearly && savings > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Ahorras ${savings} al año
                      </p>
                    )}
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 rounded-lg transition-all duration-300">
                    {plan.id === 'enterprise-plus' ? 'Contactar Ventas' : 'Comenzar'}
                  </Button>
                </CardHeader>
                
                <CardContent className="px-6 pb-6">
                  {/* Plan Details */}
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Usuarios:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{plan.maxUsers === 999 ? 'Ilimitado' : plan.maxUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Empresas:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{plan.maxCompanies === 999 ? 'Ilimitado' : plan.maxCompanies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Almacenamiento:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{plan.storage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Soporte:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{plan.support}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Características:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            feature.included 
                              ? 'text-green-500' 
                              : 'text-gray-300 dark:text-gray-600'
                          }`} />
                          <span className={
                            feature.included 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-400 dark:text-gray-600 line-through'
                          }>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-3xl mx-auto border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Necesitas un plan personalizado?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Nuestro equipo puede crear una solución específica para las necesidades de tu empresa.
            </p>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300">
              Contactar Equipo de Ventas
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Four One Solutions. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}