
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, mockUsers } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Si llega con datos de la página principal, prellenar los campos
  useEffect(() => {
    if (location.state?.email && location.state?.password) {
      setEmail(location.state.email);
      setPassword(location.state.password);
    }
  }, [location.state]);

  // Si ya está autenticado, redirigir al dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Por favor, complete todos los campos");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Credenciales incorrectas");
      toast.error("Error de inicio de sesión: " + (error.message || "Credenciales incorrectas"));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <div className="flex justify-center mb-8">
          <img src="/logo-convertia.png" alt="Convertia Logo" className="h-12" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-gray-500 text-center">
              ¿Olvidó su contraseña? <a href="#" className="text-teal-600 hover:underline">Recuperar</a>
            </div>
            
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Usuarios de prueba</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 gap-2">
                {mockUsers.map((user) => (
                  <Button 
                    key={user.id}
                    variant="outline" 
                    type="button"
                    onClick={() => loginAsDemoUser(user.email, user.password)}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}: {user.email}
                  </Button>
                ))}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
