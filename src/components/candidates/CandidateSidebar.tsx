
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, FileText, User, Loader2 } from 'lucide-react';
import { Candidate, Application } from '@/types/candidate';

interface CandidateSidebarProps {
  candidate: Candidate;
  analyzing: boolean;
  resumeContent: string | null;
  onViewResume: () => void;
  onAnalyzeCV: (applicationId?: string) => void;
  getStatusText: (status: string) => string;
}

const CandidateSidebar: React.FC<CandidateSidebarProps> = ({
  candidate,
  analyzing,
  resumeContent,
  onViewResume,
  onAnalyzeCV,
  getStatusText
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {candidate.first_name} {candidate.last_name}
          </CardTitle>
          <CardDescription>
            {candidate.experience_years ? `${candidate.experience_years} años de experiencia` : 'Experiencia no especificada'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{candidate.email}</span>
            </div>
            
            {candidate.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.phone}</span>
              </div>
            )}
            
            {candidate.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.location}</span>
              </div>
            )}
          </div>
          
          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Habilidades</h3>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {candidate.resume_url && (
            <div>
              <h3 className="text-sm font-medium mb-2">Curriculum Vitae</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onViewResume}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver CV
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => onAnalyzeCV(candidate.applications?.[0]?.id)}
            disabled={analyzing || !candidate.resume_url || !resumeContent}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                {candidate.analysis_data ? 'Reanalizar CV' : 'Analizar CV con IA'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {candidate.applications && candidate.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aplicaciones</CardTitle>
            <CardDescription>
              {candidate.applications.length} {candidate.applications.length === 1 ? 'posición aplicada' : 'posiciones aplicadas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidate.applications.map((app: Application) => (
              <div key={app.id} className="p-3 border rounded-lg hover:bg-muted/50">
                <div className="font-medium">{app.job_title || 'Posición'}</div>
                {app.job_department && (
                  <div className="text-xs text-muted-foreground">{app.job_department}</div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(app.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateSidebar;
