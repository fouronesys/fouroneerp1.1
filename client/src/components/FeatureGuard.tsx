import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { hasFeature, getBlockedMessage, currentPlan } = useSubscription();
  const isMobile = useIsMobile();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="w-full">
      <Card className="border-dashed border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit">
            <Lock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-orange-800 dark:text-orange-200">
            Funcionalidad Bloqueada
          </CardTitle>
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-600">
              Plan actual: {currentPlan === "trial" ? "Prueba" : currentPlan === "monthly" ? "Mensual" : "Anual"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {getBlockedMessage(feature)}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Plan Mensual</h3>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                Acceso a módulos esenciales
              </p>
              <Button 
                size="sm" 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Actualizar
              </Button>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-purple-800 dark:text-purple-200">Plan Anual</h3>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                Acceso completo + descuento
              </p>
              <Button 
                size="sm" 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Actualizar
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-orange-200 dark:border-orange-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ¿Necesitas ayuda? Contacta a nuestro equipo de soporte
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SubscriptionAlert() {
  const { currentPlan, daysUntilExpiry, isSubscriptionExpired } = useSubscription();
  const isMobile = useIsMobile();

  if (currentPlan === "annual" && !isSubscriptionExpired && daysUntilExpiry > 30) {
    return null; // No mostrar alerta si está en plan anual y tiene más de 30 días
  }

  if (isSubscriptionExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-200 text-sm sm:text-base">
              Suscripción Expirada
            </h3>
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
              Tu suscripción ha expirado. Renueva para continuar usando todas las funcionalidades.
            </p>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">
            Renovar
          </Button>
        </div>
      </div>
    );
  }

  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm sm:text-base">
              Suscripción por Vencer
            </h3>
            <p className="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
              Tu suscripción expira en {daysUntilExpiry} día{daysUntilExpiry > 1 ? 's' : ''}. Renueva ahora para evitar interrupciones.
            </p>
          </div>
          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-xs sm:text-sm">
            Renovar
          </Button>
        </div>
      </div>
    );
  }

  return null;
}