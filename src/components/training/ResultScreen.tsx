
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, BarChart, BookOpen, ArrowLeft } from 'lucide-react';

interface EvaluationResult {
  score: number;
  text: string;
}

interface ResultScreenProps {
  evaluation: EvaluationResult | null;
  onReturn: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ evaluation, onReturn }) => {
  // Helper function to determine score color
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to determine score background color
  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to extract sections from evaluation text
  const extractSections = (text: string) => {
    const sections: {[key: string]: string} = {};
    
    // Try to extract sections based on common patterns in the evaluation text
    const strengthsMatch = text.match(/Fortalezas:([^]*?)(?=Áreas de mejora:|Consejos específicos:|$)/i);
    if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();
    
    const areasMatch = text.match(/Áreas de mejora:([^]*?)(?=Consejos específicos:|$)/i);
    if (areasMatch) sections.areas = areasMatch[1].trim();
    
    const tipsMatch = text.match(/Consejos específicos:([^]*?)$/i);
    if (tipsMatch) sections.tips = tipsMatch[1].trim();
    
    return sections;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="text-center border-b pb-6">
        <CardTitle className="text-2xl flex justify-center items-center gap-2">
          <Award className="h-6 w-6 text-hrm-dark-cyan" />
          Evaluación Completada
        </CardTitle>
        <CardDescription className="text-lg">
          Gracias por participar en esta simulación de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {evaluation ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className={`${getScoreBgColor(evaluation.score)} text-white w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <div className="text-4xl font-bold">{evaluation.score}</div>
                  <div className="text-sm opacity-90">puntos</div>
                </div>
              </div>
            </div>
            
            {evaluation.text && (
              <>
                {/* Display formatted sections if available */}
                {(() => {
                  const sections = extractSections(evaluation.text);
                  
                  if (Object.keys(sections).length > 0) {
                    return (
                      <div className="space-y-4">
                        {sections.strengths && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-green-700 flex items-center gap-1 mb-2">
                              <Award className="h-4 w-4" /> Fortalezas
                            </h3>
                            <p className="text-green-900">{sections.strengths}</p>
                          </div>
                        )}
                        
                        {sections.areas && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-700 flex items-center gap-1 mb-2">
                              <BarChart className="h-4 w-4" /> Áreas de mejora
                            </h3>
                            <p className="text-blue-900">{sections.areas}</p>
                          </div>
                        )}
                        
                        {sections.tips && (
                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <h3 className="font-semibold text-amber-700 flex items-center gap-1 mb-2">
                              <BookOpen className="h-4 w-4" /> Consejos específicos
                            </h3>
                            <div className="text-amber-900" dangerouslySetInnerHTML={{
                              __html: sections.tips.replace(/- /g, '• ').replace(/\n/g, '<br>')
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Fallback to displaying the entire text
                    return (
                      <div className="whitespace-pre-line bg-gray-50 p-5 rounded-lg border">
                        {evaluation.text}
                      </div>
                    );
                  }
                })()}
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Cargando resultados...</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Button 
          onClick={onReturn}
          className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue transition-colors"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
        </Button>
      </CardFooter>
    </Card>
  );
};
