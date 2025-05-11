
import React from 'react';
import { Lightbulb, Check, AlertTriangle } from 'lucide-react';
import { AnalysisData } from '@/types/candidate';

interface EvaluationTabProps {
  analysisData: AnalysisData;
}

const EvaluationTab: React.FC<EvaluationTabProps> = ({ analysisData }) => {
  return (
    <div className="space-y-6">
      {/* Fortalezas */}
      {analysisData.fortalezas && analysisData.fortalezas.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <Lightbulb className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Fortalezas
          </h3>
          <div className="space-y-2">
            {analysisData.fortalezas.map((strength, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Áreas a mejorar */}
      {analysisData.areasAMejorar && analysisData.areasAMejorar.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <Lightbulb className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Áreas a Mejorar
          </h3>
          <div className="space-y-2">
            {analysisData.areasAMejorar.map((area, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Compatibilidad */}
      {analysisData.compatibilidad && (
        <div>
          <h3 className="text-base font-medium mb-2">Compatibilidad con la Vacante</h3>
          
          {/* Fortalezas para la vacante */}
          {analysisData.compatibilidad.fortalezas && 
            analysisData.compatibilidad.fortalezas.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-green-700">Puntos Fuertes</h4>
              <div className="space-y-2">
                {analysisData.compatibilidad.fortalezas.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debilidades para la vacante */}
          {analysisData.compatibilidad.debilidades && 
            analysisData.compatibilidad.debilidades.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-yellow-700">Áreas de Preocupación</h4>
              <div className="space-y-2">
                {analysisData.compatibilidad.debilidades.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recomendación */}
          {analysisData.compatibilidad.recomendacion && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="text-sm font-medium mb-2 text-blue-700">Recomendación</h4>
              <p className="text-sm">{analysisData.compatibilidad.recomendacion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationTab;
