
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Star, Calendar, User, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Ajuste: Incluye siempre los fields opcionales
interface TrainingSession {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  training_code: string;
  feedback: string | null;
  message_count: number;
  strengths?: string | null;
  areas_to_improve?: string | null;
  recommendations?: string | null;
  public_visible?: boolean;
}

export const TrainingHistoryList = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);

      // Uso correcto de la función RPC y type assertion seguro
      const { data, error } = await (supabase.rpc as any)(
        'get_complete_training_sessions'
      );

      if (error) {
        throw error;
      }
      if (!data || !Array.isArray(data)) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Tomar sólo los objetos válidos
      const validSessions = data.filter(
        (item): item is TrainingSession =>
          item &&
          typeof item.id === 'string' &&
          typeof item.candidate_name === 'string' &&
          typeof item.started_at === 'string' &&
          Object.prototype.hasOwnProperty.call(item, 'training_code')
      );
      setSessions(validSessions);
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

    // Real-time updates para tablas de entrenamiento
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
        <p className="text-gray-500 mb-4">No hay sesiones de entrenamiento registradas.</p>
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
              {/* DATOS SESIÓN y CANDIDATO */}
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

                {/* RESUMEN SESIÓN */}
                <div className="mt-2">
                  <p className="font-semibold text-gray-700">Resumen global</p>
                  {session.score !== null && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{session.score}/100</span>
                    </div>
                  )}
                  {session.feedback && (
                    <div className="text-xs text-gray-600 mt-1">{session.feedback.length > 80 ? (
                      <span title={session.feedback}>{session.feedback.substring(0, 80)}...</span>
                    ) : session.feedback}
                    </div>
                  )}
                </div>

                {/* INFORME DE EVALUACIÓN */}
                {(session.strengths || session.areas_to_improve || session.recommendations) ? (
                  <div className="mt-2">
                    <div className="font-semibold text-gray-700">Evaluación detallada</div>
                    {session.strengths && (
                      <div className="text-xs text-green-700">
                        <strong>Fortalezas:</strong> {session.strengths.length > 60 ? `${session.strengths.substring(0, 60)}...` : session.strengths}
                      </div>
                    )}
                    {session.areas_to_improve && (
                      <div className="text-xs text-amber-700">
                        <strong>Áreas a mejorar:</strong> {session.areas_to_improve.length > 60 ? `${session.areas_to_improve.substring(0, 60)}...` : session.areas_to_improve}
                      </div>
                    )}
                    {session.recommendations && (
                      <div className="text-xs text-blue-700">
                        <strong>Recomendaciones:</strong> {session.recommendations.length > 60 ? `${session.recommendations.substring(0, 60)}...` : session.recommendations}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-xs italic text-gray-400">
                    Sin evaluación registrada aún para esta sesión.
                  </div>
                )}
              </div>
              {/* BOTÓN ACCESO DETALLADO */}
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

