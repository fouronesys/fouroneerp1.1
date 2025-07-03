import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  Package, 
  BarChart3, 
  FileText, 
  Lightbulb,
  Mic,
  MicOff,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Minimize2,
  Maximize2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'suggestion' | 'error';
  metadata?: {
    analysisType?: string;
    confidence?: number;
    actionable?: boolean;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category: string;
  prompt: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar historial de chat
  const { data: chatHistory } = useQuery({
    queryKey: ["/api/ai/chat/history"]
  });

  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      const formattedMessages = chatHistory.slice(-20).flatMap((item: any) => [
        {
          id: `${item.id}_user`,
          content: item.message,
          isUser: true,
          timestamp: new Date(item.createdAt),
          type: 'text' as const
        },
        {
          id: `${item.id}_ai`,
          content: item.response,
          isUser: false,
          timestamp: new Date(item.createdAt),
          type: 'text' as const
        }
      ]);
      setMessages(formattedMessages);
    } else if (messages.length === 0) {
      // Mensaje de bienvenida solo si no hay historial
      setMessages([{
        id: "welcome",
        content: "¡Hola! Soy tu asistente de IA para Four One Solutions. Puedo ayudarte con análisis de ventas, optimización de inventario, gestión de productos y mucho más. ¿En qué puedo ayudarte hoy?",
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  }, [chatHistory]);

  const quickActions: QuickAction[] = [
    {
      id: 'sales-analysis',
      label: 'Analizar Ventas',
      icon: TrendingUp,
      category: 'analytics',
      prompt: 'Analiza las ventas de los últimos 30 días y dame insights sobre tendencias y patrones'
    },
    {
      id: 'inventory-optimization',
      label: 'Optimizar Inventario',
      icon: Package,
      category: 'inventory',
      prompt: 'Revisa mi inventario actual y sugiere optimizaciones para reducir costos y mejorar disponibilidad'
    },
    {
      id: 'product-suggestions',
      label: 'Sugerir Productos',
      icon: Lightbulb,
      category: 'products',
      prompt: 'Basándote en mis ventas actuales, ¿qué nuevos productos debería considerar agregar?'
    },
    {
      id: 'financial-report',
      label: 'Reporte Financiero',
      icon: BarChart3,
      category: 'analytics',
      prompt: 'Genera un resumen financiero de mi empresa con métricas clave y recomendaciones'
    },
    {
      id: 'customer-insights',
      label: 'Insights Clientes',
      icon: User,
      category: 'analytics',
      prompt: 'Analiza el comportamiento de mis clientes y sugiere estrategias para mejorar la retención'
    },
    {
      id: 'help-setup',
      label: 'Configurar Sistema',
      icon: FileText,
      category: 'support',
      prompt: 'Necesito ayuda para configurar mi sistema ERP. ¿Por dónde debo empezar?'
    }
  ];

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'analytics', label: 'Análisis' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'products', label: 'Productos' },
    { id: 'support', label: 'Soporte' }
  ];

  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(`/api/ai/chat`, {
        method: "POST",
        body: { message }
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data && data.response) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + "_ai",
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        }]);
      } else {
        toast({
          title: "Error",
          description: "Respuesta de IA inválida",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      if (error.message.includes("AI service not configured")) {
        toast({
          title: "Servicio de IA no configurado",
          description: "Configure la clave API de Anthropic para usar el asistente de IA.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo procesar tu mensaje. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + "_user",
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputMessage(action.prompt);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado",
      description: "Mensaje copiado al portapapeles",
    });
  };

  const toggleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      if (!isListening) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast({
            title: "Error",
            description: "No se pudo procesar el audio",
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        setIsListening(false);
      }
    } else {
      toast({
        title: "No compatible",
        description: "Tu navegador no soporta reconocimiento de voz",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50' : 'relative'} 
      ${isMinimized && !isMobile ? 'h-14' : isMobile ? 'h-full' : 'h-[700px]'}
      flex flex-col transition-all duration-300
    `}>
      <Card className="h-full flex flex-col">
        <CardHeader className={`
          pb-2 flex-shrink-0 
          ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}
        `}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-blue-600" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-blue-500 animate-pulse" />
              </div>
              <span className={isMobile ? 'text-lg' : 'text-xl'}>
                Asistente de IA
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className={isMobile ? 'hidden' : ''}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <>
            {/* Quick Actions */}
            <div className={`
              ${isMobile ? 'px-4 pb-2' : 'px-6 pb-3'} 
              flex-shrink-0 border-b
            `}>
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
              <div className={`
                grid gap-2 
                ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}
                max-h-32 overflow-y-auto
              `}>
                {filteredActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(action)}
                      className="justify-start gap-2 text-left h-auto py-2 px-3"
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <CardContent className={`
              flex-1 flex flex-col 
              ${isMobile ? 'p-4' : 'p-6'} 
              min-h-0
            `}>
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          flex gap-3 group
                          ${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'}
                          ${message.isUser ? "flex-row-reverse" : "flex-row"}
                        `}
                      >
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${message.isUser
                              ? "bg-blue-600 text-white"
                              : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                            }
                          `}
                        >
                          {message.isUser ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div
                            className={`
                              rounded-lg px-4 py-3 relative
                              ${message.isUser
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border"
                              }
                            `}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            
                            {/* Message actions */}
                            {!message.isUser && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyMessage(message.content)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <p
                              className={`
                                text-xs
                                ${message.isUser
                                  ? "text-right"
                                  : "text-left"
                                } text-gray-500 dark:text-gray-400
                              `}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            
                            {message.type && message.type !== 'text' && (
                              <Badge variant="secondary" className="text-xs">
                                {message.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 border">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex-shrink-0 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Escribe tu pregunta aquí... (Enter para enviar, Shift+Enter para nueva línea)"
                      disabled={chatMutation.isPending}
                      className="min-h-[44px] max-h-32 resize-none pr-12"
                      rows={1}
                    />
                    
                    {/* Voice Input Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVoiceInput}
                      disabled={chatMutation.isPending}
                      className={`
                        absolute right-2 top-2 h-8 w-8 p-0
                        ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}
                      `}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatMutation.isPending}
                    size="icon"
                    className="h-[44px] w-[44px]"
                  >
                    {chatMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {isListening && (
                  <div className="text-center">
                    <Badge variant="secondary" className="animate-pulse">
                      🎤 Escuchando...
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}