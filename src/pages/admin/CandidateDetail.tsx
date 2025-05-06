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

interface Application {
  id: string;
  status: string;
  job_id: string;
  job_title?: string;
  job_department?: string;
  job_type: string;
  created_at: string;
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
}

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        
        // Fetch candidate details with their applications
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select('*, applications(id, status, job_id, job_type, created_at)')
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
                .select('id, title, department')
                .eq('id', app.job_id)
                .single();
              
              return {
                ...app,
                job_title: jobData?.title,
                job_department: jobData?.department
              };
            });
            
            const appsWithJobDetails = await Promise.all(jobPromises);
            candidateData.applications = appsWithJobDetails;
          }
          
          setCandidate(candidateData);
        }
      } catch (error) {
        console.error('Error fetching candidate details:', error);
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

      // First fetch the CV content from the URL
      console.log("Fetching CV content from:", candidate.resume_url);
      
      const filename = candidate.resume_url.replace('resumes/', '');
      
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('resumes')
        .download(filename);
      
      if (fileError) {
        console.error('Error downloading CV:', fileError);
        throw fileError;
      }
      
      // Read the file content
      const fileContent = await fileData.text();
      console.log("CV content length:", fileContent.length);
      
      // Now call the OpenAI edge function for analysis
      console.log("Calling OpenAI assistant for CV analysis");
      const { data, error } = await supabase.functions
        .invoke('openai-assistant', {
          body: {
            prompt: fileContent,
            type: 'cv-analysis',
            context: jobContext
          }
        });
      
      if (error) {
        console.error('Error invoking OpenAI assistant:', error);
        throw error;
      }
      
      console.log("Analysis received successfully");
      
      // Update the candidate with the analysis
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ analysis_summary: data.response })
        .eq('id', candidate.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setCandidate(prev => prev ? { 
        ...prev, 
        analysis_summary: data.response 
      } : null);
      
      toast({
        title: "Análisis completado",
        description: "El CV ha sido analizado correctamente."
      });
      
    } catch (error) {
      console.error('Error analyzing CV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo analizar el CV. Intente de nuevo más tarde."
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
    const filename = path.replace('resumes/', '');
    return supabase.storage.from('resumes').getPublicUrl(filename).data.publicUrl;
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
                    onClick={() => {
                      const url = getResumeUrl(candidate.resume_url);
                      if (url) window.open(url, '_blank');
                    }}
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
    </div>
  );
};

export default CandidateDetail;
