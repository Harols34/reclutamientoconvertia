
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Calendar, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SessionRow {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  public_visible: boolean;
  feedback: string | null;
  training_code: string;
}

export const TrainingHistoryList = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Hacemos join a training_codes para obtener el código de entrenamiento si existe
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id,candidate_name,started_at,ended_at,score,public_visible,feedback,training_code_id,training_codes(code)')
        .order('started_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las sesiones: " + error.message,
          variant: "destructive",
        });
        setSessions([]);
        return;
      }

      // Mapear y preparar los campos
      const mapped: SessionRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        candidate_name: row.candidate_name,
        started_at: row.started_at,
        ended_at: row.ended_at,
        score: row.score !== undefined && row.score !== null ? Number(row.score) : null,
        public_visible: row.public_visible === true,
        feedback: row.feedback ?? null,
        training_code: row.training_codes?.code ?? '-',
      }));

      setSessions(mapped);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones: " + err.message,
        variant: "destructive",
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

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

  return (
    <Card className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Informe de Sesiones de Entrenamiento</h2>
        <Button onClick={loadSessions} variant="outline" className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Refrescar
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCcw className="h-7 w-7 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-blue-700">Cargando sesiones...</span>
        </div>
      ) : (
        <>
        {sessions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No se encontraron sesiones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Puntuación</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.candidate_name}</TableCell>
                    <TableCell>{s.training_code}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" /> {formatDate(s.started_at)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(s.ended_at)}</TableCell>
                    <TableCell>
                      {s.score !== null ? (
                        <span className="font-medium">{s.score}/100</span>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          s.public_visible
                            ? "inline-block rounded bg-green-200 text-green-800 px-2 py-1 text-xs"
                            : "inline-block rounded bg-gray-200 text-gray-500 px-2 py-1 text-xs"
                        }
                      >
                        {s.public_visible ? "Sí" : "No"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.feedback ? (
                        s.feedback.length > 60
                          ? <span title={s.feedback}>{s.feedback.substring(0,60)}...</span>
                          : s.feedback
                      ) : <span className="text-gray-400 italic">Sin feedback</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </>
      )}
    </Card>
  );
};
