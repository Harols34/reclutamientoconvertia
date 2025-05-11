
import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, User, Loader2 } from 'lucide-react';
import { AnalysisData } from '@/types/candidate';
import ProfileTab from './ProfileTab';
import ExperienceTab from './ExperienceTab';
import EvaluationTab from './EvaluationTab';

interface AnalysisContentProps {
  analysisData?: AnalysisData;
  jobDetails?: any;
  analyzing: boolean;
  resumeContent: string | null;
  onAnalyzeCV: (applicationId?: string) => void;
  applicationId?: string;
}

const AnalysisContent: React.FC<AnalysisContentProps> = ({
  analysisData,
  jobDetails,
  analyzing,
  resumeContent,
  onAnalyzeCV,
  applicationId
}) => {
  const [activeTab, setActiveTab] = React.useState("perfil");

  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis del Candidato</CardTitle>
          <CardDescription>
            No hay análisis disponible todavía. Haz clic en "Analizar CV con IA" para generar uno.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin Análisis Disponible</h3>
          <p className="text-muted-foreground mb-6">
            Genera un análisis impulsado por IA para evaluar el ajuste de este candidato para posiciones abiertas.
          </p>
          <Button 
            onClick={() => onAnalyzeCV(applicationId)}
            disabled={analyzing || !resumeContent}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Analizar CV con IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis del Candidato</CardTitle>
        {jobDetails && (
          <CardDescription>
            Análisis para: {jobDetails.title}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="experiencia">Experiencia</TabsTrigger>
            <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <ProfileTab analysisData={analysisData} />
          </TabsContent>

          <TabsContent value="experiencia">
            <ExperienceTab analysisData={analysisData} />
          </TabsContent>

          <TabsContent value="evaluacion">
            <EvaluationTab analysisData={analysisData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AnalysisContent;
