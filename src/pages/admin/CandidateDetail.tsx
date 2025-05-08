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
        
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select('*, applications(id, status, job_id, created_at)')
          .eq('id', id)
          .single();
        
        if (candidateError) throw candidateError;
        
        if (candidateData) {
          // Parse analysis_data if it exists
          const analysisData = candidateData.analysis_summary 
            ? JSON.parse(candidateData.analysis_summary) 
            : null;
          
          if (candidateData.applications && candidateData.applications.length > 0) {
            const jobPromises = candidateData.applications.map(async (app: any) => {
              const { data: jobData } = await supabase
                .from('jobs')
                .select('id, title, department, type, description, requirements, responsibilities')
                .eq('id', app.job_id)
                .single();
              
              return {
                ...app,
                job_title: jobData?.title ?? 'Unknown Job',
                job_department: jobData?.department ?? 'Unknown Department',
                job_type: jobData?.type ?? 'full-time',
                job_description: jobData?.description,
                job_requirements: jobData?.requirements,
                job_responsibilities: jobData?.responsibilities
              };
            });
            
            const appsWithJobDetails = await Promise.all(jobPromises);
            
            setCandidate({
              ...candidateData,
              analysis_data,
              applications: appsWithJobDetails
            });
          } else {
            setCandidate({
              ...candidateData,
              analysis_data,
              applications: []
            });
          }
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load candidate details"
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
        description: "No resume available for analysis"
      });
      return;
    }

    try {
      setAnalyzing(true);
      
      // Get job details if application ID is provided
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

      // Get resume URL
      const resumeUrl = candidate.resume_url;
      const pdfUrl = resumeUrl.startsWith('http') 
        ? resumeUrl 
        : supabase.storage.from('resumes').getPublicUrl(resumeUrl).data.publicUrl;

      // Step 1: Extract text
      toast({ title: "Extracting text", description: "Processing resume content..." });
      
      const extractionResponse = await supabase.functions.invoke('extract-pdf-text', {
        body: { pdfUrl }
      });
      
      if (extractionResponse.error || !extractionResponse.data?.success) {
        throw new Error(extractionResponse.error?.message || extractionResponse.data?.error);
      }

      const cvContent = extractionResponse.data.text;
      setResumeContent(cvContent);

      // Step 2: Analyze with AI
      toast({ title: "Analyzing", description: "Evaluating candidate fit..." });

      const response = await supabase.functions.invoke('openai-assistant', {
        body: {
          prompt: cvContent,
          type: 'cv-analysis',
          context: jobContext
        }
      });
      
      if (response.error) throw response.error;

      const analysisResult = response.data.response;
      
      // Update candidate record
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ 
          analysis_summary: JSON.stringify(analysisResult) 
        })
        .eq('id', candidate.id);
      
      if (updateError) throw updateError;

      // Update local state
      setCandidate(prev => prev ? { 
        ...prev, 
        analysis_summary: JSON.stringify(analysisResult),
        analysis_data: analysisResult 
      } : null);

      toast({
        title: "Analysis complete",
        description: "Candidate evaluation finished successfully"
      });
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to analyze resume"
      });
    } finally {
      setAnalyzing(false);
    }
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
            <CardTitle>Candidate not found</CardTitle>
            <CardDescription>The requested candidate does not exist</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/admin/candidates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to candidates
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
          <h1 className="text-2xl font-bold">Candidate Profile</h1>
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
                {candidate.experience_years ? `${candidate.experience_years} years experience` : 'Experience not specified'}
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
                  <h3 className="text-sm font-medium mb-2">Skills</h3>
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
                  <h3 className="text-sm font-medium mb-2">Resume</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setPdfViewerOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume
                  </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => analyzeCV(candidate.applications?.[0]?.id)}
                disabled={analyzing || !candidate.resume_url}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {candidate.analysis_data ? 'Re-analyze CV' : 'Analyze CV with AI'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {candidate.applications && candidate.applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>{candidate.applications.length} positions applied</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidate.applications.map((app: Application) => (
                  <div key={app.id} className="p-3 border rounded-lg hover:bg-muted/50">
                    <div className="font-medium">{app.job_title || 'Position'}</div>
                    {app.job_department && (
                      <div className="text-xs text-muted-foreground">{app.job_department}</div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-xs">
                        {app.status}
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
        
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {candidate.analysis_data ? (
            <Card>
              <CardHeader>
                <CardTitle>Candidate Analysis</CardTitle>
                {jobDetails && (
                  <CardDescription>
                    Analysis for: {jobDetails.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Match Percentage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Match Percentage</span>
                    <span className="text-sm font-bold">
                      {candidate.analysis_data.matchPercentage}%
                    </span>
                  </div>
                  <Progress 
                    value={candidate.analysis_data.matchPercentage} 
                    className="h-2"
                  />
                </div>
                
                {/* Strengths */}
                {candidate.analysis_data.strengths && candidate.analysis_data.strengths.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Strengths</h3>
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
                
                {/* Weaknesses */}
                {candidate.analysis_data.weaknesses && candidate.analysis_data.weaknesses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Areas to Consider</h3>
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
                
                {/* Detailed Analysis */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Detailed Analysis</h3>
                  <div className="prose prose-sm max-w-none text-sm">
                    {candidate.analysis_data.recommendation}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Candidate Analysis</CardTitle>
                <CardDescription>
                  No analysis available yet. Click "Analyze CV with AI" to generate one.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-10">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground mb-6">
                  Generate an AI-powered analysis to evaluate this candidate's fit for open positions.
                </p>
                <Button onClick={() => analyzeCV(candidate.applications?.[0]?.id)}>
                  <User className="mr-2 h-4 w-4" />
                  Analyze CV with AI
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* PDF Viewer */}
      {pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={`${candidate.first_name} ${candidate.last_name}'s Resume`}
        />
      )}
    </div>
  );
};

export default CandidateDetail;
