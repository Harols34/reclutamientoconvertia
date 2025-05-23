
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { userService, type Permission } from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { user, profile, role, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('collaborator');

  // Load initial data
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmail(user?.email || "");
      setPosition(profile.position || "");
    }
    
    if (role === 'admin') {
      loadUsers();
      loadRolePermissions('collaborator');
    }
  }, [profile, user, role]);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar los usuarios");
    }
  };

  const loadRolePermissions = async (roleName: string) => {
    try {
      setLoading(true);
      const data = await userService.getPermissionsByRole(roleName);
      setPermissions(data);
      setSelectedRole(roleName);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Error al cargar los permisos");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user?.id) return;
    
    try {
      setUpdating(true);
      await updateProfile({
        full_name: name,
        position
      });
      
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setUpdating(false);
    }
  };

  const handlePermissionChange = async (
    moduleName: string,
    permission: keyof Omit<Permission, "role_name" | "module_name">,
    checked: boolean
  ) => {
    try {
      // Find the permission in the state
      const permissionIndex = permissions.findIndex(p => p.module_name === moduleName);
      if (permissionIndex === -1) return;
      
      // Create a new array with the updated permission
      const updatedPermissions = [...permissions];
      updatedPermissions[permissionIndex] = {
        ...updatedPermissions[permissionIndex],
        [permission]: checked
      };
      
      setPermissions(updatedPermissions);
      
      // Update in the database
      await userService.updatePermission(
        selectedRole,
        moduleName,
        { [permission]: checked }
      );
      
      toast.success(`Permiso actualizado correctamente`);
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Error al actualizar el permiso");
      
      // Reload permissions to ensure state is in sync with database
      await loadRolePermissions(selectedRole);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>
        
        <Tabs defaultValue={role === "admin" ? "permissions" : "profile"}>
          <TabsList>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            {role === "admin" && (
              <TabsTrigger value="permissions">Permisos</TabsTrigger>
            )}
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y profesional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        readOnly 
                        disabled 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Puesto</Label>
                      <Input 
                        id="position" 
                        value={position} 
                        onChange={(e) => setPosition(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Input 
                        id="role" 
                        value={role || ""} 
                        readOnly 
                        disabled 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleProfileUpdate}
                      disabled={updating}
                    >
                      {updating ? "Actualizando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de Cuenta</CardTitle>
                  <CardDescription>
                    Gestiona tus preferencias de cuenta y seguridad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Idioma</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language">Idioma del sistema</Label>
                      <Select defaultValue="es">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecciona idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Seguridad</h3>
                    <Button variant="outline">Cambiar contraseña</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sesiones</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sesión actual</p>
                        <p className="text-sm text-gray-500">Iniciada hace 2 horas</p>
                      </div>
                      <Badge>Activa</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {role === "admin" && (
              <TabsContent value="permissions">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Permisos</CardTitle>
                    <CardDescription>
                      Configura los permisos para los diferentes roles del sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <Label htmlFor="role-selector">Seleccionar Rol</Label>
                      <Select 
                        value={selectedRole} 
                        onValueChange={(value) => loadRolePermissions(value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="collaborator">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Módulo</TableHead>
                              <TableHead>Ver</TableHead>
                              <TableHead>Crear</TableHead>
                              <TableHead>Editar</TableHead>
                              <TableHead>Eliminar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissions.map((permission) => (
                              <TableRow key={permission.module_name}>
                                <TableCell className="font-medium">
                                  {permission.module_name.charAt(0).toUpperCase() + permission.module_name.slice(1)}
                                </TableCell>
                                <TableCell>
                                  <Checkbox 
                                    checked={permission.can_view} 
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission.module_name, "can_view", !!checked)
                                    }
                                    disabled={selectedRole === "admin"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox 
                                    checked={permission.can_create} 
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission.module_name, "can_create", !!checked)
                                    }
                                    disabled={selectedRole === "admin"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox 
                                    checked={permission.can_edit} 
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission.module_name, "can_edit", !!checked)
                                    }
                                    disabled={selectedRole === "admin"}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox 
                                    checked={permission.can_delete} 
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(permission.module_name, "can_delete", !!checked)
                                    }
                                    disabled={selectedRole === "admin"}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de Notificaciones</CardTitle>
                  <CardDescription>
                    Configura cómo quieres recibir las notificaciones del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificaciones del sistema</p>
                        <p className="text-sm text-gray-500">Recibir alertas sobre cambios en el sistema</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificaciones de mensajes</p>
                        <p className="text-sm text-gray-500">Recibir alertas cuando recibas un nuevo mensaje</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Recordatorios</p>
                        <p className="text-sm text-gray-500">Recibir recordatorios de tareas pendientes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notificaciones por correo</p>
                        <p className="text-sm text-gray-500">Recibir una copia de las notificaciones por correo</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
