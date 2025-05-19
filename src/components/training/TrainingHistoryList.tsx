
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Calendar, RefreshCcw, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageEntry {
  id: string;
  sender_type: string;
  content: string;
  sent_at: string;
}

interface SessionRow {
  id: string;
  candidate_name: string;
  started_at: string;
  ended_at: string | null;
  score: number | null;
  public_visible: boolean;
  feedback: string | null;
  training_code: string;
  messages: MessageEntry[];
}

export const TrainingHistoryList = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Usar la función segura, que retorna TODAS las sesiones con información relevante y sin requerir acceso a users
      let { data, error } = await supabase
        .rpc('get_complete_training_sessions');

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
        training_code: row.training_code ?? '-',
        messages: Array.isArray(row.messages) ? row.messages : [],
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

  const [openChat, setOpenChat] = useState<string | null>(null);

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
                    <TableHead>Chat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <React.Fragment key={s.id}>
                      <TableRow>
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
                        <TableCell>
                          {s.messages.length > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setOpenChat(openChat === s.id ? null : s.id)}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="h-4 w-4" /> Ver chat
                            </Button>
                          ) : (
                            <span className="text-gray-400 italic">Sin chat</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {openChat === s.id && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-gray-50 px-5">
                            <div className="max-h-56 overflow-y-auto p-2 border rounded">
                              {s.messages.length > 0 ? (
                                s.messages.map((msg) => (
                                  <div key={msg.id} className={`mb-2 ${msg.sender_type === 'candidate' ? 'text-blue-600' : 'text-gray-700'}`}>
                                    <span className="font-semibold">{msg.sender_type === 'candidate' ? 'Candidato:' : 'AI:'}</span>
                                    <span className="ml-2">{msg.content}</span>
                                    <span className="ml-2 text-xs text-gray-400">{formatDate(msg.sent_at)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400">No hay mensajes en el chat.</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
