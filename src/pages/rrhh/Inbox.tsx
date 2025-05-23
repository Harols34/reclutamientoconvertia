
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Paperclip, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Inbox() {
  const mockMessages = [
    {
      id: 1,
      from: "Ana Martínez",
      subject: "Actualización del proyecto",
      preview: "Te comparto los últimos cambios en el proyecto...",
      date: "Hoy, 10:30",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: 2,
      from: "Carlos López",
      subject: "Reunión semanal",
      preview: "Recordatorio de nuestra reunión semanal...",
      date: "Hoy, 09:15",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    {
      id: 3,
      from: "Elena González",
      subject: "Documentos pendientes",
      preview: "Necesitamos completar los siguientes documentos...",
      date: "Ayer, 18:30",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    {
      id: 4,
      from: "Roberto Sánchez",
      subject: "Revisión de código",
      preview: "He revisado el código y tengo algunas observaciones...",
      date: "Ayer, 14:20",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 5,
      from: "Laura Castro",
      subject: "Propuesta de diseño",
      preview: "Adjunto la nueva propuesta de diseño para el proyecto...",
      date: "Mar 10",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?img=16",
      hasAttachment: true,
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Bandeja de Entrada</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-medium">Mensajes</CardTitle>
                  <CardDescription>
                    Gestiona tus comunicaciones internas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nuevo mensaje
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="inbox" className="w-full">
                <div className="border-b px-6 py-2">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="inbox">Recibidos</TabsTrigger>
                    <TabsTrigger value="sent">Enviados</TabsTrigger>
                    <TabsTrigger value="archived">Archivados</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="relative px-6 py-3 border-b">
                  <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Buscar mensajes..." 
                    className="pl-10 max-w-md"
                  />
                </div>
                
                <TabsContent value="inbox" className="m-0">
                  <ul>
                    {mockMessages.map((message) => (
                      <li 
                        key={message.id}
                        className={`border-b last:border-0 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !message.isRead ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src={message.avatar} alt={message.from} />
                            <AvatarFallback>{message.from.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className={`text-sm font-medium truncate ${!message.isRead ? "font-bold" : ""}`}>
                                  {message.from}
                                </h3>
                                <p className={`text-sm text-gray-800 truncate ${!message.isRead ? "font-semibold" : ""}`}>
                                  {message.subject}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{message.preview}</p>
                              </div>
                              <div className="ml-4 flex flex-col items-end">
                                <p className="text-xs text-gray-500">{message.date}</p>
                                <div className="flex mt-1">
                                  {!message.isRead && (
                                    <Badge className="bg-blue-500 h-2 w-2 rounded-full p-0" />
                                  )}
                                  {message.hasAttachment && (
                                    <Paperclip className="h-3 w-3 ml-2 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="sent" className="m-0 p-6 text-center text-gray-500">
                  <p>No hay mensajes enviados recientes</p>
                </TabsContent>
                
                <TabsContent value="archived" className="m-0 p-6 text-center text-gray-500">
                  <p>No hay mensajes archivados</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
