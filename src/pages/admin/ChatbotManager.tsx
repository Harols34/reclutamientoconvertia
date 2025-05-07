
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ChatbotInterface from '@/components/chatbot/ChatbotInterface';
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KnowledgeItem {
  id: string;
  topic: string;
  question: string;
  answer: string;
  created_at: string;
}

const ChatbotManager = () => {
  const { toast } = useToast();
  const [publicPrompts, setPublicPrompts] = useState<string>('');
  const [adminPrompts, setAdminPrompts] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState<KnowledgeItem | null>(null);
  
  // New knowledge form state
  const [topic, setTopic] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [uniqueTopics, setUniqueTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch chatbot config
        const { data: configData, error: configError } = await supabase
          .from('chatbot_configurations')
          .select('*')
          .single();
        
        if (configError && configError.code !== 'PGRST116') {
          throw configError;
        }
        
        if (configData) {
          setConfigId(configData.id);
          setPublicPrompts(JSON.stringify(configData.public_responses, null, 2));
          setAdminPrompts(JSON.stringify(configData.admin_responses, null, 2));
        }
        
        // Fetch knowledge base data
        const { data: knowledgeData, error: knowledgeError } = await supabase
          .from('chatbot_knowledge')
          .select('*')
          .order('topic', { ascending: true });
          
        if (knowledgeError) throw knowledgeError;
        
        if (knowledgeData) {
          setKnowledge(knowledgeData);
          
          // Extract unique topics for filtering
          const topics = Array.from(new Set(knowledgeData.map((item: KnowledgeItem) => item.topic)));
          setUniqueTopics(topics);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones del chatbot.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  const handleSaveKnowledge = async () => {
    try {
      setSaving(true);
      
      if (!topic || !question || !answer) {
        toast({
          title: "Campos incompletos",
          description: "Todos los campos son obligatorios para crear un nuevo conocimiento.",
          variant: "destructive"
        });
        return;
      }
      
      const knowledgeData = {
        topic,
        question,
        answer
      };
      
      let operation;
      
      if (currentKnowledge) {
        // Update existing knowledge
        operation = supabase
          .from('chatbot_knowledge')
          .update(knowledgeData)
          .eq('id', currentKnowledge.id);
      } else {
        // Insert new knowledge
        operation = supabase
          .from('chatbot_knowledge')
          .insert([knowledgeData]);
      }
      
      const { error, data } = await operation;
      
      if (error) throw error;
      
      toast({
        title: currentKnowledge ? "Conocimiento actualizado" : "Conocimiento añadido",
        description: "Los cambios se han guardado correctamente."
      });
      
      // Refresh the knowledge data
      const { data: refreshedData } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('topic', { ascending: true });
        
      if (refreshedData) {
        setKnowledge(refreshedData);
        
        // Update unique topics
        const topics = Array.from(new Set(refreshedData.map((item: KnowledgeItem) => item.topic)));
        setUniqueTopics(topics);
      }
      
      // Reset form
      setTopic('');
      setQuestion('');
      setAnswer('');
      setCurrentKnowledge(null);
      setIsAddingKnowledge(false);
      
    } catch (err) {
      console.error('Error saving knowledge:', err);
      toast({
        title: "Error",
        description: "No se pudo guardar el conocimiento.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_knowledge')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setKnowledge(knowledge.filter(item => item.id !== id));
      
      toast({
        title: "Conocimiento eliminado",
        description: "El conocimiento se ha eliminado correctamente."
      });
    } catch (err) {
      console.error('Error deleting knowledge:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el conocimiento.",
        variant: "destructive"
      });
    }
  };

  const handleEditKnowledge = (item: KnowledgeItem) => {
    setCurrentKnowledge(item);
    setTopic(item.topic);
    setQuestion(item.question);
    setAnswer(item.answer);
    setIsAddingKnowledge(true);
  };

  const filteredKnowledge = topicFilter === 'all' 
    ? knowledge 
    : knowledge.filter(item => item.topic === topicFilter);

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
          <TabsTrigger value="knowledge">Base de Conocimiento</TabsTrigger>
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
        
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Base de Conocimiento del Chatbot</CardTitle>
                  <CardDescription>
                    Administra las preguntas y respuestas que el chatbot puede responder directamente sin usar AI.
                  </CardDescription>
                </div>
                <Dialog open={isAddingKnowledge} onOpenChange={setIsAddingKnowledge}>
                  <DialogTrigger asChild>
                    <Button className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue">
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Conocimiento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        {currentKnowledge ? "Editar Conocimiento" : "Añadir Nuevo Conocimiento"}
                      </DialogTitle>
                      <DialogDescription>
                        Define una pregunta específica y la respuesta exacta que el chatbot dará cuando se detecte esa pregunta.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="topic">Tema</Label>
                        <Input 
                          id="topic" 
                          value={topic} 
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="ej: reclutamiento, empresa, contacto"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="question">Pregunta</Label>
                        <Input 
                          id="question" 
                          value={question} 
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="ej: ¿Qué servicios ofrece CONVERT-IA?"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="answer">Respuesta</Label>
                        <Textarea 
                          id="answer" 
                          value={answer} 
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Describe la respuesta detallada que el chatbot debe dar a esta pregunta."
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button 
                        className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                        onClick={handleSaveKnowledge}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {currentKnowledge ? "Actualizar" : "Guardar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Select 
                  value={topicFilter} 
                  onValueChange={setTopicFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los temas</SelectItem>
                    {uniqueTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead>Pregunta</TableHead>
                    <TableHead>Respuesta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKnowledge.length > 0 ? (
                    filteredKnowledge.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.topic}</TableCell>
                        <TableCell>{item.question}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.answer}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditKnowledge(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteKnowledge(item.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No hay conocimientos definidos. Haga clic en "Añadir Conocimiento" para crear uno nuevo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
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
