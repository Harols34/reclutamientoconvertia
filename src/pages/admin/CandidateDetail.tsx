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
  GraduationCap,
  Award,
  Languages,
  Lightbulb
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

interface ExperienceItem {
  empresa: string;
  cargo: string;
  fechas: string;
  responsabilidades: string[];
}

interface EducationItem {
  institucion: string;
  carrera: string;
  fechas: string;
}

interface AnalysisData {
  datosPersonales?: {
    nombre?: string;
    telefono?: string;
    email?: string;
    ubicacion?: string;
    disponibilidad?: string;
    linkedin?: string;
  };
  perfilProfesional?: string;
  experienciaLaboral?: ExperienceItem[];
  educacion?: EducationItem[];
  habilidades?: string[];
  certificaciones?: string[];
  idiomas?: string[];
  fortalezas?: string[];
  areasAMejorar?: string[];
  compatibilidad?: {
    porcentaje?: number;
    fortalezas?: string[];
    debilidades?: string[];
    recomendacion?: string;
  };
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
  resume_text?: string; // Added to match the database schema
  analysis_summary?: string;
  analysis_data?: AnalysisData;
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
  const [activeTab, setActiveTab] = useState("perfil");

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
          
          // Set resume content if it exists
          if (candidateData.resume_text) {
            setResumeContent(candidateData.resume_text);
          }
          
          // Parse analysis_data si existe
          let analysisData: AnalysisData | null = null;
          if (candidateData.analysis_summary) {
            try {
              // Intentar parsear como JSON
              analysisData = JSON.parse(candidateData.analysis_summary);
              // Verificar si es un string JSON (resultado de un análisis anterior)
              if (typeof analysisData === 'string') {
                try {
                  analysisData = JSON.parse(analysisData);
                } catch (e) {
                  console.log('El análisis ya está en formato string, no es JSON');
                }
              }
            } catch (e) {
              console.error('Error al parsear analysis_summary:', e);
              // Si no se puede parsear como JSON, asumimos que es el formato antiguo
              analysisData = {
                perfilProfesional: candidateData.analysis_summary
              };
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
              analysis_data: analysisData as any,
              applications: appsWithJobDetails
            });
          } else {
            setCandidate({
              ...candidateData,
              analysis_data: analysisData as any,
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

  const saveAnalysisData = async (analysisResult: any, extractedText: string) => {
    try {
      if (!id) return;

      console.log('Guardando datos de análisis para el candidato:', id);
      
      // Call our edge function to save the data
      const response = await supabase.functions.invoke('save-candidate-data', {
        body: {
          candidateId: id,
          resumeText: extractedText,
          analysisData: analysisResult
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Error al guardar datos del análisis');
      }
      
      console.log('Datos guardados correctamente');
      
      toast({
        title: "Datos guardados",
        description: "La información del candidato ha sido guardada en la base de datos"
      });
      
    } catch (error: any) {
      console.error('Error al guardar datos del candidato:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar los datos del candidato"
      });
    }
  };

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
      let jobContext = null;
      if (applicationId) {
        const application = candidate.applications?.find(app => app.id === applicationId);
        if (application) {
          jobContext = {
            title: application.job_title,
            requirements: application.job_requirements,
            responsibilities: application.job_responsibilities,
            description: application.job_description
          };
          setJobDetails(jobContext);
        }
      }

      // Paso 1: Ya tenemos el texto extraído en resumeContent
      console.log('Texto extraído del CV:', resumeContent.substring(0, 100) + '...');

      // Paso 2: Enviar el texto a la Edge Function para análisis con IA
      toast({ title: "Analizando", description: "Evaluando ajuste del candidato..." });

      const response = await supabase.functions.invoke('extract-pdf-text', {
        body: { 
          extractedText: resumeContent,
          jobDetails: jobContext
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.error?.message || response.data?.error || "Error durante el análisis del CV");
      }

      const analysisResult = response.data.analysis;
      
      // Analizar el resultado para asegurarse de que es JSON
      let parsedAnalysis;
      try {
        // Si ya es un objeto (ya parseado por Supabase client)
        if (typeof analysisResult === 'object') {
          parsedAnalysis = analysisResult;
        } else {
          // Si es una cadena JSON
          parsedAnalysis = JSON.parse(analysisResult);
        }
      } catch (error) {
        console.error("Error al parsear el análisis:", error);
        parsedAnalysis = { error: "No se pudo parsear el análisis" };
      }

      // Guardar los datos del análisis y texto del CV
      await saveAnalysisData(analysisResult, resumeContent);

      // Actualizar estado local
      setCandidate(prev => prev ? { 
        ...prev, 
        analysis_summary: analysisResult,
        analysis_data: parsedAnalysis,
        resume_text: resumeContent
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
    
    // Save the extracted text to the database
    if (candidate) {
      saveAnalysisData(candidate.analysis_summary, text);
    }
    
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
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="perfil">Perfil</TabsTrigger>
                    <TabsTrigger value="experiencia">Experiencia</TabsTrigger>
                    <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
                  </TabsList>

                  <TabsContent value="perfil" className="space-y-6">
                    {/* Porcentaje de coincidencia */}
                    {candidate.analysis_data?.compatibilidad?.porcentaje !== undefined && (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Compatibilidad con la vacante</span>
                          <span className={`font-bold ${
                            candidate.analysis_data.compatibilidad.porcentaje >= 75
                              ? 'text-green-600'
                              : candidate.analysis_data.compatibilidad.porcentaje >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {candidate.analysis_data.compatibilidad.porcentaje}%
                          </span>
                        </div>
                        <Progress 
                          value={candidate.analysis_data.compatibilidad.porcentaje} 
                          className={`h-2 ${
                            candidate.analysis_data.compatibilidad.porcentaje >= 75
                              ? 'bg-green-100 [&>div]:bg-green-600'
                              : candidate.analysis_data.compatibilidad.porcentaje >= 50
                              ? 'bg-yellow-100 [&>div]:bg-yellow-600'
                              : 'bg-red-100 [&>div]:bg-red-600'
                          }`}
                        />
                      </div>
                    )}

                    {/* Perfil profesional */}
                    {candidate.analysis_data.perfilProfesional && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <User className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Perfil Profesional
                        </h3>
                        <div className="text-sm text-gray-700">
                          {candidate.analysis_data.perfilProfesional}
                        </div>
                      </div>
                    )}
                    
                    {/* Habilidades */}
                    {candidate.analysis_data.habilidades && candidate.analysis_data.habilidades.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <Star className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Habilidades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {candidate.analysis_data.habilidades.map((skill, i) => (
                            <Badge key={i} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Idiomas */}
                    {candidate.analysis_data.idiomas && candidate.analysis_data.idiomas.length > 0 && 
                     candidate.analysis_data.idiomas[0] !== 'No especificado' && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <Languages className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Idiomas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {candidate.analysis_data.idiomas.map((language, i) => (
                            <Badge key={i} variant="outline">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="experiencia" className="space-y-6">
                    {/* Experiencia laboral */}
                    {candidate.analysis_data.experienciaLaboral && candidate.analysis_data.experienciaLaboral.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-3 flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Experiencia Laboral
                        </h3>
                        <div className="space-y-4">
                          {candidate.analysis_data.experienciaLaboral.map((exp, i) => (
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
                    {candidate.analysis_data.educacion && candidate.analysis_data.educacion.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-3 flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Educación
                        </h3>
                        <div className="space-y-3">
                          {candidate.analysis_data.educacion.map((edu, i) => (
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
                    {candidate.analysis_data.certificaciones && candidate.analysis_data.certificaciones.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <Award className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Certificaciones
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {candidate.analysis_data.certificaciones.map((cert, i) => (
                            <li key={i}>{cert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="evaluacion" className="space-y-6">
                    {/* Fortalezas */}
                    {candidate.analysis_data.fortalezas && candidate.analysis_data.fortalezas.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Fortalezas
                        </h3>
                        <div className="space-y-2">
                          {candidate.analysis_data.fortalezas.map((strength, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                              <Check className="h-4 w-4 text-green-500 mt-0.5" />
                              <span className="text-sm">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Áreas a mejorar */}
                    {candidate.analysis_data.areasAMejorar && candidate.analysis_data.areasAMejorar.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium mb-2 flex items-center">
                          <Lightbulb className="mr-2 h-4 w-4 text-hrm-dark-cyan" />
                          Áreas a Mejorar
                        </h3>
                        <div className="space-y-2">
                          {candidate.analysis_data.areasAMejorar.map((area, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span className="text-sm">{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Compatibilidad */}
                    {candidate.analysis_data.compatibilidad && (
                      <div>
                        <h3 className="text-base font-medium mb-2">Compatibilidad con la Vacante</h3>
                        
                        {/* Fortalezas para la vacante */}
                        {candidate.analysis_data.compatibilidad.fortalezas && 
                         candidate.analysis_data.compatibilidad.fortalezas.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 text-green-700">Puntos Fuertes</h4>
                            <div className="space-y-2">
                              {candidate.analysis_data.compatibilidad.fortalezas.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Debilidades para la vacante */}
                        {candidate.analysis_data.compatibilidad.debilidades && 
                         candidate.analysis_data.compatibilidad.debilidades.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 text-yellow-700">Áreas de Preocupación</h4>
                            <div className="space-y-2">
                              {candidate.analysis_data.compatibilidad.debilidades.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Recomendación */}
                        {candidate.analysis_data.compatibilidad.recomendacion && (
                          <div className="p-4 border rounded-lg bg-blue-50">
                            <h4 className="text-sm font-medium mb-2 text-blue-700">Recomendación</h4>
                            <p className="text-sm">{candidate.analysis_data.compatibilidad.recomendacion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
