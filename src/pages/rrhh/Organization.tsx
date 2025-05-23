
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Pencil, Trash2, Download } from "lucide-react";
import { employeeService, Employee } from "@/services/employeeService";
import OrganizationChart from "@/components/organization/OrganizationChart";
import EmployeeDialog from "@/components/organization/EmployeeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Organization = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const isAdmin = role === "admin" || role === "manager";

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
      
      console.log("Employees fetched:", data);
      
      // Extract unique locations and departments
      if (data.length > 0) {
        const uniqueLocations = [...new Set(data.map(emp => emp.work_location))];
        const uniqueDepartments = [...new Set(data.map(emp => emp.department).filter(Boolean))];
        
        setLocations(uniqueLocations.sort());
        setDepartments(uniqueDepartments.sort() as string[]);
      }

    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error al cargar los empleados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Search and filter employees
  useEffect(() => {
    let result = [...employees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        emp =>
          emp.first_name.toLowerCase().includes(query) ||
          emp.last_name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          (emp.position && emp.position.toLowerCase().includes(query))
      );
    }
    
    if (filterLocation) {
      result = result.filter(emp => emp.work_location === filterLocation);
    }
    
    if (filterDepartment) {
      result = result.filter(emp => emp.department === filterDepartment);
    }
    
    setFilteredEmployees(result);
  }, [employees, searchQuery, filterLocation, filterDepartment]);

  // Handle employee actions
  const handleAddEmployee = () => {
    setCurrentEmployee(null);
    setDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setDialogOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar a este empleado?")) {
      try {
        await employeeService.deleteEmployee(id);
        toast.success("Empleado eliminado correctamente");
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Error al eliminar el empleado");
      }
    }
  };

  const handleDialogClose = (refetch?: boolean) => {
    setDialogOpen(false);
    if (refetch) {
      fetchEmployees();
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Nombre",
      "Apellido",
      "Email",
      "Estado",
      "Tipo de Empleo",
      "Ubicación",
      "Departamento",
      "Equipo",
      "Posición"
    ];
    
    const csvRows = [
      headers.join(","),
      ...filteredEmployees.map(emp => [
        emp.first_name,
        emp.last_name,
        emp.email,
        emp.status,
        emp.employment_type,
        emp.work_location,
        emp.department || "",
        emp.team || "",
        emp.position || ""
      ].map(cell => `"${cell}"`).join(","))
    ];
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", "empleados.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterLocation("");
    setFilterDepartment("");
  };

  // Transform data for organization chart - Now this will be compatible with the updated Employee interface
  const chartData = employees.map(emp => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    position: emp.position || "",
    department: emp.department || "",
    manager: null, // This would need to be defined in your database
    avatar: null // This would be the employee's avatar if available
  }));

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Organización</h1>
        
        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list">Lista de Empleados</TabsTrigger>
              <TabsTrigger value="chart">Organigrama</TabsTrigger>
            </TabsList>
            
            {isAdmin && (
              <Button onClick={handleAddEmployee} className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            )}
          </div>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar empleados..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las ubicaciones</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los departamentos</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={resetFilters} className="h-10">
                      <X className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                    
                    <Button variant="outline" onClick={exportToCSV} className="h-10">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableCaption>
                      {isLoading 
                        ? "Cargando empleados..." 
                        : filteredEmployees.length === 0 
                          ? "No hay empleados para mostrar" 
                          : `Total: ${filteredEmployees.length} empleados`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Nombre completo</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Posición</TableHead>
                        {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                            Cargando...
                          </TableCell>
                        </TableRow>
                      ) : filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="text-center">
                            No hay empleados para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{employee.work_location}</TableCell>
                            <TableCell>{employee.department || "-"}</TableCell>
                            <TableCell>{employee.position || "-"}</TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditEmployee(employee)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chart">
            <Card>
              <CardContent className="p-4">
                <OrganizationChart data={chartData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <EmployeeDialog 
          open={dialogOpen} 
          onClose={handleDialogClose} 
          employee={currentEmployee} 
        />
      </div>
    </Layout>
  );
};

export default Organization;
