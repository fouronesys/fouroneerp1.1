import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, User, Send, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "¡Hola! Soy tu asistente de IA para Four One Solutions. Puedo ayudarte con gestión de productos, análisis de ventas, configuración del sistema y más. ¿En qué puedo ayudarte hoy?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(`/api/ai/chat`, {
        method: "POST",
        body: { message },
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("AI Response received:", data);
      if (data && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_ai",
            content: data.response,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } else {
        console.error("Invalid response format:", data);
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
          description:
            "Configure la clave API de Anthropic para usar el asistente de IA.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo procesar tu mensaje. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString() + "_user",
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputMessage.trim());
    setInputMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <Card className="h-[600px] max-h-[80vh] flex flex-col w-full">
      <CardHeader className="pb-3 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <Bot className="h-5 w-5 text-blue-600" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
          </div>
          Asistente de IA
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${
                  message.isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500"
                  }`}
                >
                  {message.isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.isUser
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words m-0">
                      {message.content}
                    </p>
                  </div>
                  <p
                    className={`text-xs mt-2 opacity-70 ${
                      message.isUser
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex max-w-[75%] gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje aquí..."
                className="min-h-[44px] max-h-[120px] resize-none pr-12 text-sm"
                disabled={chatMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              size="icon"
              className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
