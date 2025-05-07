
import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface TrainingChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainingStart: (code: string) => void;
}

const TrainingChatDialog: React.FC<TrainingChatDialogProps> = ({
  isOpen,
  onClose,
  onTrainingStart
}) => {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un código de entrenamiento"
      });
      return;
    }

    setVerifying(true);
    try {
      // We'll just pass the code to the parent component
      // The actual verification happens in the ChatbotInterface
      onTrainingStart(code);
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al verificar el código de entrenamiento"
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrenamiento de Ventas</DialogTitle>
          <DialogDescription>
            Introduce el código de entrenamiento proporcionado por tu administrador para comenzar una sesión de práctica de ventas.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="training-code" className="mb-2 block">Código de Entrenamiento</Label>
          <Input
            id="training-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: TRAINING123"
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleVerifyCode} 
            disabled={verifying || !code.trim()}
            className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          >
            Iniciar Entrenamiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingChatDialog;
