
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Star, Calendar, User, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface TrainingSession {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  training_code: string;
  messages: Json;
  strengths?: string | null;
  areas_to_improve?: string | null;
  recommendations?: string | null;
  public_visible?: boolean;
  feedback?: string | null;
}

export const TrainingHistoryList = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      console.log('Fetching training sessions...');
      setLoading(true);
      
      // First try to update the function to ensure it exists with the correct signature
      try {
        await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/update_training_function', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
          }
        });
        console.log('Function updated successfully');
      } catch (updateError) {
        console.error('Error updating function:', updateError);
        // Continue anyway, in case the function already exists
      }
      
      // Now fetch all sessions from training_sessions directly
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('training_sessions')
        .select(`
          id, 
          candidate_name, 
          started_at, 
          ended_at, 
          score, 
          feedback, 
          public_visible,
          training_code_id,
          training_codes(code)
        `)
        .order('started_at', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      
      if (!sessionsData || sessionsData.length === 0) {
        console.log('No training sessions found');
        setSessions([]);
        setLoading(false);
        return;
      }
      
      // Transform data and get messages
      const transformedSessions = await Promise.all(
        sessionsData.map(async (session) => {
          // Get messages for each session
          const { data: messagesData, error: messagesError } = await supabase
            .from('training_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('sent_at', { ascending: true });
            
          if (messagesError) {
            console.error(`Error fetching messages for session ${session.id}:`, messagesError);
          }

          // Get evaluation for each session
          const { data: evaluationData, error: evaluationError } = await supabase
            .from('training_evaluations')
            .select('*')
            .eq('session_id', session.id)
            .single();
            
          if (evaluationError && evaluationError.code !== 'PGRST116') { // Ignore not found error
            console.error(`Error fetching evaluation for session ${session.id}:`, evaluationError);
          }

          return {
            id: session.id,
            candidate_name: session.candidate_name,
            started_at: session.started_at,
            ended_at: session.ended_at,
            score: session.score,
            feedback: session.feedback,
            public_visible: session.public_visible,
            training_code: session.training_codes?.code || '',
            messages: messagesData || [],
            strengths: evaluationData?.strengths || null,
            areas_to_improve: evaluationData?.areas_to_improve || null,
            recommendations: evaluationData?.recommendations || null
          };
        })
      );
      
      console.log('Training sessions loaded:', transformedSessions.length);
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones de entrenamiento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSessions();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCcw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay sesiones de entrenamiento disponibles.</p>
        <Button onClick={loadSessions} variant="outline" className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Refrescar
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={loadSessions} variant="outline" className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Refrescar
        </Button>
      </div>
      
      {sessions.map((session) => (
        <Card key={session.id} className="hover:bg-gray-50 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{session.candidate_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{formatDate(session.started_at)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {Array.isArray(session.messages) ? session.messages.length : 
                     (typeof session.messages === 'object' ? Object.keys(session.messages).length : 0)} mensajes
                  </span>
                </div>
                
                {session.score !== null && (
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{session.score}/100</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 md:mt-0">
                <Link to={`/admin/training-sessions/${session.id}`}>
                  <Button variant="outline">Ver detalle</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
