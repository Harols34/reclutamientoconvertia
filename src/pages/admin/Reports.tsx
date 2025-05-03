
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
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
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
      setGeneratingReport(type);
      
      // Generate sample report data
      let reportData: any = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${format(new Date(), 'yyyy-MM-dd')}`,
        type,
        parameters: {},
      };
      
      // Create different sample data based on report type
      if (type === 'candidates') {
        reportData.result = {
          summary: "Análisis de candidatos activos",
          total_candidates: 25,
          new_this_month: 8,
          by_skill: {
            "React": 12,
            "Node.js": 9,
            "Python": 7,
            "UI/UX": 5
          },
          data: [
            { name: "Candidato 1", position: "Frontend Developer", status: "Reviewing" },
            { name: "Candidato 2", position: "Backend Developer", status: "Interview" }
          ]
        };
      } else if (type === 'vacancies') {
        reportData.result = {
          summary: "Análisis de vacantes activas",
          total_jobs: 12,
          open_positions: 7,
          most_applied: "Frontend Developer",
          by_department: {
            "Tecnología": 5,
            "Marketing": 3,
            "Ventas": 2,
            "RRHH": 2
          },
          data: [
            { title: "Frontend Developer", applicants: 15, status: "Open" },
            { title: "Marketing Manager", applicants: 8, status: "Open" }
          ]
        };
      } else if (type === 'analytics') {
        reportData.result = {
          summary: "Análisis de contrataciones",
          avg_time_to_hire: "21 días",
          cost_per_hire: "$1,200",
          best_sources: ["LinkedIn", "Indeed", "Referrals"],
          monthly_trend: {
            "Enero": 3,
            "Febrero": 4,
            "Marzo": 2,
            "Abril": 5
          },
          data: [
            { position: "Full Stack Developer", time_to_hire: "18 días", source: "LinkedIn" },
            { position: "Digital Marketing", time_to_hire: "24 días", source: "Indeed" }
          ]
        };
      }
      
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
      setGeneratingReport(null);
    }
  };

  const downloadReport = (report: Report) => {
    try {
      // Create a JSON Blob with the report data
      const data = JSON.stringify(report.result, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Reporte descargado",
        description: "El reporte se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el reporte.",
      });
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
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'candidates' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
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
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'vacancies' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
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
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'analytics' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadReport(report)}
                        >
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
