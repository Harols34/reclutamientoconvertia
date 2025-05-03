
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_years?: number;
  skills?: string[];
  created_at: string;
  applications?: Array<any>;
}

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('candidates')
          .select('*, applications(id, job_id, status)')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching candidates:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los candidatos.",
            variant: "destructive"
          });
          return;
        }
        
        setCandidates(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, [toast]);

  const getStatusBadge = (statusCount: number) => {
    if (statusCount === 0) return 'text-gray-500';
    if (statusCount <= 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const filteredCandidates = (tab: string) => {
    if (tab === 'all') return candidates;
    if (tab === 'active') return candidates.filter(c => c.applications && c.applications.length > 0);
    if (tab === 'new') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return candidates.filter(c => new Date(c.created_at) >= oneWeekAgo);
    }
    return candidates;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Candidatos</h1>
        <Button className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" asChild>
          <Link to="/admin/candidates/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Candidato
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos ({candidates.length})</TabsTrigger>
            <TabsTrigger value="active">Activos ({candidates.filter(c => c.applications && c.applications.length > 0).length})</TabsTrigger>
            <TabsTrigger value="new">Nuevos</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" className="ml-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>

          <TabsContent value="all">
            <CandidatesTable candidates={filteredCandidates('all')} loading={loading} />
          </TabsContent>
          
          <TabsContent value="active">
            <CandidatesTable candidates={filteredCandidates('active')} loading={loading} />
          </TabsContent>
          
          <TabsContent value="new">
            <CandidatesTable candidates={filteredCandidates('new')} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface CandidatesTableProps {
  candidates: Candidate[];
  loading: boolean;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ candidates, loading }) => {
  return (
    <div className="mt-6">
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Experiencia</TableHead>
                  <TableHead>Habilidades</TableHead>
                  <TableHead>Aplicaciones</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">
                        <Link to={`/admin/candidates/${candidate.id}`} className="hover:text-hrm-dark-cyan">
                          {candidate.first_name} {candidate.last_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{candidate.email}</span>
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{candidate.phone}</span>
                            </div>
                          )}
                          {candidate.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{candidate.location}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.experience_years ? `${candidate.experience_years} años` : 'No especificada'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills && candidate.skills.length > 0 ? 
                            candidate.skills.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))
                            : 'No especificadas'}
                          {candidate.skills && candidate.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`font-medium ${candidate.applications && candidate.applications.length > 0 
                            ? 'text-hrm-dark-cyan' 
                            : 'text-gray-500'}`}
                        >
                          {candidate.applications ? candidate.applications.length : 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(candidate.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/candidates/${candidate.id}`}>
                            Ver detalles
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      No hay candidatos disponibles en esta sección.
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

export default Candidates;
