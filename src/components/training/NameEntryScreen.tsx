
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface NameEntryScreenProps {
  name?: string;
  onNameChange?: (name: string) => void;
  onStart?: () => void;
  onBack?: () => void;
  loading?: boolean;
}

export const NameEntryScreen: React.FC<NameEntryScreenProps> = ({ 
  name = '', 
  onNameChange = () => {}, 
  onStart = () => {}, 
  onBack = () => {}, 
  loading = false 
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">¿Cómo te llamas?</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu nombre para que podamos identificarte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              ref={nameInputRef}
              placeholder="Nombre completo"
              value={name}
              onChange={handleNameChange}
              className="text-lg"
              autoFocus
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={onStart} 
          className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          disabled={loading}
        >
          {loading ? 'Iniciando...' : 'Iniciar Entrenamiento'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onBack}
          className="w-full"
        >
          Volver
        </Button>
      </CardFooter>
    </Card>
  );
};
