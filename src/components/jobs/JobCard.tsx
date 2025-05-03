
import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export interface JobType {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  status: 'open' | 'in_progress' | 'closed' | 'draft';
  created_at?: string; // Cambiado de createdAt a created_at para coincidir con Supabase
  createdAt?: Date; // Mantenido por compatibilidad con código existente
  updated_at?: string;
  applicants?: number;
  applications?: Array<any>; // Para manejar la relación en consultas join
  description?: string;
  requirements?: string | null;
  responsibilities?: string | null;
  salary_range?: string | null;
  campaign_id?: string | null;
}

interface JobCardProps {
  job: JobType;
  isAdmin?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, isAdmin = false }) => {
  const jobStatusColors = {
    open: 'bg-hrm-dark-green/20 text-hrm-dark-green',
    closed: 'bg-red-100 text-red-800',
    draft: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
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

  // Función para manejar las diferentes formas en que puede venir la fecha
  const getFormattedDate = () => {
    if (job.createdAt instanceof Date) {
      return job.createdAt.toLocaleDateString();
    } else if (job.created_at) {
      return new Date(job.created_at).toLocaleDateString();
    } else {
      return 'Fecha desconocida';
    }
  };

  // Cantidad de postulantes (puede venir de diferentes fuentes)
  const applicantsCount = job.applicants || (job.applications?.length || 0);

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-hrm-dark-cyan">
              {job.title}
            </CardTitle>
            <p className="text-sm text-gray-500">{job.department}</p>
          </div>
          <Badge className={jobStatusColors[job.status] || jobStatusColors.open}>
            {jobStatusLabels[job.status] || 'Abierta'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Publicado: {getFormattedDate()}</span>
          </div>
          {(isAdmin || job.status === 'open') && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="mr-2 h-4 w-4" />
              <span>{applicantsCount} {applicantsCount === 1 ? 'Candidato' : 'Candidatos'}</span>
            </div>
          )}
          <div className="mt-3">
            <Badge variant="outline" className="text-xs">
              {jobTypeLabels[job.type] || 'Tiempo Completo'}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {isAdmin ? (
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-hrm-steel-blue text-hrm-steel-blue hover:bg-hrm-steel-blue hover:text-white"
              asChild
            >
              <Link to={`/admin/jobs/${job.id}`}>Ver detalles</Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-hrm-dark-cyan text-hrm-dark-cyan hover:bg-hrm-dark-cyan hover:text-white"
              asChild
            >
              <Link to={`/admin/jobs/${job.id}/edit`}>Editar</Link>
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            asChild
          >
            <Link to={`/postularse/${job.id}`}>Postularse</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
