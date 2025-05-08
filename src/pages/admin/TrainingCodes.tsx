
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash, RefreshCcw } from 'lucide-react';

const TrainingCodes = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expirationDays, setExpirationDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Cargar códigos existentes
  const loadCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error al cargar códigos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los códigos de entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('training-codes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'training_codes' }, 
        () => loadCodes())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Generar un código aleatorio
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitimos caracteres confusos como I, O, 0, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Crear un nuevo código
  const createCode = async () => {
    try {
      setIsGenerating(true);
      const newCode = generateRandomCode();
      
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const { error } = await supabase
        .from('training_codes')
        .insert({
          code: newCode,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      
      toast({
        title: 'Código generado',
        description: `Se ha creado el código ${newCode}`,
      });
    } catch (error) {
      console.error('Error al crear código:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el código de entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Eliminar un código
  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('training_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Código eliminado',
        description: 'El código ha sido eliminado correctamente',
      });
    } catch (error) {
      console.error('Error al eliminar código:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el código',
        variant: 'destructive',
      });
    }
  };

  // Formatear fecha - Corrigiendo el error de TypeScript
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

  // Verificar si un código está expirado
  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div>
      <h1 className="page-title">Códigos de Entrenamiento</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generar Código</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expirationDays">Días de expiración</Label>
              <Input
                id="expirationDays"
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                min="1"
                max="90"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createCode} 
                disabled={isGenerating}
                className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
              >
                {isGenerating ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generar Código
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Códigos Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCcw className="h-6 w-6 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : codes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>{formatDate(code.created_at)}</TableCell>
                    <TableCell>{formatDate(code.expires_at)}</TableCell>
                    <TableCell>
                      {code.is_used ? (
                        <Badge className="bg-gray-100 text-gray-800">Usado</Badge>
                      ) : isExpired(code.expires_at) ? (
                        <Badge className="bg-red-100 text-red-800">Expirado</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay códigos generados. Crea uno nuevo utilizando el formulario superior.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingCodes;
