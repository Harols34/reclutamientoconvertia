
import React from 'react';
import { Briefcase, GraduationCap, Award } from 'lucide-react';
import { AnalysisData } from '@/types/candidate';

interface ExperienceTabProps {
  analysisData: AnalysisData;
}

const ExperienceTab: React.FC<ExperienceTabProps> = ({ analysisData }) => {
  return (
    <div className="space-y-6">
      {/* Experiencia laboral */}
      {analysisData.experienciaLaboral && analysisData.experienciaLaboral.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-3 flex items-center">
            <Briefcase className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Experiencia Laboral
          </h3>
          <div className="space-y-4">
            {analysisData.experienciaLaboral.map((exp, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="font-medium">{exp.cargo}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {exp.empresa} | {exp.fechas}
                </div>
                {exp.responsabilidades && exp.responsabilidades.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs uppercase font-medium text-muted-foreground mb-1">Responsabilidades</h4>
                    <ul className="text-sm space-y-1 list-disc pl-4">
                      {exp.responsabilidades.map((resp, j) => (
                        <li key={j}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Educación */}
      {analysisData.educacion && analysisData.educacion.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-3 flex items-center">
            <GraduationCap className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Educación
          </h3>
          <div className="space-y-3">
            {analysisData.educacion.map((edu, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="font-medium">{edu.carrera}</div>
                <div className="text-sm text-muted-foreground">
                  {edu.institucion} | {edu.fechas}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Certificaciones */}
      {analysisData.certificaciones && analysisData.certificaciones.length > 0 && (
        <div>
          <h3 className="text-base font-medium mb-2 flex items-center">
            <Award className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
            Certificaciones
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {analysisData.certificaciones.map((cert, i) => (
              <li key={i}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExperienceTab;
