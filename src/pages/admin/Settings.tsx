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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const generalSettingsSchema = z.object({
  company_name: z.string().min(1, "El nombre de la empresa es requerido"),
  default_language: z.string().min(1, "El idioma por defecto es requerido"),
  email_notifications: z.boolean(),
  admin_email: z.string().email("Correo electrónico inválido").optional().or(z.literal('')),
  company_description: z.string().optional(),
});

const chatbotSettingsSchema = z.object({
  admin_welcome: z.string().min(1, "El mensaje de bienvenida para administradores es requerido"),
  public_welcome: z.string().min(1, "El mensaje de bienvenida para usuarios públicos es requerido"),
  admin_responses: z.string().min(1, "Las respuestas para administradores son requeridas"),
  public_responses: z.string().min(1, "Las respuestas para usuarios públicos son requeridas"),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type ChatbotSettingsValues = z.infer<typeof chatbotSettingsSchema>;

interface SystemSettings {
  company_name: string;
  default_language: string;
  email_notifications: boolean;
  admin_email?: string;
  company_description?: string;
}

interface ChatbotResponses {
  welcome: string;
  faq: string[];
}

const Settings = () => {
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [isLoadingChatbot, setIsLoadingChatbot] = useState(false);
  const { toast } = useToast();
  
  // General Settings Form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      company_name: "HRM AI",
      default_language: "es",
      email_notifications: true,
      admin_email: "",
      company_description: "",
    },
  });
  
  // Chatbot Settings Form
  const chatbotForm = useForm<ChatbotSettingsValues>({
    resolver: zodResolver(chatbotSettingsSchema),
    defaultValues: {
      admin_welcome: "¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte a gestionar tu plataforma de reclutamiento?",
      public_welcome: "¡Hola! Soy tu asistente IA. ¿Cómo puedo ayudarte con las ofertas de trabajo?",
      admin_responses: "Para crear una nueva vacante, ve a la sección 'Vacantes' y haz clic en 'Nueva Vacante'.\nLos reportes se actualizan automáticamente cada día a medianoche.",
      public_responses: "Puedes ver todas las vacantes disponibles en la sección 'Vacantes'.\nPara aplicar, haz clic en 'Postularse' en la vacante que te interese.\nNecesitarás subir tu CV en formato PDF, DOC o DOCX.",
    },
  });
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingGeneral(true);
        
        // Fetch system settings
        const { data: systemSettings, error: systemError } = await supabase
          .from('system_settings')
          .select('*')
          .limit(1)
          .single();
          
        if (systemError) throw systemError;
        
        if (systemSettings) {
          // Parse system settings
          let settings: SystemSettings = {
            company_name: "HRM AI",
            default_language: "es",
            email_notifications: true,
            admin_email: "",
            company_description: ""
          };
          
          if (typeof systemSettings.settings === 'object') {
            const settingsObj = systemSettings.settings as Record<string, any>;
            settings = {
              company_name: settingsObj.company_name || "HRM AI",
              default_language: settingsObj.default_language || "es",
              email_notifications: settingsObj.email_notifications !== false,
              admin_email: settingsObj.admin_email || "",
              company_description: settingsObj.company_description || ""
            };
          }
          
          generalForm.reset({
            company_name: settings.company_name,
            default_language: settings.default_language,
            email_notifications: settings.email_notifications,
            admin_email: settings.admin_email || "",
            company_description: settings.company_description || "",
          });
        }
        
        // Fetch chatbot settings
        const { data: chatbotSettings, error: chatbotError } = await supabase
          .from('chatbot_configurations')
          .select('*')
          .limit(1)
          .single();
          
        if (chatbotError) throw chatbotError;
        
        if (chatbotSettings) {
          // Parse admin and public responses
          let adminResponses: ChatbotResponses = {
            welcome: "¡Hola! Soy tu asistente IA.",
            faq: ["Para crear una nueva vacante, ve a la sección 'Vacantes' y haz clic en 'Nueva Vacante'."]
          };
          
          let publicResponses: ChatbotResponses = {
            welcome: "¡Hola! Soy tu asistente IA.",
            faq: ["Puedes ver todas las vacantes disponibles en la sección 'Vacantes'."]
          };
          
          // Parse admin responses if they exist
          if (typeof chatbotSettings.admin_responses === 'object') {
            const adminObj = chatbotSettings.admin_responses as Record<string, any>;
            adminResponses = {
              welcome: adminObj.welcome || "¡Hola! Soy tu asistente IA.",
              faq: Array.isArray(adminObj.faq) ? adminObj.faq : ["Para crear una nueva vacante, ve a la sección 'Vacantes'"]
            };
          }
          
          // Parse public responses if they exist
          if (typeof chatbotSettings.public_responses === 'object') {
            const publicObj = chatbotSettings.public_responses as Record<string, any>;
            publicResponses = {
              welcome: publicObj.welcome || "¡Hola! Soy tu asistente IA.",
              faq: Array.isArray(publicObj.faq) ? publicObj.faq : ["Puedes ver todas las vacantes disponibles en la sección 'Vacantes'."]
            };
          }
          
          chatbotForm.reset({
            admin_welcome: adminResponses.welcome,
            public_welcome: publicResponses.welcome,
            admin_responses: adminResponses.faq.join("\n"),
            public_responses: publicResponses.faq.join("\n"),
          });
        }
        
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las configuraciones.",
        });
      } finally {
        setIsLoadingGeneral(false);
      }
    };
    
    fetchSettings();
  }, [toast, generalForm, chatbotForm]);
  
  const onSubmitGeneral = async (values: GeneralSettingsValues) => {
    setIsLoadingGeneral(true);
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          settings: {
            company_name: values.company_name,
            default_language: values.default_language,
            email_notifications: values.email_notifications,
            admin_email: values.admin_email,
            company_description: values.company_description,
          }
        })
        .eq('id', 1);
        
      if (error) throw error;
      
      toast({
        title: "Configuración actualizada",
        description: "La configuración general ha sido actualizada exitosamente.",
      });
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración general.",
      });
    } finally {
      setIsLoadingGeneral(false);
    }
  };
  
  const onSubmitChatbot = async (values: ChatbotSettingsValues) => {
    setIsLoadingChatbot(true);
    
    try {
      const { error } = await supabase
        .from('chatbot_configurations')
        .update({
          admin_responses: {
            welcome: values.admin_welcome,
            faq: values.admin_responses.split('\n').filter(line => line.trim()),
          },
          public_responses: {
            welcome: values.public_welcome,
            faq: values.public_responses.split('\n').filter(line => line.trim()),
          }
        })
        .eq('id', 1);
        
      if (error) throw error;
      
      toast({
        title: "Configuración actualizada",
        description: "La configuración del chatbot ha sido actualizada exitosamente.",
      });
      
    } catch (error) {
      console.error('Error updating chatbot settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración del chatbot.",
      });
    } finally {
      setIsLoadingChatbot(false);
    }
  };
  
  return (
    <div>
      <h1 className="page-title mb-6">Configuración</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configura los ajustes generales de tu plataforma de reclutamiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="HRM AI" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este nombre aparecerá en toda la plataforma.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="company_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de la Empresa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción breve de tu empresa..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Esta descripción aparecerá en la página principal.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="default_language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma por Defecto</FormLabel>
                          <FormControl>
                            <Input placeholder="es" {...field} />
                          </FormControl>
                          <FormDescription>
                            Código de idioma (es, en, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="admin_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Administrativo</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Correo para notificaciones administrativas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={generalForm.control}
                    name="email_notifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notificaciones por Correo
                          </FormLabel>
                          <FormDescription>
                            Recibe notificaciones por correo cuando haya nuevos candidatos.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                      disabled={isLoadingGeneral}
                    >
                      {isLoadingGeneral ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : "Guardar Configuración"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chatbot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Chatbot</CardTitle>
              <CardDescription>
                Personaliza los mensajes y respuestas del asistente IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...chatbotForm}>
                <form onSubmit={chatbotForm.handleSubmit(onSubmitChatbot)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configuración para Administradores</h3>
                    
                    <FormField
                      control={chatbotForm.control}
                      name="admin_welcome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensaje de Bienvenida</FormLabel>
                          <FormControl>
                            <Input placeholder="Hola administrador..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Mensaje que verán los administradores al abrir el chatbot.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={chatbotForm.control}
                      name="admin_responses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Respuestas Predefinidas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Escribe cada respuesta en una línea nueva..." 
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Escribe cada respuesta en una línea nueva. Estas se usarán para contestar preguntas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Configuración para Usuarios Públicos</h3>
                    
                    <FormField
                      control={chatbotForm.control}
                      name="public_welcome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensaje de Bienvenida</FormLabel>
                          <FormControl>
                            <Input placeholder="Hola candidato..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Mensaje que verán los usuarios públicos al abrir el chatbot.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={chatbotForm.control}
                      name="public_responses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Respuestas Predefinidas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Escribe cada respuesta en una línea nueva..." 
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Escribe cada respuesta en una línea nueva. Estas se usarán para contestar preguntas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                      disabled={isLoadingChatbot}
                    >
                      {isLoadingChatbot ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : "Guardar Configuración"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
