
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Key } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const newCode = e.target.value.toUpperCase();
    onCodeChange(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Por favor ingresa un código');
      return;
    }
    
    if (code.trim().length < 3) {
      setError('El código es demasiado corto');
      return;
    }
    
    onValidate();
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-hrm-dark-cyan flex justify-center items-center gap-2">
          <Key className="h-5 w-5" />
          Chat de Entrenamiento
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tu código de entrenamiento para comenzar la simulación
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Introduce tu código (ej: ABC123)"
                value={code}
                onChange={handleCodeChange}
                className="text-center uppercase font-mono text-lg tracking-wide"
                maxLength={10}
                autoFocus
                disabled={loading}
                aria-label="Código de entrenamiento"
              />
              {error && (
                <p className="text-red-500 text-sm mt-1 text-center">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit"
            onClick={handleSubmit} 
            className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue transition-colors"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
            ) : (
              'Continuar'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
