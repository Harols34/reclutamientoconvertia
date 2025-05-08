
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Briefcase,
  User,
  Loader2,
  Check,
  AlertTriangle,
  Star,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PDFViewer from '@/components/ui/pdf-viewer';

interface Application {
  id: string;
  status: string;
  job_id: string;
  job_title?: string;
  job_department?: string;
  created_at: string;
  job_type?: string;
  job_requirements?: string | null;
  job_responsibilities?: string | null;
  job_description?: string | null;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_years?: number;
  skills?: string[];
  created_at: string;
  resume_url?: string;
  analysis_summary?: string;
  analysis_data?: {
    matchPercentage?: number;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
  };
  applications?: Application[];
  linkedin_url?: string;
  portfolio_url?: string;
  updated_at: string;
}

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('ID de candidato no proporcionado');
        }
        
        console.log('Buscando candidato con ID:', id);
        
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select('*, applications(id, status, job_id, created_at)')
          .eq('id', id)
          .single();
        
        if (candidateError) {
          console.error('Error al obtener candidato:', candidateError);
          throw candidateError;
        }
        
        if (candidateData) {
          console.log('Datos del candidato obtenidos:', candidateData);
          
          // Parse analysis_data si existe
          let analysisData = null;
          if (candidateData.analysis_summary) {
            try {
              analysisData = JSON.parse(candidateData.analysis_summary);
            } catch (e) {
              console.error('Error al parsear analysis_summary:', e);
            }
          }
          
          if (candidateData.applications && candidateData.applications.length > 0) {
            const jobPromises = candidateData.applications.map(async (app: any) => {
              const { data: jobData } = await supabase
                .from('jobs')
                .select('id, title, department, type, description, requirements, responsibilities')
                .eq('id', app.job_id)
                .single();
              
              return {
                ...app,
                job_title: jobData?.title ?? 'Vacante Desconocida',
                job_department: jobData?.department ?? 'Departamento Desconocido',
                job_type: jobData?.type ?? 'tiempo-completo',
                job_description: jobData?.description,
                job_requirements: jobData?.requirements,
                job_responsibilities: jobData?.responsibilities
              };
            });
            
            const appsWithJobDetails = await Promise.all(jobPromises);
            
            setCandidate({
              ...candidateData,
              analysis_data: analysisData,
              applications: appsWithJobDetails
            });
          } else {
            setCandidate({
              ...candidateData,
              analysis_data: analysisData,
              applications: []
            });
          }
        } else {
          throw new Error('No se encontró el candidato');
        }
      } catch (error: any) {
        console.error('Error al cargar candidato:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo cargar los detalles del candidato"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchCandidate();
  }, [id, toast]);

  const analyzeCV = async (applicationId?: string) => {
    if (!candidate?.resume_url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay CV disponible para análisis"
      });
      return;
    }

    if (!resumeContent) {
      toast({
        title: "Información",
        description: "Primero debe extraer el texto del CV. Abriendo visor de PDF..."
      });
      setPdfViewerOpen(true);
      return;
    }

    try {
      setAnalyzing(true);
      
      // Obtener detalles de la vacante si se proporciona ID de aplicación
      let jobContext = '';
      if (applicationId) {
        const application = candidate.applications?.find(app => app.id === applicationId);
        if (application) {
          jobContext = JSON.stringify({
            title: application.job_title,
            requirements: application.job_requirements,
            responsibilities: application.job_responsibilities,
            description: application.job_description
          });
          setJobDetails({
            title: application.job_title,
            requirements: application.job_requirements,
            responsibilities: application.job_responsibilities
          });
        }
      }

      // Paso 1: Ya tenemos el texto extraído en resumeContent
      console.log('Texto extraído del CV:', resumeContent.substring(0, 100) + '...');

      // Paso 2: Enviar el texto a la Edge Function para análisis con IA
      toast({ title: "Analizando", description: "Evaluando ajuste del candidato..." });

      const response = await supabase.functions.invoke('extract-pdf-text', {
        body: { extractedText: resumeContent }
      });
      
      if (!response.data?.success) {
        throw new Error(response.error?.message || response.data?.error || "Error durante el análisis del CV");
      }

      const analysisResult = response.data.analysis;
      
      // Actualizar registro del candidato
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ 
          analysis_summary: JSON.stringify(analysisResult) 
        })
        .eq('id', candidate.id);
      
      if (updateError) throw updateError;

      // Actualizar estado local
      setCandidate(prev => prev ? { 
        ...prev, 
        analysis_summary: JSON.stringify(analysisResult),
        analysis_data: analysisResult 
      } : null);

      toast({
        title: "Análisis completado",
        description: "Evaluación del candidato finalizada correctamente"
      });
      
    } catch (error: any) {
      console.error('Error de análisis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al analizar el CV"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTextExtracted = (text: string) => {
    console.log("Texto extraído en el componente principal:", text.substring(0, 100) + "...");
    setResumeContent(text);
    toast({ 
      title: "Texto extraído", 
      description: "El contenido del CV ha sido extraído correctamente"
    });
  };

  const getResumeUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('resumes').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-10">
        <Card>
          <CardHeader>
            <CardTitle>Candidato no encontrado</CardTitle>
            <CardDescription>El candidato solicitado no existe</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/admin/candidates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a candidatos
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const pdfUrl = candidate.resume_url ? getResumeUrl(candidate.resume_url) : null;

  // Traducción de estados de aplicación
  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'new': 'Nuevo',
      'reviewing': 'En revisión',
      'interview': 'Entrevista',
      'selected': 'Seleccionado',
      'rejected': 'Rechazado',
      'hired': 'Contratado'
    };
    return statusMap[status] || status;
  };

  // Traducción de tipos de trabajo
  const getJobTypeText = (type: string) => {
    const typeMap: {[key: string]: string} = {
      'full-time': 'Tiempo Completo',
      'part-time': 'Medio Tiempo',
      'contract': 'Contrato',
      'internship': 'Pasantía',
      'temporary': 'Temporal'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/admin/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Perfil del Candidato</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
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
                    onClick={() => setPdfViewerOpen(true)}
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
                onClick={() => analyzeCV(candidate.applications?.[0]?.id)}
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
                <CardDescription>{candidate.applications.length} {candidate.applications.length === 1 ? 'posición aplicada' : 'posiciones aplicadas'}</CardDescription>
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
        
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {candidate.analysis_data ? (
            <Card>
              <CardHeader>
                <CardTitle>Análisis del Candidato</CardTitle>
                {jobDetails && (
                  <CardDescription>
                    Análisis para: {jobDetails.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Porcentaje de coincidencia */}
                {candidate.analysis_data.matchPercentage && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Porcentaje de Coincidencia</span>
                      <span className="text-sm font-bold">
                        {candidate.analysis_data.matchPercentage}%
                      </span>
                    </div>
                    <Progress 
                      value={candidate.analysis_data.matchPercentage} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {/* Fortalezas */}
                {candidate.analysis_data.strengths && candidate.analysis_data.strengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Fortalezas</h3>
                    <div className="space-y-2">
                      {candidate.analysis_data.strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Debilidades */}
                {candidate.analysis_data.weaknesses && candidate.analysis_data.weaknesses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Áreas a Considerar</h3>
                    <div className="space-y-2">
                      {candidate.analysis_data.weaknesses.map((weakness, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Análisis Detallado */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Análisis Detallado</h3>
                  <div className="prose prose-sm max-w-none text-sm">
                    {candidate.analysis_data.recommendation || candidate.analysis_summary}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                  onClick={() => analyzeCV(candidate.applications?.[0]?.id)}
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
                      Analizar CV con IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Contenido del CV */}
          {resumeContent && (
            <Card>
              <CardHeader>
                <CardTitle>Contenido del CV</CardTitle>
                <CardDescription>Texto extraído del CV para análisis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{resumeContent}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Visor de PDF */}
      {pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={`CV de ${candidate.first_name} ${candidate.last_name}`}
          onTextExtracted={handleTextExtracted}
          onAnalyze={() => analyzeCV(candidate.applications?.[0]?.id)}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
