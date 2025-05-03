
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, FileText, BarChart, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  description?: string;
  status: string;
  created_at: string;
  jobs?: any[];
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('campaigns')
          .select('*, jobs(id, title, status)')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching campaigns:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las campañas.",
          });
          return;
        }
        
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [toast]);

  const calculateProgress = (campaign: Campaign) => {
    if (!campaign.jobs || campaign.jobs.length === 0) return 0;
    
    const closedJobs = campaign.jobs.filter(job => job.status === 'closed').length;
    return Math.round((closedJobs / campaign.jobs.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activa</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completada</Badge>;
      case 'planned': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Planificada</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Campañas de Contratación</h1>
        <Button className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" asChild>
          <Link to="/admin/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Campañas</CardTitle>
                <CardDescription>Todas las campañas de contratación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-10 w-10 text-hrm-dark-cyan mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{campaigns.length}</p>
                    <p className="text-sm text-gray-500">Campañas gestionadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Vacantes Activas</CardTitle>
                <CardDescription>En todas las campañas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-10 w-10 text-hrm-steel-blue mr-4" />
                  <div>
                    <p className="text-3xl font-bold">
                      {campaigns.reduce((acc, campaign) => {
                        return acc + (campaign.jobs?.filter(job => job.status === 'open').length || 0);
                      }, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Vacantes abiertas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tasa de Éxito</CardTitle>
                <CardDescription>Promedio de campañas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">
                      {campaigns.length > 0 
                        ? Math.round(campaigns.reduce((acc, campaign) => acc + calculateProgress(campaign), 0) / campaigns.length)
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Tasa de completado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Campañas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Vacantes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length > 0 ? (
                      campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">
                            <Link to={`/admin/campaigns/${campaign.id}`} className="hover:text-hrm-dark-cyan">
                              {campaign.name}
                            </Link>
                            {campaign.description && (
                              <p className="text-sm text-gray-500 truncate max-w-[250px]">{campaign.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>
                                <Calendar className="inline h-4 w-4 mr-1 text-gray-500" /> 
                                {format(new Date(campaign.start_date), 'dd/MM/yyyy')}
                              </p>
                              {campaign.end_date && (
                                <p className="text-gray-500">
                                  hasta {format(new Date(campaign.end_date), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-hrm-steel-blue" />
                              <span className="font-medium">
                                {campaign.jobs ? campaign.jobs.length : 0}
                              </span>
                              {campaign.jobs && campaign.jobs.length > 0 && (
                                <span className="text-sm text-gray-500 ml-1">
                                  ({campaign.jobs.filter(job => job.status === 'open').length} abiertas)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(campaign.status)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  Progreso: {calculateProgress(campaign)}%
                                </span>
                              </div>
                              <Progress value={calculateProgress(campaign)} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/campaigns/${campaign.id}`}>
                                Ver detalle
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                          No hay campañas disponibles. Crea una nueva campaña para comenzar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Campaigns;
