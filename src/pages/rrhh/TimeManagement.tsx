
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Play, 
  Square, 
  Clock, 
  Calendar, 
  User,
  Users,
  Plus,
  Eye,
  Check,
  X
} from "lucide-react";
import { format, parseISO, differenceInHours, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { timeManagementService, TimeRecord, TimeStatistics } from "@/services/timeManagementService";
import { absenceService, Absence } from "@/services/absenceService";
import { BarChart } from "@/components/ui/chart";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import AbsenceRequestDialog from "@/components/absence/AbsenceRequestDialog";
import AbsenceApprovalDialog from "@/components/absence/AbsenceApprovalDialog";
import { Badge } from "@/components/ui/badge";

const TimeManagement = () => {
  const { user, role } = useAuth();
  const [activeRecord, setActiveRecord] = useState<TimeRecord | null>(null);
  const [history, setHistory] = useState<TimeRecord[]>([]);
  const [allRecords, setAllRecords] = useState<TimeRecord[]>([]);
  const [teamRecords, setTeamRecords] = useState<TimeRecord[]>([]);
  const [statistics, setStatistics] = useState<TimeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockInDescription, setClockInDescription] = useState("");
  
  const [activeTab, setActiveTab] = useState("my-time");
  const [absencesTab, setAbsencesTab] = useState("my-absences");
  
  const [userAbsences, setUserAbsences] = useState<Absence[]>([]);
  const [teamAbsences, setTeamAbsences] = useState<Absence[]>([]);
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  
  const [absenceRequestDialogOpen, setAbsenceRequestDialogOpen] = useState(false);
  const [absenceApprovalDialogOpen, setAbsenceApprovalDialogOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const canViewTeamTime = isAdmin || isManager;
  const canApproveAbsences = isAdmin || isManager;

  useEffect(() => {
    if (user) {
      loadUserData();
      loadUserAbsences();
      
      if (canViewTeamTime) {
        if (isAdmin) {
          loadAllRecords();
          loadAllAbsences();
        }
        if (isManager) {
          loadTeamRecords();
          loadTeamAbsences();
        }
      }
    }
  }, [user, role]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load active record if exists
      const active = await timeManagementService.getActiveRecord(user!.id);
      setActiveRecord(active);
      
      // Load history
      const records = await timeManagementService.getUserTimeRecords(user!.id);
      setHistory(records);
      
      // Load statistics
      const stats = await timeManagementService.calculateUserStatistics(user!.id);
      setStatistics(stats);
      
    } catch (error) {
      console.error("Error loading time data:", error);
      toast.error("Error al cargar datos de tiempo");
    } finally {
      setLoading(false);
    }
  };

  const loadAllRecords = async () => {
    try {
      const records = await timeManagementService.getAllTimeRecords();
      setAllRecords(records);
    } catch (error) {
      console.error("Error loading all time records:", error);
      toast.error("Error al cargar registros de todos los empleados");
    }
  };

  const loadTeamRecords = async () => {
    if (!user) return;
    
    try {
      const records = await timeManagementService.getTeamTimeRecords(user.id);
      setTeamRecords(records);
    } catch (error) {
      console.error("Error loading team time records:", error);
      toast.error("Error al cargar registros del equipo");
    }
  };

  const loadUserAbsences = async () => {
    if (!user) return;
    
    try {
      const absences = await absenceService.getUserAbsences(user.id);
      setUserAbsences(absences);
    } catch (error) {
      console.error("Error loading user absences:", error);
      toast.error("Error al cargar ausencias");
    }
  };

  const loadTeamAbsences = async () => {
    if (!user) return;
    
    try {
      const absences = await absenceService.getTeamAbsences(user.id);
      setTeamAbsences(absences);
    } catch (error) {
      console.error("Error loading team absences:", error);
      toast.error("Error al cargar ausencias del equipo");
    }
  };

  const loadAllAbsences = async () => {
    try {
      const absences = await absenceService.getAllAbsences();
      setAllAbsences(absences);
    } catch (error) {
      console.error("Error loading all absences:", error);
      toast.error("Error al cargar todas las ausencias");
    }
  };

  const handleClockIn = async () => {
    if (!user) return;
    
    try {
      const record = await timeManagementService.clockIn(user.id, clockInDescription || undefined);
      setActiveRecord(record);
      setClockInDescription("");
      toast.success("Has iniciado tu jornada");
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error("Error al iniciar jornada");
    }
  };

  const handleClockOut = async () => {
    if (!activeRecord) return;
    
    try {
      await timeManagementService.clockOut(activeRecord.id);
      toast.success("Has finalizado tu jornada");
      
      // Reload data
      loadUserData();
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error("Error al finalizar jornada");
    }
  };

  const handleRequestAbsence = () => {
    setAbsenceRequestDialogOpen(true);
  };

  const handleAbsenceRequestClose = (refetch?: boolean) => {
    setAbsenceRequestDialogOpen(false);
    if (refetch) {
      loadUserAbsences();
      if (isAdmin) loadAllAbsences();
      if (isManager) loadTeamAbsences();
    }
  };

  const handleViewAbsence = (absence: Absence) => {
    setSelectedAbsence(absence);
    setAbsenceApprovalDialogOpen(true);
  };

  const handleAbsenceApprovalClose = (refetch?: boolean) => {
    setAbsenceApprovalDialogOpen(false);
    setSelectedAbsence(null);
    if (refetch) {
      loadUserAbsences();
      if (isAdmin) loadAllAbsences();
      if (isManager) loadTeamAbsences();
    }
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) {
      const now = new Date();
      const start = parseISO(checkIn);
      const hours = differenceInHours(now, start);
      const minutes = differenceInMinutes(now, start) % 60;
      return `${hours}h ${minutes}m`;
    }
    
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
  };

  const getAbsenceStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprobada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rechazada</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelada</Badge>;
      default:
        return <Badge className="bg-amber-500">Pendiente</Badge>;
    }
  };

  const isAbsenceActive = (absence: Absence) => {
    const now = new Date();
    const startDate = parseISO(absence.start_date);
    const endDate = parseISO(absence.end_date);
    
    return (
      absence.status === 'approved' && 
      !isBefore(endDate, now) && 
      !isAfter(startDate, now)
    );
  };

  const chartData = statistics ? {
    labels: statistics.weeklyHours.map(d => d.day),
    datasets: [
      {
        label: "Horas",
        data: statistics.weeklyHours.map(d => d.hours),
        backgroundColor: "rgba(37, 99, 235, 0.8)",
      },
    ],
  } : undefined;

  const renderTimeRecords = (records: TimeRecord[]) => {
    if (records.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-6">
            No hay registros para mostrar
          </TableCell>
        </TableRow>
      );
    }

    return records.map((record) => (
      <TableRow key={record.id}>
        <TableCell>
          {record.employee ? 
            `${record.employee.first_name} ${record.employee.last_name}` : 
            "Tu registro"}
        </TableCell>
        <TableCell>{format(parseISO(record.check_in), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
        <TableCell>
          {record.check_out 
            ? format(parseISO(record.check_out), "dd/MM/yyyy HH:mm", { locale: es }) 
            : "En curso"}
        </TableCell>
        <TableCell>{formatDuration(record.check_in, record.check_out)}</TableCell>
        <TableCell>{record.description || "-"}</TableCell>
      </TableRow>
    ));
  };

  const renderAbsences = (absences: Absence[], canApprove: boolean = false) => {
    if (absences.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={canApprove ? 6 : 5} className="text-center py-6">
            No hay ausencias para mostrar
          </TableCell>
        </TableRow>
      );
    }

    return absences.map((absence) => (
      <TableRow 
        key={absence.id}
        className={isAbsenceActive(absence) ? "bg-green-50" : ""}
      >
        {canApprove && (
          <TableCell>
            {absence.profile?.full_name || "Usuario"}
          </TableCell>
        )}
        <TableCell>{absence.absence_type?.name || "Ausencia"}</TableCell>
        <TableCell>{formatDate(absence.start_date)}</TableCell>
        <TableCell>{formatDate(absence.end_date)}</TableCell>
        <TableCell>{getAbsenceStatusBadge(absence.status)}</TableCell>
        <TableCell>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleViewAbsence(absence)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {canApprove && absence.status === 'pending' && (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-green-500"
                onClick={() => {
                  setSelectedAbsence(absence);
                  absenceService.approveAbsence(absence.id).then(() => {
                    toast.success("Ausencia aprobada");
                    if (isAdmin) loadAllAbsences();
                    if (isManager) loadTeamAbsences();
                  });
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-red-500"
                onClick={() => {
                  setSelectedAbsence(absence);
                  absenceService.rejectAbsence(absence.id).then(() => {
                    toast.success("Ausencia rechazada");
                    if (isAdmin) loadAllAbsences();
                    if (isManager) loadTeamAbsences();
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Gestión de Tiempo</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="my-time">
              <Clock className="h-4 w-4 mr-2" />
              Control de Tiempo
            </TabsTrigger>
            
            <TabsTrigger value="absences">
              <Calendar className="h-4 w-4 mr-2" />
              Ausencias y Permisos
            </TabsTrigger>
          </TabsList>
          
          {/* Control de Tiempo Tab */}
          <TabsContent value="my-time">
            <Tabs value={canViewTeamTime ? "my-records" : "records"} onValueChange={() => {}}>
              <TabsList className="mb-4">
                <TabsTrigger value="my-records" onClick={() => setActiveTab("my-time")}>
                  <User className="h-4 w-4 mr-2" />
                  Mi Tiempo
                </TabsTrigger>
                
                {canViewTeamTime && (
                  <TabsTrigger value="team-records" onClick={() => setActiveTab("team-time")}>
                    <Users className="h-4 w-4 mr-2" />
                    {isAdmin ? "Todos los Empleados" : "Mi Equipo"}
                  </TabsTrigger>
                )}
              </TabsList>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Control de Jornada</CardTitle>
                    <CardDescription>
                      Registra tu entrada y salida diaria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeRecord ? (
                      <div>
                        <div className="flex items-center mb-4 text-green-600">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="font-medium">
                            Jornada iniciada: {format(parseISO(activeRecord.check_in), "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Duración actual:</p>
                          <p className="text-2xl font-bold">
                            {formatDuration(activeRecord.check_in, null)}
                          </p>
                        </div>
                        
                        {activeRecord.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">Descripción:</p>
                            <p className="text-sm">{activeRecord.description}</p>
                          </div>
                        )}
                        
                        <Button onClick={handleClockOut} className="w-full">
                          <Square className="h-4 w-4 mr-2" />
                          Finalizar Jornada
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4 text-gray-600">
                          No tienes ninguna jornada activa. Inicia tu jornada laboral.
                        </p>
                        
                        <div className="mb-4">
                          <Textarea
                            placeholder="Descripción (opcional)"
                            value={clockInDescription}
                            onChange={(e) => setClockInDescription(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        
                        <Button onClick={handleClockIn} className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Jornada
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen Mensual</CardTitle>
                    <CardDescription>
                      Estadísticas de los últimos 30 días
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p>Cargando estadísticas...</p>
                    ) : !statistics ? (
                      <p>No hay datos disponibles</p>
                    ) : (
                      <div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-500">Total de Horas</p>
                            <p className="text-2xl font-bold">{statistics.totalHours}h</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Promedio Diario</p>
                            <p className="text-2xl font-bold">{statistics.averageHoursPerDay}h</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Días Registrados</p>
                            <p className="text-2xl font-bold">{statistics.totalDays}</p>
                          </div>
                        </div>
                        
                        {chartData && (
                          <div className="h-60">
                            <BarChart data={chartData} />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Jornadas</CardTitle>
                  <CardDescription>
                    Tus registros recientes de tiempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Entrada</TableHead>
                          <TableHead>Salida</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              Cargando registros...
                            </TableCell>
                          </TableRow>
                        ) : (
                          renderTimeRecords(history)
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {canViewTeamTime && activeTab === "team-time" && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      {isAdmin ? "Registros de Todos los Empleados" : "Registros de Mi Equipo"}
                    </CardTitle>
                    <CardDescription>
                      {isAdmin 
                        ? "Visualiza y gestiona el tiempo de todos los empleados" 
                        : "Visualiza el tiempo de los miembros de tu equipo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Salida</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Descripción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isAdmin ? (
                            renderTimeRecords(allRecords)
                          ) : (
                            renderTimeRecords(teamRecords)
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Tabs>
          </TabsContent>
          
          {/* Ausencias Tab */}
          <TabsContent value="absences">
            <Tabs value={absencesTab} onValueChange={setAbsencesTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="my-absences">
                    <User className="h-4 w-4 mr-2" />
                    Mis Ausencias
                  </TabsTrigger>
                  
                  {canApproveAbsences && (
                    <TabsTrigger value="team-absences">
                      <Users className="h-4 w-4 mr-2" />
                      {isAdmin ? "Todas las Ausencias" : "Ausencias del Equipo"}
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <Button onClick={handleRequestAbsence}>
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Ausencia
                </Button>
              </div>
              
              <TabsContent value="my-absences">
                <Card>
                  <CardHeader>
                    <CardTitle>Mis Ausencias y Permisos</CardTitle>
                    <CardDescription>
                      Historial de solicitudes y estado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Fecha Fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {renderAbsences(userAbsences)}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {canApproveAbsences && (
                <TabsContent value="team-absences">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isAdmin ? "Todas las Ausencias" : "Ausencias del Equipo"}
                      </CardTitle>
                      <CardDescription>
                        {isAdmin 
                          ? "Gestionar ausencias de todos los empleados" 
                          : "Gestionar ausencias de tu equipo"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empleado</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Fecha Inicio</TableHead>
                              <TableHead>Fecha Fin</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isAdmin 
                              ? renderAbsences(allAbsences, true)
                              : renderAbsences(teamAbsences, true)}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>
        </Tabs>
        
        <AbsenceRequestDialog 
          open={absenceRequestDialogOpen} 
          onClose={handleAbsenceRequestClose} 
        />
        
        <AbsenceApprovalDialog 
          open={absenceApprovalDialogOpen} 
          onClose={handleAbsenceApprovalClose} 
          absence={selectedAbsence}
        />
      </div>
    </Layout>
  );
};

export default TimeManagement;
