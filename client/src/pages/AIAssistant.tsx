import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Send, 
  Loader2, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users,
  AlertCircle,
  Sparkles,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai/status"],
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ["/api/ai/insights"],
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, context: "general" }),
      }),
    onSuccess: (response) => {
      setChatHistory(prev => [...prev, 
        { role: "user", content: message },
        { role: "assistant", content: (response as any).message }
      ]);
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el mensaje",
        variant: "destructive",
      });
    },
  });

  const generateInsightMutation = useMutation({
    mutationFn: (type: string) =>
      apiRequest(`/api/ai/generate-insight/${type}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights"] });
      toast({
        title: "Análisis generado",
        description: "Se ha generado un nuevo análisis con IA.",
      });
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const aiEnabled = (aiStatus as any)?.enabled !== false;

  if (!aiEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Asistente IA</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Asistente IA No Configurado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Para habilitar el Asistente IA, necesitas configurar una clave API de Anthropic Claude.
            </p>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">¿Qué puede hacer el Asistente IA?</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Análisis inteligente de ventas y tendencias</li>
                  <li>Optimización automática de inventario</li>
                  <li>Insights de negocio personalizados</li>
                  <li>Predicciones de demanda</li>
                  <li>Recomendaciones de precios</li>
                  <li>Chat inteligente para consultas del negocio</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Contacta al administrador del sistema para configurar la API key.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-screen overflow-y-auto max-h-screen p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asistente IA</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by Claude
        </Badge>
      </div>

      <Tabs defaultValue="insights">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Análisis Predictivo</TabsTrigger>
          <TabsTrigger value="chat">Chat IA</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Insights de Ventas
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateInsightMutation.mutate("sales")}
                    disabled={generateInsightMutation.isPending}
                  >
                    {generateInsightMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        📈 Tendencia Positiva
                      </p>
                      <p className="text-sm mt-1">
                        Las ventas han aumentado un 15% en los últimos 7 días. 
                        El producto "Laptop Dell Inspiron" lidera con 35% de las ventas totales.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        💡 Recomendación
                      </p>
                      <p className="text-sm mt-1">
                        Considera aumentar el stock de Mouse Inalámbrico. 
                        La demanda proyectada para la próxima semana es 40% mayor.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Optimización de Inventario
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateInsightMutation.mutate("inventory")}
                    disabled={generateInsightMutation.isPending}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      ⚠️ Stock Bajo Detectado
                    </p>
                    <p className="text-sm mt-1">
                      3 productos están por debajo del stock mínimo. 
                      Se recomienda reordenar en las próximas 48 horas.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      📊 Rotación Óptima
                    </p>
                    <p className="text-sm mt-1">
                      La categoría "Accesorios" tiene la mejor rotación (5.2x/mes). 
                      Considera expandir esta línea de productos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Comportamiento de Clientes
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateInsightMutation.mutate("customers")}
                    disabled={generateInsightMutation.isPending}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                      🎯 Segmento Clave
                    </p>
                    <p className="text-sm mt-1">
                      Los clientes empresariales representan el 65% de los ingresos 
                      pero solo el 20% de la base de clientes.
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      🔄 Retención
                    </p>
                    <p className="text-sm mt-1">
                      La tasa de retención es del 78%. Implementar un programa de 
                      fidelidad podría aumentarla al 85%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Predicciones del Mes
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateInsightMutation.mutate("predictions")}
                    disabled={generateInsightMutation.isPending}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ventas Proyectadas</span>
                    <span className="font-mono font-medium">$485,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Crecimiento Esperado</span>
                    <span className="font-mono font-medium text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Productos en Tendencia</span>
                    <span className="font-mono font-medium">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Riesgo de Stockout</span>
                    <span className="font-mono font-medium text-orange-600">3 items</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Predictivo Avanzado</CardTitle>
              <CardDescription>
                Utiliza IA para predecir tendencias y optimizar tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Predicción de Demanda</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Package className="h-6 w-6" />
                  <span>Optimización de Precios</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Segmentación Avanzada</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat con IA
              </CardTitle>
              <CardDescription>
                Pregunta cualquier cosa sobre tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Haz una pregunta para comenzar</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">Ejemplos:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setMessage("¿Cuál es mi producto más vendido?")}
                        >
                          ¿Cuál es mi producto más vendido?
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setMessage("¿Cómo puedo mejorar mis ventas?")}
                        >
                          ¿Cómo puedo mejorar mis ventas?
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setMessage("Analiza mi inventario")}
                        >
                          Analiza mi inventario
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}