
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw, MessageSquare, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingSession {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  training_code: string;
  public_visible: boolean;
}

export const TrainingHistoryList: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Use the RPC function to get complete session data
      const { data, error } = await supabase
        .rpc('get_complete_training_session');

      if (error) throw error;
      
      // Process sessions for display
      const processedSessions = data ? data.map((session: any) => ({
        id: session.id,
        candidate_name: session.candidate_name,
        started_at: session.started_at,
        ended_at: session.ended_at,
        score: session.score,
        training_code: session.training_code,
        public_visible: session.public_visible
      })) : [];
      
      setSessions(processedSessions);
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

  useEffect(() => {
    loadSessions();
  }, []);

  const viewSessionDetails = (sessionId: string) => {
    navigate(`/admin/training-sessions/${sessionId}`);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration between dates
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
                <TableHead>Duración</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.candidate_name}</TableCell>
                  <TableCell className="font-mono">{session.training_code}</TableCell>
                  <TableCell>{formatDate(session.started_at)}</TableCell>
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => viewSessionDetails(session.id)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 text-hrm-dark-cyan" />
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
  );
};
