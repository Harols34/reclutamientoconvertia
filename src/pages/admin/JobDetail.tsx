
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Briefcase, ArrowLeft, Users, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applicantCount, setApplicantCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError('No se proporcionó un ID de vacante válido.');
          setLoading(false);
          return;
        }
        
        console.log('Fetching job details for:', id);
        
        const { data, error } = await supabase.rpc('get_job_by_id', {
          p_job_id: id
        });
        
        if (error) {
          console.error('Error from get_job_by_id:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('Job data retrieved:', data[0]);
          setJob(data[0]);
          setApplicantCount(data[0].application_count || 0);
        } else {
          console.log('No job data found');
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
    
    if (id) {
      fetchJobDetail();
    }
  }, [id, toast]);

  // Function to handle navigation without page reload
  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };
  
  const jobTypeLabels = {
    'full-time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'contract': 'Contrato',
    'internship': 'Pasantía',
    'temporary': 'Temporal',
  };
  
  const jobStatusLabels = {
    'open': 'Abierta',
    'closed': 'Cerrada',
    'draft': 'Borrador',
    'in_progress': 'En Proceso',
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hrm-dark-cyan mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles de la vacante...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vacante no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">La vacante que estás buscando no existe o ha sido eliminada.</p>
            <Button asChild>
              <a href="/admin/jobs" onClick={handleNavigate("/admin/jobs")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a vacantes
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between">
        <Button variant="outline" asChild>
          <a href="/admin/jobs" onClick={handleNavigate("/admin/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a vacantes
          </a>
        </Button>
        <Button asChild className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue">
          <a href={`/admin/jobs/${job.id}/edit`} onClick={handleNavigate(`/admin/jobs/${job.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar vacante
          </a>
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
              <Badge className={
                job.status === 'open' ? 'bg-hrm-dark-green/20 text-hrm-dark-green' :
                job.status === 'closed' ? 'bg-red-100 text-red-800' :
                job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }>
                {jobStatusLabels[job.status as keyof typeof jobStatusLabels] || 'Abierta'}
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
            <div className="flex items-center text-gray-600">
              <Users className="mr-2 h-5 w-5" />
              <span>{applicantCount} {applicantCount === 1 ? 'Candidato' : 'Candidatos'}</span>
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
          <Button 
            size="lg" 
            className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" 
            asChild
          >
            <a href={`/admin/candidates?job=${job.id}`} onClick={handleNavigate(`/admin/candidates?job=${job.id}`)}>
              Ver candidatos
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default JobDetail;
