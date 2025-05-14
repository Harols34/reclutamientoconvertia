
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
  message_count?: number;
}

export const TrainingHistoryList = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      console.log('Fetching training sessions...');
      setLoading(true);
      
      // Enable realtime for the tables we need
      await supabase.rpc('enable_realtime_for_training');
      
      // Fetch all sessions data with a comprehensive query
      const { data, error } = await supabase
        .rpc('get_complete_training_sessions');
        
      if (error) {
        console.error('Error fetching sessions data:', error);
        throw error;
      }
      
      console.log('Complete sessions data received:', data);
      
      if (!data || data.length === 0) {
        console.log('No training sessions found');
        setSessions([]);
        setLoading(false);
        return;
      }

      // Transform the data to match our expected format
      const transformedSessions: TrainingSession[] = data.map(session => ({
        id: session.id,
        candidate_name: session.candidate_name,
        started_at: session.started_at,
        ended_at: session.ended_at,
        score: session.score,
        training_code: session.training_code,
        messages: session.messages,
        message_count: Array.isArray(session.messages) ? session.messages.length : 0,
        strengths: session.strengths,
        areas_to_improve: session.areas_to_improve,
        recommendations: session.recommendations,
        public_visible: session.public_visible,
        feedback: session.feedback
      }));
      
      console.log('Training sessions loaded:', transformedSessions.length);
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
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
    
    // Set up realtime subscription
    const channel = supabase
      .channel('training_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'training_sessions' 
      }, () => {
        // Reload data when changes happen
        loadSessions();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'training_evaluations' 
      }, () => {
        loadSessions();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
                    {session.message_count || Array.isArray(session.messages) ? session.messages.length : 
                     (typeof session.messages === 'object' && session.messages ? Object.keys(session.messages).length : 0)} mensajes
                  </span>
                </div>
                
                {session.score !== null && (
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{session.score}/100</span>
                  </div>
                )}
                
                {session.strengths && (
                  <div className="text-sm text-green-600">
                    <strong>Fortalezas:</strong> {session.strengths.length > 50 ? `${session.strengths.substring(0, 50)}...` : session.strengths}
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
