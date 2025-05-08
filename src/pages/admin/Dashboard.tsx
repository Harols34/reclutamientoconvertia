
import React, { useState, useEffect } from 'react';
import { Calendar, File, User, Users } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      title: 'Candidatos Totales',
      value: 0,
      icon: Users,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Vacantes Activas',
      value: 0,
      icon: File,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Entrevistas Programadas',
      value: 0,
      icon: Calendar,
      trend: { value: 0, isPositive: false },
    },
    {
      title: 'Contrataciones este Mes',
      value: 0,
      icon: User,
      trend: { value: 0, isPositive: true },
    },
  ]);
  
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [popularJobs, setPopularJobs] = useState([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState([]);
  
  // Función para cargar los datos del dashboard
  const loadDashboardData = async () => {
    try {
      // Obtener conteo de candidatos
      const { count: candidatesCount, error: candidatesError } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });
      
      if (candidatesError) throw candidatesError;
      
      // Obtener vacantes activas
      const { count: activeJobsCount, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      if (jobsError) throw jobsError;
      
      // Obtener entrevistas programadas (aplicaciones en estado 'interview')
      const { count: interviewsCount, error: interviewsError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'interview');
      
      if (interviewsError) throw interviewsError;
      
      // Obtener contrataciones del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { count: hiresCount, error: hiresError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hired')
        .gte('updated_at', firstDayOfMonth);
      
      if (hiresError) throw hiresError;
      
      // Actualizar los estados con los datos obtenidos
      setStats([
        {
          title: 'Candidatos Totales',
          value: candidatesCount || 0,
          icon: Users,
          trend: { value: 12, isPositive: true }, // Valor estático por ahora
        },
        {
          title: 'Vacantes Activas',
          value: activeJobsCount || 0,
          icon: File,
          trend: { value: 5, isPositive: true }, // Valor estático por ahora
        },
        {
          title: 'Entrevistas Programadas',
          value: interviewsCount || 0,
          icon: Calendar,
          trend: { value: 3, isPositive: false }, // Valor estático por ahora
        },
        {
          title: 'Contrataciones este Mes',
          value: hiresCount || 0,
          icon: User,
          trend: { value: 25, isPositive: true }, // Valor estático por ahora
        },
      ]);
      
      // Cargar candidatos recientes
      const { data: recentCandidatesData, error: recentCandidatesError } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentCandidatesError) throw recentCandidatesError;
      setRecentCandidates(recentCandidatesData || []);
      
      // Cargar vacantes populares
      const { data: popularJobsData, error: popularJobsError } = await supabase
        .rpc('get_jobs_with_application_count')
        .limit(5);
      
      if (popularJobsError) {
        // Fallback si la función RPC no existe
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, department, created_at, status')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);
        
        setPopularJobs(jobsData || []);
      } else {
        setPopularJobs(popularJobsData || []);
      }
      
      // Cargar datos para el gráfico de aplicaciones por estado
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('status');
      
      if (applicationsError) throw applicationsError;
      
      // Agrupar aplicaciones por estado
      const statusCounts = {};
      applicationsData?.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });
      
      // Convertir a formato para el gráfico
      const chartData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status]
      }));
      
      setApplicationsByStatus(chartData);
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    }
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    
    // Configurar suscripción en tiempo real para cambios en las tablas
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'candidates' }, 
        () => loadDashboardData())
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' }, 
        () => loadDashboardData())
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'applications' }, 
        () => loadDashboardData())
      .subscribe();
    
    // Limpiar suscripción
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Función para determinar el color de estado
  const getStatusColor = (status) => {
    const statusColors = {
      'open': 'bg-hrm-dark-green/20 text-hrm-dark-green',
      'closed': 'bg-red-100 text-red-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'new': 'bg-blue-100 text-blue-800',
      'interview': 'bg-purple-100 text-purple-800',
      'hired': 'bg-green-100 text-green-800',
      'rejected': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      <div className="mt-8">
        <Card className="bg-white p-4 rounded-lg shadow-sm border border-hrm-light-gray">
          <CardHeader>
            <CardTitle>Aplicaciones por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsByStatus.length > 0 ? (
              <ChartContainer 
                className="h-[300px]" 
                config={{
                  new: { color: 'rgb(59 130 246)' },
                  interview: { color: 'rgb(147 51 234)' },
                  hired: { color: 'rgb(22 163 74)' },
                  rejected: { color: 'rgb(239 68 68)' }
                }}
              >
                <ResponsiveContainer>
                  <BarChart data={applicationsByStatus} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />} 
                    />
                    <Legend />
                    <Bar dataKey="count" name="Cantidad" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-gray-500 py-6">No hay datos de aplicaciones disponibles.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-hrm-light-gray">
          <h2 className="section-title mb-4">Candidatos Recientes</h2>
          {recentCandidates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{`${candidate.first_name} ${candidate.last_name}`}</TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>{formatDate(candidate.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-sm">No hay candidatos recientes.</p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-hrm-light-gray">
          <h2 className="section-title mb-4">Vacantes Populares</h2>
          {popularJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-sm">No hay vacantes disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
