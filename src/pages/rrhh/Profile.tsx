
// src/pages/Profile.tsx
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    position: profile?.position || "",
    department: profile?.department || "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Debes iniciar sesión para actualizar tu perfil");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateProfile(formData);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6 space-y-8">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-teal-100 text-teal-800">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile?.full_name || user?.email}</CardTitle>
                <CardDescription className="mt-1 flex flex-col space-y-1">
                  <span>{profile?.position || "Sin posición"}</span>
                  <span>{profile?.department || "Sin departamento"}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name || ""}
                      onChange={handleChange}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Posición</Label>
                    <Input
                      id="position"
                      name="position"
                      value={formData.position || ""}
                      onChange={handleChange}
                      placeholder="Tu posición en la empresa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleChange}
                      placeholder="Tu departamento"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL de imagen de perfil</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  placeholder="URL de tu imagen de perfil"
                  disabled
                  className="bg-gray-50"
                  value={profile?.avatar_url || ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  La actualización de la imagen de perfil estará disponible próximamente
                </p>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-teal-950 hover:bg-teal-800"
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
