
import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobCard, { JobType } from '@/components/jobs/JobCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const JobsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch jobs from Supabase
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('jobs')
          .select('*');
        
        if (error) {
          console.error('Error fetching jobs:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las vacantes disponibles.",
            variant: "destructive"
          });
          return;
        }
        
        // Transformar los datos para que coincidan con el tipo JobType
        const transformedJobs = data?.map(job => ({
          ...job,
          applicants: 0, // Inicializa con 0 si no hay datos
          createdAt: job.created_at ? new Date(job.created_at) : new Date(), // Convertir string a Date
        })) || [];
        
        setJobs(transformedJobs);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [toast]);
  
  const filteredJobs = jobs.filter(job => 
    (job.status === 'open') &&
    (searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.department?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (locationFilter === 'all' || job.location?.includes(locationFilter)) &&
    (departmentFilter === 'all' || job.department === departmentFilter)
  );

  // Extract unique departments and locations for filters
  const departments = Array.from(new Set(jobs.map(job => job.department || '').filter(Boolean)));
  const locations = Array.from(new Set(jobs.map(job => job.location || '').filter(Boolean)));

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
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Cargando vacantes...</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default JobsList;
