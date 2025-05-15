
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Star, Calendar, User, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Session item structure (without full messages array)
interface TrainingSession {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  training_code: string;
  message_count: number;
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
      setLoading(true);

      // Use the correct RPC function we just created
      const { data, error } = await supabase.rpc('get_complete_training_sessions');
      if (error) {
        throw error;
      }
      if (!data || !Array.isArray(data)) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Defensive: simple type guard
      const validSessions = data.filter(
        (item) =>
          typeof item.id === 'string' &&
          typeof item.candidate_name === 'string'
      );

      // Defensive fallback... might be overkill, but prevents noise in UI
      setSessions(validSessions as TrainingSession[]);
    } catch (error) {
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

    // Set up realtime subscription for all 3 tables
    const channel = supabase
      .channel('training_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_sessions'
      }, loadSessions)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_evaluations'
      }, loadSessions)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_messages'
      }, loadSessions)
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
                    {typeof session.message_count === 'number' ? session.message_count : 0} mensajes
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
