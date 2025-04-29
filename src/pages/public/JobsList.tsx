
import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobCard, { JobType } from '@/components/jobs/JobCard';

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
  }
];

const JobsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const filteredJobs = mockJobs.filter(job => 
    job.status === 'open' &&
    (searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.department.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (locationFilter === 'all' || job.location.includes(locationFilter)) &&
    (departmentFilter === 'all' || job.department === departmentFilter)
  );

  // Extract unique departments and locations for filters
  const departments = Array.from(new Set(mockJobs.map(job => job.department)));
  const locations = Array.from(new Set(mockJobs.map(job => job.location)));

  return (
    <div className="hrm-container">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-hrm-dark-cyan mb-4">Encuentra tu próxima oportunidad</h1>
        <p className="text-xl text-gray-600">Explora nuestras vacantes disponibles y encuentra el trabajo perfecto para ti</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-hrm-light-gray mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-3 md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar vacantes"
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map(department => (
                  <SelectItem key={department} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <h3 className="text-xl font-medium text-gray-600 mb-2">No se encontraron vacantes</h3>
            <p className="text-gray-500 mb-4">Intenta con otros filtros de búsqueda</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('all');
                setDepartmentFilter('all');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;
