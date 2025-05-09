
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface CodeEntryScreenProps {
  code?: string;
  onCodeChange?: (code: string) => void;
  onValidate?: () => void;
  loading?: boolean;
}

export const CodeEntryScreen: React.FC<CodeEntryScreenProps> = ({ 
  code = '', 
  onCodeChange = () => {}, 
  onValidate = () => {}, 
  loading = false 
}) => {
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCodeChange(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Chat de Entrenamiento</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu código de entrenamiento para comenzar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Introduce tu código (ej: ABC123)"
              value={code}
              onChange={handleCodeChange}
              className="text-center uppercase font-mono text-lg"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onValidate} 
          className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </Button>
      </CardFooter>
    </Card>
  );
};
