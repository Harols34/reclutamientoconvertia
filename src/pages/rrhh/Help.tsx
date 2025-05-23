
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Star, ThumbsUp, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const faqs = [
    {
      id: 1,
      question: "¿Cómo puedo cambiar mi contraseña?",
      answer: "Para cambiar tu contraseña, dirígete a la sección de Configuración > General > Seguridad y selecciona la opción 'Cambiar contraseña'. Deberás introducir tu contraseña actual y después la nueva contraseña dos veces para confirmarla.",
      category: "cuenta"
    },
    {
      id: 2,
      question: "¿Cómo solicito días libres o vacaciones?",
      answer: "Para solicitar días libres o vacaciones, ve a la sección de Gestión del Tiempo > Solicitudes > Nueva solicitud. Selecciona el tipo de ausencia, las fechas y añade cualquier comentario necesario. Tu supervisor recibirá una notificación y podrá aprobar o rechazar la solicitud.",
      category: "gestión del tiempo"
    },
    {
      id: 3,
      question: "¿Cómo puedo compartir un documento con mi equipo?",
      answer: "Para compartir un documento, navega a la sección de Documentación, selecciona el archivo que quieres compartir y haz clic en el botón 'Compartir'. Podrás elegir los usuarios o equipos con los que quieres compartirlo y establecer permisos de lectura o edición.",
      category: "documentos"
    },
    {
      id: 4,
      question: "¿Cómo registrar horas extras de trabajo?",
      answer: "Para registrar horas extras, accede a Gestión del Tiempo > Registro de horas > Nueva entrada. Selecciona la fecha, indica las horas trabajadas fuera de tu horario habitual y añade una justificación. Tu supervisor recibirá una notificación para su aprobación.",
      category: "gestión del tiempo"
    },
    {
      id: 5,
      question: "¿Cómo actualizar mi información personal?",
      answer: "Para actualizar tu información personal, dirígete a Perfil > Editar perfil. Allí podrás modificar tus datos personales, información de contacto y preferencias de la plataforma. Recuerda guardar los cambios al finalizar.",
      category: "cuenta"
    },
  ];

  // Filter FAQs based on search query
  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendSupport = () => {
    if (supportMessage.trim() === "") {
      toast.error("Por favor escribe un mensaje");
      return;
    }
    
    toast.success("Mensaje enviado al soporte. Te responderemos lo antes posible.");
    setSupportMessage("");
    setOpenDialog(null);
  };

  const handleSendFeedback = () => {
    if (feedbackMessage.trim() === "") {
      toast.error("Por favor comparte tu opinión");
      return;
    }
    
    toast.success("¡Gracias por compartir tu opinión!");
    setFeedbackMessage("");
    setOpenDialog(null);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ayuda y Comentarios</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar with actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Centro de ayuda</CardTitle>
                <CardDescription>Encuentre respuestas o contacte con soporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={openDialog === "help"} onOpenChange={() => setOpenDialog(openDialog === "help" ? null : "help")}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="default">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contactar soporte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contactar con soporte técnico</DialogTitle>
                      <DialogDescription>
                        Describe el problema o duda que tengas y nuestro equipo te responderá lo antes posible.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Asunto" />
                      <Textarea 
                        placeholder="Describe tu consulta con el mayor detalle posible..." 
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                      <Button onClick={handleSendSupport}>Enviar mensaje</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={openDialog === "feedback"} onOpenChange={() => setOpenDialog(openDialog === "feedback" ? null : "feedback")}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Compartir opinión
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Comparte tu opinión</DialogTitle>
                      <DialogDescription>
                        Tus comentarios nos ayudan a mejorar la plataforma. ¿Qué te ha parecido tu experiencia?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex justify-center space-x-2 py-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button key={rating} variant="outline" size="icon" className="h-10 w-10">
                            <Star className={`h-5 w-5 ${rating <= 3 ? 'text-gray-400' : 'text-yellow-400 fill-yellow-400'}`} />
                          </Button>
                        ))}
                      </div>
                      <Textarea 
                        placeholder="¿Qué podemos mejorar? Comparte tus ideas y sugerencias..." 
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                      <Button onClick={handleSendFeedback}>Enviar opinión</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button className="w-full" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Ver novedades
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Categorías populares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["Cuenta", "Gestión del tiempo", "Documentos", "Organización", "Permisos"].map((category) => (
                  <Badge 
                    key={category} 
                    variant="outline" 
                    className="mr-2 mb-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => setSearchQuery(category.toLowerCase())}
                  >
                    {category}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Preguntas frecuentes</CardTitle>
                <CardDescription>
                  Encuentra respuestas a las preguntas más comunes
                </CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Buscar en las preguntas frecuentes..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="grid w-full max-w-md grid-cols-4">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="account">Cuenta</TabsTrigger>
                    <TabsTrigger value="time">Tiempo</TabsTrigger>
                    <TabsTrigger value="docs">Documentos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-6">
                    <div className="divide-y">
                      {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq) => (
                          <div key={faq.id} className="py-4">
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p>No se encontraron resultados para "{searchQuery}"</p>
                          <p className="text-sm mt-1">Intenta con otros términos o contacta con soporte</p>
                          <Button 
                            variant="link" 
                            className="mt-2"
                            onClick={() => setOpenDialog("help")}
                          >
                            Contactar soporte
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="account" className="mt-6">
                    <div className="divide-y">
                      {filteredFAQs
                        .filter(faq => faq.category.toLowerCase() === "cuenta")
                        .map((faq) => (
                          <div key={faq.id} className="py-4">
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="time" className="mt-6">
                    <div className="divide-y">
                      {filteredFAQs
                        .filter(faq => faq.category.toLowerCase() === "gestión del tiempo")
                        .map((faq) => (
                          <div key={faq.id} className="py-4">
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="docs" className="mt-6">
                    <div className="divide-y">
                      {filteredFAQs
                        .filter(faq => faq.category.toLowerCase() === "documentos")
                        .map((faq) => (
                          <div key={faq.id} className="py-4">
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
