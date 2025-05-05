
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        
        // Use the RPC function to get job details
        const { data, error } = await supabase.rpc('get_job_by_id', {
          job_id: jobId
        });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setJob(data[0]);
        } else {
          setError('No se encontró la vacante solicitada.');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Ha ocurrido un error al cargar los detalles de la vacante.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información de la vacante.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (jobId) {
      fetchJobDetail();
    }
  }, [jobId, toast]);
  
  const jobTypeLabels = {
    'full-time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'contract': 'Contrato',
    'internship': 'Pasantía',
    'temporary': 'Temporal',
  };

  if (loading) {
    return (
      <div className="hrm-container py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hrm-dark-cyan mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles de la vacante...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="hrm-container py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vacante no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">La vacante que estás buscando no existe o ha sido eliminada.</p>
            <Button asChild>
              <Link to="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ver todas las vacantes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="hrm-container py-12">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a vacantes
          </Link>
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-3xl text-hrm-dark-cyan">{job.title}</CardTitle>
              <p className="text-lg text-gray-500 mt-1">{job.department}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge className="bg-hrm-dark-green/20 text-hrm-dark-green">
                {job.status === 'open' ? 'Abierta' : 'Cerrada'}
              </Badge>
              <Badge variant="outline">
                {jobTypeLabels[job.type as keyof typeof jobTypeLabels] || 'Tiempo Completo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center text-gray-600">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Publicado: {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Briefcase className="mr-2 h-5 w-5" />
              <span>{jobTypeLabels[job.type as keyof typeof jobTypeLabels] || 'Tiempo Completo'}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-3">Descripción</h3>
            <div className="prose max-w-none">
              <p>{job.description}</p>
            </div>
          </div>
          
          {job.responsibilities && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Responsabilidades</h3>
              <div className="prose max-w-none">
                <p>{job.responsibilities}</p>
              </div>
            </div>
          )}
          
          {job.requirements && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Requisitos</h3>
              <div className="prose max-w-none">
                <p>{job.requirements}</p>
              </div>
            </div>
          )}
          
          {job.salary_range && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Rango salarial</h3>
              <div className="prose max-w-none">
                <p>{job.salary_range}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button size="lg" className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" asChild>
            <Link to={`/postularse/${job.id}`}>Postularse ahora</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default JobDetail;
