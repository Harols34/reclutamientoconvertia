
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCcw, MessageSquare, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SessionEvaluation } from './SessionEvaluation';

interface SessionMessage {
  id: string;
  sender_type: string;
  content: string;
  sent_at: string;
}

interface SessionData {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  feedback: string | null;
  public_visible: boolean;
  training_code: string;
  messages: SessionMessage[];
  strengths: string | null;
  areas_to_improve: string | null;
  recommendations: string | null;
}

export const SessionDetailView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadSessionData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      console.log('Cargando datos para sesión:', sessionId);
      
      // Primero, intentar actualizar la función
      try {
        await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/update_training_function', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
          }
        });
        console.log('Función actualizada correctamente');
      } catch (updateError) {
        console.error('Error al actualizar función:', updateError);
      }

      // Use the get_complete_training_session function
      const { data, error } = await supabase
        .rpc('get_complete_training_session', { p_session_id: sessionId });

      if (error) {
        console.error('Error al cargar datos de sesión:', error);
        throw error;
      }
      
      console.log('Datos obtenidos:', data);
      
      if (data && data.length > 0) {
        // Process the data to ensure proper type conversion
        const sessionData = data[0];
        
        // Parse the JSON messages and ensure they conform to SessionMessage[]
        let processedMessages: SessionMessage[] = [];
        if (sessionData.messages) {
          try {
            // If messages is a string, parse it; otherwise, assume it's already an array
            const messagesArray = typeof sessionData.messages === 'string' 
              ? JSON.parse(sessionData.messages) 
              : sessionData.messages;
            
            // Map to ensure all fields are present and correctly typed
            processedMessages = Array.isArray(messagesArray) 
              ? messagesArray.map((msg: any) => ({
                  id: msg.id || '',
                  sender_type: msg.sender_type || '',
                  content: msg.content || '',
                  sent_at: msg.sent_at || ''
                }))
              : [];
            
            console.log('Mensajes procesados:', processedMessages.length);
          } catch (e) {
            console.error('Error al procesar mensajes:', e);
            processedMessages = [];
          }
        }

        // Create a properly typed SessionData object
        const typedSession: SessionData = {
          id: sessionData.id,
          candidate_name: sessionData.candidate_name,
          started_at: sessionData.started_at,
          ended_at: sessionData.ended_at,
          score: sessionData.score,
          feedback: sessionData.feedback,
          public_visible: sessionData.public_visible,
          training_code: sessionData.training_code,
          messages: processedMessages,
          strengths: sessionData.strengths,
          areas_to_improve: sessionData.areas_to_improve,
          recommendations: sessionData.recommendations
        };
        
        console.log('Sesión procesada:', typedSession);
        setSession(typedSession);
      } else {
        console.error('No se encontró la sesión con ID:', sessionId);
        toast({
          title: 'Error',
          description: 'No se encontró la sesión solicitada',
          variant: 'destructive',
        });
        navigate('/admin/training-sessions');
      }
    } catch (error) {
      console.error('Error al cargar sesión:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la sesión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

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
    <div className="container max-w-5xl mx-auto py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate('/admin/training-sessions')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCcw className="h-6 w-6 animate-spin text-hrm-dark-cyan" />
        </div>
      ) : session ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Sesión de {session.candidate_name}</CardTitle>
                  <CardDescription>
                    Código: <span className="font-mono">{session.training_code}</span>
                  </CardDescription>
                </div>
                <Badge 
                  className={session.public_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {session.public_visible ? 'Pública' : 'Privada'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Inicio</p>
                  <p className="font-medium">{formatDate(session.started_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fin</p>
                  <p className="font-medium">{formatDate(session.ended_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="font-medium">{formatDuration(session.started_at, session.ended_at)}</p>
                </div>
                {session.score !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Puntuación</p>
                    <p className="font-medium flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {session.score}/100
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="conversation">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversation">
                <MessageSquare className="h-4 w-4 mr-2" /> Conversación
              </TabsTrigger>
              <TabsTrigger value="feedback">Retroalimentación</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversation" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {session.messages && session.messages.length > 0 ? (
                      session.messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
                        >
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
                      ))
                    ) : (
                      <p className="text-center text-gray-500">No hay mensajes disponibles para esta sesión.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  {session.feedback ? (
                    <div className="whitespace-pre-line">{session.feedback}</div>
                  ) : (
                    <p className="text-center text-gray-500">No hay retroalimentación disponible para esta sesión.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="evaluation" className="pt-4">
              <SessionEvaluation 
                sessionId={session.id}
                initialData={{
                  strengths: session.strengths || '',
                  areas_to_improve: session.areas_to_improve || '',
                  recommendations: session.recommendations || '',
                  score: session.score || 50
                }}
                onSaved={loadSessionData}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No se encontró la sesión solicitada.</p>
      )}
    </div>
  );
};
