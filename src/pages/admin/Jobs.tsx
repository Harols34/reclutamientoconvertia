
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Loader2 } from 'lucide-react';
import JobCard, { JobType } from '@/components/jobs/JobCard';
import JobDeleteButton from '@/components/jobs/JobDeleteButton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*, applications(id)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las vacantes.",
          variant: "destructive"
        });
        return;
      }
      
      // Transformar los datos para que coincidan con el tipo JobType
      const transformedJobs: JobType[] = data?.map(job => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        status: job.status as JobType['status'], 
        type: job.type as JobType['type'],
        created_at: job.created_at,
        updated_at: job.updated_at,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        salary_range: job.salary_range,
        campaign_id: job.campaign_id,
        applicants: job.applications?.length || 0,
        createdAt: job.created_at ? new Date(job.created_at) : new Date()
      })) || [];
      
      setJobs(transformedJobs);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Set up subscription for real-time updates
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs' 
        }, 
        () => {
          fetchJobs(); // Refresh data when changes occur
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleJobDeleted = () => {
    fetchJobs();
  };

  const filteredJobs = (tab: string) => {
    if (tab === 'all') return jobs;
    return jobs.filter(job => job.status === tab);
  };

  const renderJobCards = (statusFilter: string) => {
    return (
      <>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs(statusFilter).map((job) => (
              <div key={job.id} className="relative">
                <JobCard job={job} isAdmin={true} />
                <JobDeleteButton 
                  jobId={job.id} 
                  jobTitle={job.title}
                  onDeleted={handleJobDeleted} 
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

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
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({jobs.length})</TabsTrigger>
            <TabsTrigger value="open">Abiertas ({jobs.filter(j => j.status === 'open').length})</TabsTrigger>
            <TabsTrigger value="closed">Cerradas ({jobs.filter(j => j.status === 'closed').length})</TabsTrigger>
            <TabsTrigger value="draft">Borradores ({jobs.filter(j => j.status === 'draft').length})</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="ml-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>

          <TabsContent value="all" className="mt-6">
            {renderJobCards('all')}
          </TabsContent>
          
          <TabsContent value="open" className="mt-6">
            {renderJobCards('open')}
          </TabsContent>
          
          <TabsContent value="closed" className="mt-6">
            {renderJobCards('closed')}
          </TabsContent>
          
          <TabsContent value="draft" className="mt-6">
            {renderJobCards('draft')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Jobs;
