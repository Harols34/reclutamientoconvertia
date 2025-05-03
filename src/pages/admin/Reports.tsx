
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PlusCircle, Download, BarChart, Users, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  name: string;
  type: string;
  created_at: string;
  result: any;
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setReports(data || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los reportes.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [toast]);

  const generateReport = async (type: string) => {
    try {
      setLoading(true);
      
      // Generate default report data
      const reportData = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${format(new Date(), 'yyyy-MM-dd')}`,
        type,
        parameters: {},
        result: {
          summary: "Este es un reporte de ejemplo",
          data: []
        }
      };
      
      // Insert the report into Supabase
      const { data, error } = await supabase
        .from('reports')
        .insert([reportData])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Reporte generado",
        description: "El reporte se ha generado correctamente.",
      });
      
      // Add the new report to the list
      if (data && data[0]) {
        setReports(prev => [data[0], ...prev]);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el reporte.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'candidates':
        return <Users className="h-6 w-6 text-blue-500" />;
      case 'vacancies':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'analytics':
        return <BarChart className="h-6 w-6 text-purple-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div>
      <h1 className="page-title">Reportes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Reporte de Candidatos</CardTitle>
            <Users className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera un informe detallado de todos los candidatos y sus aplicaciones.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('candidates')}
              disabled={loading}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Reporte de Vacantes</CardTitle>
            <FileText className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera un informe sobre las vacantes activas y su rendimiento.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('vacancies')}
              disabled={loading}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Análisis de Contrataciones</CardTitle>
            <BarChart className="h-6 w-6 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera estadísticas y análisis sobre el proceso de contratación.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('analytics')}
              disabled={loading}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reportes Generados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getReportIcon(report.type)}
                          <span className="ml-2">{report.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      No hay reportes generados aún. Crea uno utilizando los botones arriba.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
