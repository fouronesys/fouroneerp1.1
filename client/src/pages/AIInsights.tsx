import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Package, BarChart3, Brain, Lightbulb, Target } from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant-responsive";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIInsights() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const { toast } = useToast();

  const salesAnalysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ai/sales-analysis`, {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      toast({
        title: "Análisis completado",
        description: "El análisis de ventas con IA ha sido generado.",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("AI service not configured")) {
        toast({
          title: "Servicio de IA no configurado",
          description: "Configure la clave API de Anthropic para usar análisis con IA.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar el análisis de ventas.",
          variant: "destructive",
        });
      }
    }
  });

  const inventoryOptimizationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ai/inventory-optimization`, {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      setInventoryData(data);
      toast({
        title: "Optimización completada",
        description: "La optimización de inventario con IA ha sido generada.",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("AI service not configured")) {
        toast({
          title: "Servicio de IA no configurado",
          description: "Configure la clave API de Anthropic para usar optimización con IA.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar la optimización de inventario.",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights con IA</h1>
          <p className="text-muted-foreground">
            Análisis inteligente y recomendaciones para optimizar su negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <Badge variant="secondary">Powered by AI</Badge>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Análisis de Ventas</TabsTrigger>
          <TabsTrigger value="inventory">Optimización de Inventario</TabsTrigger>
          <TabsTrigger value="assistant">Asistente IA</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Análisis Inteligente
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">IA Avanzada</div>
                <p className="text-xs text-muted-foreground">
                  Patrones de venta y predicciones
                </p>
                <Button 
                  className="w-full mt-3" 
                  onClick={() => salesAnalysisMutation.mutate()}
                  disabled={salesAnalysisMutation.isPending}
                >
                  {salesAnalysisMutation.isPending ? "Analizando..." : "Generar Análisis"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tendencias Detectadas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisData ? "Disponible" : "Pendiente"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Basado en datos históricos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recomendaciones IA
                </CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisData?.recommendations?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sugerencias personalizadas
                </p>
              </CardContent>
            </Card>
          </div>

          {analysisData && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Insights Principales</CardTitle>
                  <CardDescription>
                    Análisis de patrones identificados por IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysisData.insights?.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                  <CardDescription>
                    Acciones sugeridas para mejorar el rendimiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysisData.recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {analysisData.trends && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Tendencias Identificadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysisData.trends}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Optimización IA
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Inteligente</div>
                <p className="text-xs text-muted-foreground">
                  Gestión automática de stock
                </p>
                <Button 
                  className="w-full mt-3" 
                  onClick={() => inventoryOptimizationMutation.mutate()}
                  disabled={inventoryOptimizationMutation.isPending}
                >
                  {inventoryOptimizationMutation.isPending ? "Optimizando..." : "Optimizar Inventario"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alertas de Stock
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(inventoryData?.lowStockAlerts?.length || 0) + (inventoryData?.overstockAlerts?.length || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Productos que requieren atención
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Eficiencia
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Optimizada</div>
                <p className="text-xs text-muted-foreground">
                  Con recomendaciones IA
                </p>
              </CardContent>
            </Card>
          </div>

          {inventoryData && (
            <div className="grid gap-4 md:grid-cols-2">
              {inventoryData.lowStockAlerts?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Stock Bajo
                    </CardTitle>
                    <CardDescription>
                      Productos que necesitan reposición
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {inventoryData.lowStockAlerts.map((alert: string, index: number) => (
                      <Badge key={index} variant="destructive" className="mr-2">
                        {alert}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {inventoryData.overstockAlerts?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Exceso de Stock
                    </CardTitle>
                    <CardDescription>
                      Productos con inventario elevado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {inventoryData.overstockAlerts.map((alert: string, index: number) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {alert}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {inventoryData.recommendations?.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recomendaciones de Inventario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {inventoryData.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assistant" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <AIAssistant />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asistente IA</CardTitle>
                  <CardDescription>
                    Su consultor empresarial inteligente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <strong>Capacidades:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Análisis de productos</li>
                      <li>Optimización de ventas</li>
                      <li>Gestión de inventario</li>
                      <li>Configuración del sistema</li>
                      <li>Reportes fiscales</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preguntas Frecuentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground">Ejemplos de consultas:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>"¿Cómo configuro los NCF?"</li>
                      <li>"¿Qué productos venden mejor?"</li>
                      <li>"¿Cómo optimizar mi inventario?"</li>
                      <li>"¿Cómo generar reportes?"</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}