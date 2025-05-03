
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ChatbotInterface from '@/components/chatbot/ChatbotInterface';

const ChatbotManager = () => {
  const { toast } = useToast();
  const [publicPrompts, setPublicPrompts] = useState<string>('');
  const [adminPrompts, setAdminPrompts] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);

  useEffect(() => {
    const fetchChatbotConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_configurations')
          .select('*')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setConfigId(data.id);
          setPublicPrompts(JSON.stringify(data.public_responses, null, 2));
          setAdminPrompts(JSON.stringify(data.admin_responses, null, 2));
        }
      } catch (err) {
        console.error('Error fetching chatbot config:', err);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones del chatbot.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatbotConfig();
  }, [toast]);

  const handleSave = async (type: 'public' | 'admin') => {
    try {
      setSaving(true);
      
      let updateData = {};
      let jsonContent = {};
      
      // Validate JSON
      try {
        if (type === 'public') {
          jsonContent = JSON.parse(publicPrompts);
          updateData = { public_responses: jsonContent };
        } else {
          jsonContent = JSON.parse(adminPrompts);
          updateData = { admin_responses: jsonContent };
        }
      } catch (err) {
        toast({
          title: "Error de formato",
          description: "El contenido no es un JSON válido. Por favor revisa el formato.",
          variant: "destructive"
        });
        return;
      }
      
      // If we have a configId, update the record; otherwise insert a new one
      let operation;
      if (configId) {
        operation = supabase
          .from('chatbot_configurations')
          .update(updateData)
          .eq('id', configId);
      } else {
        operation = supabase
          .from('chatbot_configurations')
          .insert([{ id: 1, ...updateData }]);
      }
      
      const { error } = await operation;
      
      if (error) throw error;
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente."
      });
    } catch (err) {
      console.error('Error saving chatbot config:', err);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-hrm-dark-cyan" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title mb-6">Gestión del Chatbot</h1>
      
      <Tabs defaultValue="public">
        <TabsList className="mb-4">
          <TabsTrigger value="public">Chatbot Público</TabsTrigger>
          <TabsTrigger value="admin">Chatbot Administración</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>
        
        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Chatbot Público</CardTitle>
              <CardDescription>
                Define la información que el chatbot utilizará para responder a los usuarios públicos.
                Ingresa los datos en formato JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='{\n  "company": "CONVERT-IA RECLUTAMIENTO",\n  "services": ["Reclutamiento", "Selección de personal"],\n  "contact": "contacto@convert-ia.com"\n}'
                className="min-h-[300px] font-mono"
                value={publicPrompts}
                onChange={(e) => setPublicPrompts(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                onClick={() => handleSave('public')}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Chatbot de Administración</CardTitle>
              <CardDescription>
                Define la información que el chatbot utilizará para responder a los administradores.
                Ingresa los datos en formato JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='{\n  "admin_roles": ["Recursos Humanos", "Reclutador"],\n  "processes": ["Revisión de CV", "Entrevistas", "Evaluaciones"],\n  "departments": ["Tecnología", "Marketing", "Ventas"]\n}'
                className="min-h-[300px] font-mono"
                value={adminPrompts}
                onChange={(e) => setAdminPrompts(e.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                onClick={() => handleSave('admin')}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="relative h-[500px]">
              <CardHeader>
                <CardTitle>Vista previa chatbot público</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative">
                <div className="absolute inset-0 border rounded-md p-4 overflow-hidden">
                  <ChatbotInterface userType="public" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative h-[500px]">
              <CardHeader>
                <CardTitle>Vista previa chatbot administración</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] relative">
                <div className="absolute inset-0 border rounded-md p-4 overflow-hidden">
                  <ChatbotInterface userType="admin" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotManager;
