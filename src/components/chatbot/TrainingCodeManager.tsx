
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrainingCode {
  id: string;
  code: string;
  active: boolean;
  client_name?: string;
  client_personality?: string;
  interest_level?: string;
  objections?: string;
  product?: string;
  created_at: string;
  expires_at?: string;
}

const TrainingCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<TrainingCode[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState<Partial<TrainingCode>>({
    code: '',
    active: true,
    client_name: '',
    client_personality: '',
    interest_level: '',
    objections: '',
    product: ''
  });

  useEffect(() => {
    // Initialize training codes table if needed
    const initTable = async () => {
      try {
        await supabase.functions.invoke('init-training-codes');
        fetchCodes();
      } catch (error) {
        console.error('Error initializing training codes table:', error);
        fetchCodes(); // Try to fetch anyway in case table exists
      }
    };

    const fetchCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_training_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCodes(data || []);
      } catch (error) {
        console.error('Error fetching training codes:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los códigos de entrenamiento"
        });
      } finally {
        setLoading(false);
      }
    };

    initTable();
  }, [toast]);

  const generateRandomCode = () => {
    setGeneratingCode(true);
    try {
      // Generate a random 8 character code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setNewCode({...newCode, code: result});
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.code || !newCode.client_name || !newCode.product) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa los campos requeridos"
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('chatbot_training_codes')
        .insert(newCode)
        .select()
        .single();

      if (error) throw error;

      setCodes(prevCodes => [data, ...prevCodes]);
      setIsFormOpen(false);
      setNewCode({
        code: '',
        active: true,
        client_name: '',
        client_personality: '',
        interest_level: '',
        objections: '',
        product: ''
      });
      
      toast({
        title: "Código creado",
        description: "El código de entrenamiento ha sido creado con éxito"
      });
    } catch (error: any) {
      console.error('Error creating training code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el código de entrenamiento"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCodeActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('chatbot_training_codes')
        .update({ active: !currentState })
        .eq('id', id);

      if (error) throw error;

      setCodes(prevCodes => 
        prevCodes.map(code => 
          code.id === id ? { ...code, active: !currentState } : code
        )
      );
      
      toast({
        title: "Estado actualizado",
        description: `Código ${!currentState ? 'activado' : 'desactivado'} con éxito`
      });
    } catch (error: any) {
      console.error('Error toggling code state:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el código"
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Códigos de Entrenamiento</h2>
        <Button 
          className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          onClick={() => setIsFormOpen(true)}
        >
          Crear Nuevo Código
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando códigos...</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No hay códigos de entrenamiento creados.</p>
          <Button 
            className="mt-4 bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            onClick={() => setIsFormOpen(true)}
          >
            Crear Primer Código
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map(code => (
            <Card key={code.id} className={!code.active ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Código: {code.code}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${code.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {code.active ? 'Activo' : 'Inactivo'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Cliente:</span> {code.client_name}
                  </div>
                  <div>
                    <span className="font-semibold">Producto:</span> {code.product}
                  </div>
                  {code.objections && (
                    <div>
                      <span className="font-semibold">Objeciones:</span> {code.objections}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={code.active ? "outline" : "default"}
                  className={code.active ? "" : "bg-hrm-dark-cyan hover:bg-hrm-steel-blue"}
                  onClick={() => toggleCodeActive(code.id, code.active)}
                >
                  {code.active ? 'Desactivar' : 'Activar'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Code Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo código de entrenamiento</DialogTitle>
            <DialogDescription>
              Configura un nuevo escenario de entrenamiento de ventas para candidatos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={newCode.code || ''}
                  onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                  placeholder="Código único"
                />
              </div>
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={generateRandomCode} 
                  disabled={generatingCode}
                  size="sm"
                >
                  Generar
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="client_name">Nombre del cliente</Label>
              <Input
                id="client_name"
                value={newCode.client_name || ''}
                onChange={(e) => setNewCode({...newCode, client_name: e.target.value})}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="product">Producto/Servicio</Label>
              <Input
                id="product"
                value={newCode.product || ''}
                onChange={(e) => setNewCode({...newCode, product: e.target.value})}
                placeholder="Ej: Software de gestión empresarial"
              />
            </div>

            <div>
              <Label htmlFor="client_personality">Personalidad del cliente</Label>
              <Input
                id="client_personality"
                value={newCode.client_personality || ''}
                onChange={(e) => setNewCode({...newCode, client_personality: e.target.value})}
                placeholder="Ej: Amigable pero cauteloso"
              />
            </div>

            <div>
              <Label htmlFor="interest_level">Nivel de interés</Label>
              <Input
                id="interest_level"
                value={newCode.interest_level || ''}
                onChange={(e) => setNewCode({...newCode, interest_level: e.target.value})}
                placeholder="Ej: Medio, Alto, Bajo"
              />
            </div>

            <div>
              <Label htmlFor="objections">Objeciones principales</Label>
              <Textarea
                id="objections"
                value={newCode.objections || ''}
                onChange={(e) => setNewCode({...newCode, objections: e.target.value})}
                placeholder="Ej: Precio alto, dudas sobre el servicio"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCode} 
              disabled={saving}
              className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              Crear Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingCodeManager;
