
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingSession {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  feedback: string | null;
  public_visible: boolean;
  training_codes: { code: string } | null;
}

interface TrainingMessage {
  id: string;
  sender_type: string;
  content: string;
  sent_at: string;
}

const TrainingSessions = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<TrainingMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  // Cargar sesiones de entrenamiento
  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          id,
          candidate_name,
          started_at,
          ended_at,
          score,
          feedback,
          public_visible,
          training_codes(code)
        `)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sesiones de entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes de una sesión específica
  const loadSessionMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('training_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setSessionMessages(data || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mensajes de la sesión',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Cambiar visibilidad pública de una sesión
  const togglePublicVisibility = async (sessionId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .update({ public_visible: !currentValue })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: 'Visibilidad actualizada',
        description: `La sesión ahora es ${!currentValue ? 'visible' : 'privada'}`,
      });
    } catch (error) {
      console.error('Error al actualizar visibilidad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la visibilidad de la sesión',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadSessions();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('training-sessions-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'training_sessions' }, 
        () => loadSessions())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const viewSessionDetails = (session: TrainingSession) => {
    setSelectedSession(session);
    loadSessionMessages(session.id);
    setShowDialog(true);
  };

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '---';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Formatear duración
  const formatDuration = (startDateString: string, endDateString: string | null) => {
    if (!endDateString) return 'En progreso';
    
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h1 className="page-title">Sesiones de Entrenamiento</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCcw className="h-6 w-6 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Puntuación</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.candidate_name}</TableCell>
                    <TableCell className="font-mono">{session.training_codes?.code}</TableCell>
                    <TableCell>{formatDate(session.started_at)}</TableCell>
                    <TableCell>{formatDate(session.ended_at)}</TableCell>
                    <TableCell>{formatDuration(session.started_at, session.ended_at)}</TableCell>
                    <TableCell>
                      {session.score ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{session.score}/100</span>
                        </div>
                      ) : '---'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={session.public_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        onClick={() => togglePublicVisibility(session.id, session.public_visible)}
                        style={{ cursor: 'pointer' }}
                      >
                        {session.public_visible ? 'Pública' : 'Privada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewSessionDetails(session)}
                      >
                        <MessageSquare className="h-4 w-4 text-hrm-dark-cyan" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay sesiones de entrenamiento registradas.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Sesión</DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <div className="flex flex-col gap-1 mt-2">
                  <div><span className="font-medium">Candidato:</span> {selectedSession.candidate_name}</div>
                  <div><span className="font-medium">Inicio:</span> {formatDate(selectedSession.started_at)}</div>
                  <div><span className="font-medium">Duración:</span> {formatDuration(selectedSession.started_at, selectedSession.ended_at)}</div>
                  {selectedSession.score && <div><span className="font-medium">Puntuación:</span> {selectedSession.score}/100</div>}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="conversation" className="mt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="conversation">Conversación</TabsTrigger>
              <TabsTrigger value="feedback">Evaluación</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversation">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <RefreshCcw className="h-6 w-6 animate-spin text-hrm-dark-cyan" />
                </div>
              ) : sessionMessages.length > 0 ? (
                <div className="space-y-4 py-4">
                  {sessionMessages.map(message => (
                    <div key={message.id} className={`flex ${message.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-md rounded-lg p-3 ${
                          message.sender_type === 'candidate'
                            ? 'bg-hrm-steel-blue text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <div className="mb-1 text-xs text-gray-500">
                          {new Date(message.sent_at).toLocaleTimeString()}
                        </div>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay mensajes disponibles para esta sesión.</p>
              )}
            </TabsContent>
            
            <TabsContent value="feedback">
              {selectedSession?.feedback ? (
                <Card>
                  <CardContent className="pt-6 whitespace-pre-line">
                    {selectedSession.feedback}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay evaluación disponible para esta sesión.</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingSessions;
