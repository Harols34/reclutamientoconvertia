
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Trash, Plus, Terminal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const chatbotSchema = z.object({
  admin_welcome: z.string().min(1, "El mensaje de bienvenida es requerido"),
  public_welcome: z.string().min(1, "El mensaje de bienvenida es requerido"),
  admin_faq: z.array(z.object({
    question: z.string().min(1, "La pregunta es requerida"),
    answer: z.string().min(1, "La respuesta es requerida"),
  })),
  public_faq: z.array(z.object({
    question: z.string().min(1, "La pregunta es requerida"),
    answer: z.string().min(1, "La respuesta es requerida"),
  })),
});

type ChatbotFormValues = z.infer<typeof chatbotSchema>;

interface FAQ {
  question: string;
  answer: string;
}

interface ChatbotConfig {
  id: number;
  admin_responses: {
    welcome: string;
    faq: string[];
    faq_questions?: FAQ[];
  };
  public_responses: {
    welcome: string;
    faq: string[];
    faq_questions?: FAQ[];
  };
}

const ChatbotManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const defaultValues: ChatbotFormValues = {
    admin_welcome: "¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte a gestionar tu plataforma de reclutamiento?",
    public_welcome: "¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte con las ofertas de trabajo?",
    admin_faq: [{ question: "", answer: "" }],
    public_faq: [{ question: "", answer: "" }],
  };

  const form = useForm<ChatbotFormValues>({
    resolver: zodResolver(chatbotSchema),
    defaultValues,
  });
  
  // Fetch chatbot configuration
  useEffect(() => {
    const fetchChatbotConfig = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('chatbot_configurations')
          .select('*')
          .limit(1)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const config = data as unknown as ChatbotConfig;
          
          // Parse admin responses
          let adminFaq: FAQ[] = [];
          if (Array.isArray(config.admin_responses.faq)) {
            adminFaq = config.admin_responses.faq.map((response) => ({
              question: `Pregunta ${adminFaq.length + 1}`,
              answer: response
            }));
          }
          
          // Parse public responses
          let publicFaq: FAQ[] = [];
          if (Array.isArray(config.public_responses.faq)) {
            publicFaq = config.public_responses.faq.map((response) => ({
              question: `Pregunta ${publicFaq.length + 1}`,
              answer: response
            }));
          }
          
          // Update form values
          form.reset({
            admin_welcome: config.admin_responses.welcome || defaultValues.admin_welcome,
            public_welcome: config.public_responses.welcome || defaultValues.public_welcome,
            admin_faq: adminFaq.length > 0 ? adminFaq : [{ question: "", answer: "" }],
            public_faq: publicFaq.length > 0 ? publicFaq : [{ question: "", answer: "" }],
          });
        }
      } catch (error) {
        console.error('Error fetching chatbot config:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la configuración del chatbot.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatbotConfig();
  }, [toast]);
  
  const onSubmit = async (values: ChatbotFormValues) => {
    try {
      setSaving(true);
      
      // Filter out empty FAQ items
      const adminFaq = values.admin_faq
        .filter(faq => faq.question.trim() && faq.answer.trim())
        .map(faq => faq.answer);
        
      const publicFaq = values.public_faq
        .filter(faq => faq.question.trim() && faq.answer.trim())
        .map(faq => faq.answer);
      
      const { error } = await supabase
        .from('chatbot_configurations')
        .update({
          admin_responses: {
            welcome: values.admin_welcome,
            faq: adminFaq,
          },
          public_responses: {
            welcome: values.public_welcome,
            faq: publicFaq,
          }
        })
        .eq('id', 1);
        
      if (error) throw error;
      
      toast({
        title: "Configuración actualizada",
        description: "La configuración del chatbot ha sido actualizada exitosamente.",
      });
    } catch (error) {
      console.error('Error updating chatbot config:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración del chatbot.",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const addAdminFaq = () => {
    const currentFaq = form.getValues('admin_faq');
    form.setValue('admin_faq', [...currentFaq, { question: "", answer: "" }]);
  };
  
  const removeAdminFaq = (index: number) => {
    const currentFaq = form.getValues('admin_faq');
    if (currentFaq.length > 1) {
      form.setValue('admin_faq', currentFaq.filter((_, i) => i !== index));
    }
  };
  
  const addPublicFaq = () => {
    const currentFaq = form.getValues('public_faq');
    form.setValue('public_faq', [...currentFaq, { question: "", answer: "" }]);
  };
  
  const removePublicFaq = (index: number) => {
    const currentFaq = form.getValues('public_faq');
    if (currentFaq.length > 1) {
      form.setValue('public_faq', currentFaq.filter((_, i) => i !== index));
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="page-title mb-6">Configuración del Chatbot</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="admin" className="space-y-6">
            <TabsList>
              <TabsTrigger value="admin">Administradores</TabsTrigger>
              <TabsTrigger value="public">Candidatos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <CardTitle>Chatbot para Administradores</CardTitle>
                  </div>
                  <CardDescription>
                    Configura los mensajes y respuestas del chatbot para los administradores del sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="admin_welcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje de Bienvenida</FormLabel>
                        <FormControl>
                          <Input placeholder="¡Hola! Soy tu asistente IA..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Este mensaje se mostrará cuando un administrador abra el chatbot.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Preguntas y Respuestas</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addAdminFaq}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir
                      </Button>
                    </div>
                    
                    {form.watch('admin_faq').map((_, index) => (
                      <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50 relative">
                        {form.watch('admin_faq').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeAdminFaq(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <FormField
                          control={form.control}
                          name={`admin_faq.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Pregunta {index + 1}</FormLabel>
                              <FormControl>
                                <Input placeholder="¿Cómo crear una nueva vacante?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`admin_faq.${index}.answer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Respuesta {index + 1}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Para crear una nueva vacante, ve a la sección..." 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="public" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    <CardTitle>Chatbot para Candidatos</CardTitle>
                  </div>
                  <CardDescription>
                    Configura los mensajes y respuestas del chatbot para los usuarios públicos y candidatos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="public_welcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje de Bienvenida</FormLabel>
                        <FormControl>
                          <Input placeholder="¡Hola! Soy tu asistente IA..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Este mensaje se mostrará cuando un candidato abra el chatbot.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Preguntas y Respuestas</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addPublicFaq}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir
                      </Button>
                    </div>
                    
                    {form.watch('public_faq').map((_, index) => (
                      <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50 relative">
                        {form.watch('public_faq').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removePublicFaq(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <FormField
                          control={form.control}
                          name={`public_faq.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel>Pregunta {index + 1}</FormLabel>
                              <FormControl>
                                <Input placeholder="¿Cómo aplicar a una vacante?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`public_faq.${index}.answer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Respuesta {index + 1}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Para aplicar a una vacante, haz clic en..." 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6">
            <Button 
              type="submit" 
              className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : "Guardar Configuración"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ChatbotManager;
