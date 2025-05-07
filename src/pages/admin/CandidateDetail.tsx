
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
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Briefcase,
  User,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppDatabase } from '@/utils/supabase-helpers';
import PDFViewer from '@/components/ui/pdf-viewer';

interface Application {
  id: string;
  status: string;
  job_id: string;
  job_title?: string;
  job_department?: string;
  created_at: string;
  job_type?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        
        // Fetch candidate details with their applications
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select('*, applications(id, status, job_id, created_at)')
          .eq('id', id)
          .single();
        
        if (candidateError) throw candidateError;
        
        if (candidateData) {
          console.log("Candidate data:", candidateData);
          
          // If the candidate has applications, fetch the job details for each application
          if (candidateData.applications && candidateData.applications.length > 0) {
            const jobPromises = candidateData.applications.map(async (app: any) => {
              const { data: jobData } = await supabase
                .from('jobs')
                .select('id, title, department, type')
                .eq('id', app.job_id)
                .single();
              
              return {
                ...app,
                job_title: jobData?.title ?? 'Unknown Job',
                job_department: jobData?.department ?? 'Unknown Department',
                job_type: jobData?.type ?? 'full-time'
              };
            });
            
            const appsWithJobDetails = await Promise.all(jobPromises);
            
            // Create a properly typed candidate object
            const typedCandidate: Candidate = {
              id: candidateData.id,
              first_name: candidateData.first_name,
              last_name: candidateData.last_name,
              email: candidateData.email,
              phone: candidateData.phone,
              location: candidateData.location,
              resume_url: candidateData.resume_url,
              linkedin_url: candidateData.linkedin_url,
              portfolio_url: candidateData.portfolio_url,
              created_at: candidateData.created_at,
              updated_at: candidateData.updated_at,
              analysis_summary: candidateData.analysis_summary,
              applications: appsWithJobDetails,
              experience_years: candidateData.experience_years,
              skills: candidateData.skills
            };
            
            setCandidate(typedCandidate);
          } else {
            // If no applications, just set the candidate data directly
            setCandidate({
              id: candidateData.id,
              first_name: candidateData.first_name,
              last_name: candidateData.last_name,
              email: candidateData.email,
              phone: candidateData.phone,
              location: candidateData.location,
              resume_url: candidateData.resume_url,
              linkedin_url: candidateData.linkedin_url,
              portfolio_url: candidateData.portfolio_url,
              created_at: candidateData.created_at,
              updated_at: candidateData.updated_at,
              analysis_summary: candidateData.analysis_summary,
              experience_years: candidateData.experience_years,
              skills: candidateData.skills,
              applications: []
            });
          }
        }
      } catch (error) {
        console.error('Error fetching candidate details:', error);
        setError('No se pudieron cargar los detalles del candidato.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los detalles del candidato."
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCandidate();
    }
  }, [id, toast]);

  const extractTextFromPDF = async (resumeUrl: string): Promise<string> => {
    try {
      console.log("Intentando extraer contenido del CV:", resumeUrl);
      
      // Extract the filename from the URL or path
      let filename = resumeUrl;
      if (resumeUrl.includes('/')) {
        const parts = resumeUrl.split('/');
        filename = parts[parts.length - 1];
      }
      
      // Call the OpenAI edge function with a special type for extracting text
      const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/openai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: resumeUrl,
          type: 'extract-cv-text',
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error al extraer texto: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Extracción de texto exitosa:", data);
      
      return data.response || '';
    } catch (error) {
      console.error('Error extrayendo texto del CV:', error);
      throw error;
    }
  };

  const analyzeCV = async (applicationId?: string) => {
    if (!candidate?.resume_url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay CV disponible para analizar."
      });
      return;
    }

    try {
      setAnalyzing(true);
      
      // Fetch the job details if we have an application ID
      let jobContext = '';
      if (applicationId) {
        const { data: app } = await supabase
          .from('applications')
          .select('job_id')
          .eq('id', applicationId)
          .single();
          
        if (app?.job_id) {
          const { data: job } = await supabase
            .from('jobs')
            .select('title, description, requirements, responsibilities')
            .eq('id', app.job_id)
            .single();
          
          if (job) {
            setJobDetails(job);
            jobContext = `
              Título de la vacante: ${job.title}
              Descripción: ${job.description}
              Requisitos: ${job.requirements || 'No especificados'}
              Responsabilidades: ${job.responsibilities || 'No especificadas'}
            `;
          }
        }
      }

      // Get the resume URL or filename
      const resumeUrl = candidate.resume_url;
      console.log("Resume URL:", resumeUrl);
      
      // First, extract text or fetch content from the PDF
      let cvContent;
      try {
        cvContent = await extractTextFromPDF(resumeUrl);
        setResumeContent(cvContent);
      } catch (extractError) {
        console.error("Error extracting CV content:", extractError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo extraer el contenido del CV. Intentando analizar con información limitada."
        });
        // Use a fallback approach - let the OpenAI function handle it directly
        cvContent = `CV URL: ${resumeUrl}`;
      }
      
      // Now send the extracted content to OpenAI for analysis
      console.log("Enviando contenido del CV para análisis:", cvContent.length, "caracteres");
      
      const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/openai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: cvContent.substring(0, 15000), // Limit to 15000 characters
          type: 'cv-analysis',
          context: jobContext
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error invocando el asistente OpenAI:', errorText);
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Análisis recibido con éxito");
      
      if (!data.response) {
        throw new Error('No se recibió respuesta del análisis');
      }
      
      // Update the candidate with the analysis
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ 
          analysis_summary: data.response 
        })
        .eq('id', candidate.id);
      
      if (updateError) {
        console.error('Error actualizando candidato:', updateError);
        throw new Error(`Error al guardar el análisis: ${updateError.message}`);
      }
      
      // Update local state
      setCandidate(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          analysis_summary: data.response 
        };
      });
      
      toast({
        title: "Análisis completado",
        description: "El CV ha sido analizado correctamente."
      });
      
    } catch (error: any) {
      console.error('Error analizando CV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo analizar el CV: ${error.message}`
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to get the public URL for a resume
  const getResumeUrl = (path: string) => {
    if (!path) return null;
    
    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;
    
    // If it's a path in the storage, get the public URL
    const { data } = supabase.storage.from('resumes').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-hrm-dark-cyan" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-10">
        <Card>
          <CardHeader>
            <CardTitle>Candidato no encontrado</CardTitle>
            <CardDescription>
              El candidato que estás buscando no existe o ha sido eliminado.
            </CardDescription>
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" className="mr-4" asChild>
            <Link to="/admin/candidates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="page-title">Perfil de Candidato</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with candidate info */}
        <div className="lg:col-span-1">
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
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{candidate.email}</span>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>
              
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Habilidades</h3>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {candidate.resume_url && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Currículum</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center"
                    onClick={() => setPdfViewerOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver CV
                  </Button>
                </div>
              )}
              
              {candidate.applications && candidate.applications.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Aplicaciones ({candidate.applications.length})</h3>
                  <div className="space-y-2">
                    {candidate.applications.map((app: Application) => (
                      <div key={app.id} className="p-2 border rounded-md">
                        <div className="font-medium">{app.job_title || 'Vacante'}</div>
                        {app.job_department && (
                          <div className="text-xs text-gray-500">{app.job_department}</div>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            {app.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                onClick={() => analyzeCV(candidate.applications?.[0]?.id)}
                disabled={analyzing || !candidate.resume_url}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando CV...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {candidate.analysis_summary ? 'Re-analizar CV' : 'Analizar CV con IA'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="analysis">
            <TabsList className="mb-4">
              <TabsTrigger value="analysis">Análisis de CV</TabsTrigger>
              <TabsTrigger value="applications">Aplicaciones</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de CV</CardTitle>
                  {jobDetails && (
                    <CardDescription>
                      Análisis para la posición: {jobDetails.title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {candidate.analysis_summary ? (
                    <div className="prose max-w-none" style={{ whiteSpace: 'pre-line' }}>
                      {candidate.analysis_summary}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay análisis disponible</h3>
                      <p className="text-gray-500 mb-4">
                        Haga clic en "Analizar CV con IA" para generar un análisis automático.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Aplicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.applications && candidate.applications.length > 0 ? (
                    <div className="space-y-4">
                      {candidate.applications.map((app: Application) => (
                        <Card key={app.id}>
                          <CardHeader className="py-3">
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-base">{app.job_title || 'Vacante'}</CardTitle>
                                <CardDescription>{app.job_department || ''}</CardDescription>
                              </div>
                              <Badge>{app.status}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-500">
                                <Briefcase className="mr-2 h-4 w-4" />
                                <span>{app.job_type || 'Tiempo completo'}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Aplicó el {new Date(app.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Sin aplicaciones</h3>
                      <p className="text-gray-500">
                        Este candidato no ha aplicado a ninguna vacante.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium mb-2">Sin notas disponibles</h3>
                    <p className="text-gray-500">
                      No hay notas registradas para este candidato.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* PDF Viewer Dialog */}
      {pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={`CV de ${candidate.first_name} ${candidate.last_name}`}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
