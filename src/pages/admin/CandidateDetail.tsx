
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/ui/pdf-viewer';
import CandidateSidebar from '@/components/candidates/CandidateSidebar';
import AnalysisContent from '@/components/candidates/AnalysisContent';
import ResumeContent from '@/components/candidates/ResumeContent';
import { fetchCandidateDetails, saveAnalysisData, analyzeResume, getResumeUrl } from '@/services/candidate-service';
import { getStatusText, getJobTypeText } from '@/utils/formatters';
import { Candidate } from '@/types/candidate';

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
    const loadCandidate = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('ID de candidato no proporcionado');
        }
        
        console.log('Buscando candidato con ID:', id);
        
        const candidateData = await fetchCandidateDetails(id);
        
        // Set resume content if it exists
        if (candidateData.resume_text) {
          setResumeContent(candidateData.resume_text);
        }
        
        setCandidate(candidateData);
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
    
    if (id) loadCandidate();
  }, [id, toast]);

  const handleSaveAnalysisData = async (analysisResult: any, extractedText: string) => {
    try {
      if (!id) return;

      console.log('Guardando datos de análisis para el candidato:', id);
      
      await saveAnalysisData(id, analysisResult, extractedText);
      
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

  const handleAnalyzeCV = async (applicationId?: string) => {
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
      
      // Get job details if application ID is provided
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

      toast({ title: "Analizando", description: "Evaluando ajuste del candidato..." });

      const analysisResult = await analyzeResume(resumeContent, jobContext);
      
      // Parse the result to ensure it's JSON
      let parsedAnalysis;
      try {
        // If it's already an object (already parsed by Supabase client)
        if (typeof analysisResult === 'object') {
          parsedAnalysis = analysisResult;
        } else {
          // If it's a JSON string
          parsedAnalysis = JSON.parse(analysisResult);
        }
      } catch (error) {
        console.error("Error al parsear el análisis:", error);
        parsedAnalysis = { error: "No se pudo parsear el análisis" };
      }

      // Save analysis data and resume text
      await handleSaveAnalysisData(analysisResult, resumeContent);

      // Update local state
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
      handleSaveAnalysisData(candidate.analysis_summary, text);
    }
    
    toast({ 
      title: "Texto extraído", 
      description: "El contenido del CV ha sido extraído correctamente"
    });
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
        <CandidateSidebar
          candidate={candidate}
          analyzing={analyzing}
          resumeContent={resumeContent}
          onViewResume={() => setPdfViewerOpen(true)}
          onAnalyzeCV={handleAnalyzeCV}
          getStatusText={getStatusText}
        />
        
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <AnalysisContent
            analysisData={candidate.analysis_data}
            jobDetails={jobDetails}
            analyzing={analyzing}
            resumeContent={resumeContent}
            onAnalyzeCV={handleAnalyzeCV}
            applicationId={candidate.applications?.[0]?.id}
          />
          
          <ResumeContent resumeContent={resumeContent} />
        </div>
      </div>
      
      {/* PDF Viewer */}
      {pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={`CV de ${candidate.first_name} ${candidate.last_name}`}
          onTextExtracted={handleTextExtracted}
          onAnalyze={() => handleAnalyzeCV(candidate.applications?.[0]?.id)}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
