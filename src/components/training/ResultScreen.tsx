
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface EvaluationResult {
  score: number;
  text: string;
}

interface ResultScreenProps {
  evaluation: EvaluationResult | null;
  onReturn: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ evaluation, onReturn }) => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Evaluación Completada</CardTitle>
        <CardDescription>
          Gracias por participar en esta simulación de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {evaluation ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-hrm-dark-cyan text-white w-32 h-32 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">{evaluation.score}</div>
                  <div className="text-sm">puntos</div>
                </div>
              </div>
            </div>
            <div className="whitespace-pre-line bg-gray-50 p-4 rounded-lg">
              {evaluation.text}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Cargando resultados...</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={onReturn}
          className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
        >
          Volver al Inicio
        </Button>
      </CardFooter>
    </Card>
  );
};
