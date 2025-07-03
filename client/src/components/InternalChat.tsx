import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Users,
  Plus,
  Search,
  Hash,
  Bell,
  BellOff,
  Settings,
  UserPlus,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Clock,
  CheckCheck,
  Check,
  Circle,
  Minimize2,
  Maximize2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  memberCount: number;
  unreadCount: number;
  lastMessage?: ChatMessage;
  isActive: boolean;
  members: string[];
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export function InternalChat() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [activeTab, setActiveTab] = useState('channels');
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get chat channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<ChatChannel[]>({
    queryKey: ["/api/chat/channels"],
  });

  // Get online users
  const { data: onlineUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/chat/users/online"],
  });

  // Get messages for selected channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedChannel],
    enabled: !!selectedChannel,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ channelId, content, messageType = 'text', fileUrl, fileName }: {
      channelId: string;
      content: string;
      messageType?: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      const response = await apiRequest(`/api/chat/channels/${channelId}/messages`, {
        method: "POST",
        body: { content, messageType, fileUrl, fileName }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChannel] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async ({ name, type, description }: {
      name: string;
      type: 'public' | 'private';
      description?: string;
    }) => {
      const response = await apiRequest("/api/chat/channels", {
        method: "POST",
        body: { name, type, description }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/channels"] });
      setShowCreateChannel(false);
      setNewChannelName("");
      toast({
        title: "Canal creado",
        description: "El canal se ha creado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el canal",
        variant: "destructive",
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return;

    sendMessageMutation.mutate({
      channelId: selectedChannel,
      content: newMessage,
    });
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;

    createChannelMutation.mutate({
      name: newChannelName,
      type: newChannelType,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;

    // Here you would upload the file to your server and get the URL
    // For now, we'll simulate it
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiRequest("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await response.json();

      sendMessageMutation.mutate({
        channelId: selectedChannel,
        content: `Archivo compartido: ${file.name}`,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: url,
        fileName: file.name,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    }
  };

  const filteredChannels = channels.filter((channel: ChatChannel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChannelData = channels.find((c: ChatChannel) => c.id === selectedChannel);

  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50' : 'relative'} 
      ${isMinimized && !isMobile ? 'h-14' : isMobile ? 'h-full' : 'h-[700px]'}
      flex transition-all duration-300
    `}>
      <Card className="h-full flex w-full overflow-hidden">
        {/* Sidebar */}
        {(!isMobile || !selectedChannel) && (
          <div className={`
            ${isMobile ? 'w-full' : 'w-80'} 
            border-r flex flex-col
          `}>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span className={isMobile ? 'text-lg' : 'text-xl'}>
                    Chat Interno
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
                {/* Search and Create */}
                <div className="p-4 border-b space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar canales..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Canal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Canal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Nombre del canal"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                        />
                        <Select value={newChannelType} onValueChange={(value: 'public' | 'private') => setNewChannelType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleCreateChannel}
                          disabled={!newChannelName.trim() || createChannelMutation.isPending}
                        >
                          Crear Canal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="mx-4 grid w-auto grid-cols-2">
                    <TabsTrigger value="channels">Canales</TabsTrigger>
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="channels" className="flex-1 m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {filteredChannels.map((channel: ChatChannel) => (
                          <div
                            key={channel.id}
                            onClick={() => {
                              setSelectedChannel(channel.id);
                              if (isMobile) setActiveTab('messages');
                            }}
                            className={`
                              p-3 rounded-lg cursor-pointer transition-colors
                              ${selectedChannel === channel.id 
                                ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {channel.type === 'public' ? (
                                  <Hash className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate">
                                    {channel.name}
                                  </span>
                                  {channel.unreadCount > 0 && (
                                    <Badge variant="default" className="ml-2 text-xs">
                                      {channel.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                {channel.lastMessage && (
                                  <p className="text-xs text-gray-500 truncate mt-1">
                                    {channel.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="users" className="flex-1 m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {onlineUsers.map((user: User) => (
                          <div
                            key={user.id}
                            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>
                                    {user.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {user.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{user.username}</p>
                                <p className="text-xs text-gray-500">
                                  {user.isOnline ? 'En línea' : `Visto ${formatTime(user.lastSeen || new Date())}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        )}

        {/* Chat Area */}
        {selectedChannel && (!isMobile || selectedChannel) && (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedChannel(null)}
                  >
                    ←
                  </Button>
                )}
                <div>
                  <h3 className="font-semibold">
                    {selectedChannelData?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedChannelData?.memberCount} miembros
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message: ChatMessage) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.userAvatar} />
                      <AvatarFallback>
                        {message.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      {message.messageType === 'text' && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      
                      {message.messageType === 'image' && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <img 
                            src={message.fileUrl} 
                            alt={message.fileName}
                            className="max-w-xs rounded-lg"
                          />
                        </div>
                      )}
                      
                      {message.messageType === 'file' && (
                        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm truncate">{message.fileName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}