
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Star, Languages } from 'lucide-react';
import { AnalysisData } from '@/types/candidate';

interface ProfileTabProps {
  analysisData: AnalysisData;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ analysisData }) => {
  return (
    <div className="space-y-6">
      {/* Porcentaje de coincidencia */}
      {analysisData.compatibilidad?.porcentaje !== undefined && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Compatibilidad con la vacante</span>
            <span className={`font-bold ${
              analysisData.compatibilidad.porcentaje >= 75
                ? 'text-green-600'
                : analysisData.compatibilidad.porcentaje >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {analysisData.compatibilidad.porcentaje}%
            </span>
          </div>
          <Progress 
            value={analysisData.compatibilidad.porcentaje} 
            className={`h-2 ${
              analysisData.compatibilidad.porcentaje >= 75
                ? 'bg-green-100 [&>div]:bg-green-600'
                : analysisData.compatibilidad.porcentaje >= 50
                ? 'bg-yellow-100 [&>div]:bg-yellow-600'
                : 'bg-red-100 [&>div]:bg-red-600'
            }`}
          />
        </div>
      )}

      {/* Perfil profesional */}
      {analysisData.perfilProfesional && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <User className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Perfil Profesional
          </h3>
          <div className="text-sm text-gray-700">
            {analysisData.perfilProfesional}
          </div>
        </div>
      )}
      
      {/* Habilidades */}
      {analysisData.habilidades && analysisData.habilidades.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <Star className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Habilidades
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysisData.habilidades.map((skill, i) => (
              <Badge key={i} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Idiomas */}
      {analysisData.idiomas && analysisData.idiomas.length > 0 && 
        analysisData.idiomas[0] !== 'No especificado' && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <Languages className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Idiomas
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysisData.idiomas.map((language, i) => (
              <Badge key={i} variant="outline">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
