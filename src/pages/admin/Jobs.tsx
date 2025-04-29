
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter } from 'lucide-react';
import JobCard, { JobType } from '@/components/jobs/JobCard';
import { Link } from 'react-router-dom';

// Sample data - in a real app, this would come from your API
const mockJobs: JobType[] = [
  {
    id: 'd0b13a73-3833-4b50-8e27-54e5f21c6df2',
    title: 'Asesor de Ventas',
    department: 'Ventas',
    location: 'Bogotá, Colombia',
    type: 'full-time',
    status: 'open',
    createdAt: new Date('2023-04-15'),
    applicants: 12,
  },
  {
    id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    title: 'Desarrollador Frontend',
    department: 'Tecnología',
    location: 'Remoto',
    type: 'full-time',
    status: 'open',
    createdAt: new Date('2023-04-18'),
    applicants: 28,
  },
  {
    id: 'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6',
    title: 'Analista de Recursos Humanos',
    department: 'RRHH',
    location: 'Ciudad de México, México',
    type: 'part-time',
    status: 'open',
    createdAt: new Date('2023-04-20'),
    applicants: 8,
  },
  {
    id: 'z1x2c3v4-b5n6-m7k8-l9j0-h1g2f3d4s5a6',
    title: 'Diseñador UX/UI',
    department: 'Diseño',
    location: 'Madrid, España',
    type: 'contract',
    status: 'closed',
    createdAt: new Date('2023-03-10'),
    applicants: 15,
  },
  {
    id: 'p1o2i3u4-y5t6-r7e8-w9q0-a1z2x3c4v5b6',
    title: 'Gerente de Marketing',
    department: 'Marketing',
    location: 'Remoto',
    type: 'full-time',
    status: 'draft',
    createdAt: new Date('2023-04-25'),
    applicants: 0,
  }
];

const Jobs = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Vacantes</h1>
        <Button className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" asChild>
          <Link to="/admin/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Vacante
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas ({mockJobs.length})</TabsTrigger>
            <TabsTrigger value="open">Abiertas ({mockJobs.filter(j => j.status === 'open').length})</TabsTrigger>
            <TabsTrigger value="closed">Cerradas ({mockJobs.filter(j => j.status === 'closed').length})</TabsTrigger>
            <TabsTrigger value="draft">Borradores ({mockJobs.filter(j => j.status === 'draft').length})</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="ml-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockJobs.map((job) => (
                <JobCard key={job.id} job={job} isAdmin={true} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="open" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockJobs.filter(j => j.status === 'open').map((job) => (
                <JobCard key={job.id} job={job} isAdmin={true} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="closed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockJobs.filter(j => j.status === 'closed').map((job) => (
                <JobCard key={job.id} job={job} isAdmin={true} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="draft" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockJobs.filter(j => j.status === 'draft').map((job) => (
                <JobCard key={job.id} job={job} isAdmin={true} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Jobs;
