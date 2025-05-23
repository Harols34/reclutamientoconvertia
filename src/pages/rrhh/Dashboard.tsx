
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Calendar, Clock, FileText, MessageSquare, Settings, Users } from "lucide-react";
import { Link } from "react-router-dom";

// Definición de los módulos que se mostrarán en el dashboard
const modules = [
  {
    title: "Organización",
    description: "Gestión de departamentos y estructura organizacional",
    icon: Users,
    color: "bg-blue-500",
    link: "/organization",
    roles: ["admin", "manager", "supervisor", "collaborator"]
  },
  {
    title: "Gestión del Tiempo",
    description: "Control de horarios, ausencias y vacaciones",
    icon: Clock,
    color: "bg-green-500",
    link: "/time-management",
    roles: ["admin", "manager", "supervisor", "collaborator"]
  },
  {
    title: "Evaluación de Desempeño",
    description: "Revisiones de rendimiento y objetivos",
    icon: BarChart2,
    color: "bg-purple-500",
    link: "/performance",
    roles: ["admin", "manager", "supervisor"]
  },
  {
    title: "Comunicación",
    description: "Mensajes y notificaciones internas",
    icon: MessageSquare,
    color: "bg-yellow-500", 
    link: "/inbox",
    roles: ["admin", "manager", "supervisor", "collaborator"]
  },
  {
    title: "Documentación",
    description: "Archivos y documentos importantes",
    icon: FileText,
    color: "bg-red-500",
    link: "/documents",
    roles: ["admin", "manager", "supervisor", "collaborator"]
  },
  {
    title: "Calendario",
    description: "Eventos, reuniones y fechas importantes",
    icon: Calendar,
    color: "bg-indigo-500",
    link: "/calendar",
    roles: ["admin", "manager", "supervisor", "collaborator"]
  },
  {
    title: "Configuración",
    description: "Ajustes de la aplicación y del perfil",
    icon: Settings,
    color: "bg-gray-500",
    link: "/settings",
    roles: ["admin", "manager"]
  }
];

export default function Dashboard() {
  const { profile, role } = useAuth();
  
  // Filtramos los módulos según el rol del usuario
  const filteredModules = modules.filter(module => 
    role && module.roles.includes(role)
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto relative">
        {/* Background decorative elements for 3D futuristic effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="mb-8 transform transition-all hover:translate-y-[-5px] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-xl blur-xl -z-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bienvenido, {profile?.full_name || "Usuario"}
            </h1>
            <p className="text-gray-600">
              Panel de control | {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Usuario"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <Link 
              key={index} 
              to={module.link} 
              className="transition-all hover:scale-105 hover:translate-y-[-5px] focus:outline-none focus:ring-2 focus:ring-teal-950 focus:ring-opacity-50 rounded-lg"
            >
              <Card className="h-full relative overflow-hidden border-0">
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm z-0 border border-white/30 rounded-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]"></div>
                
                {/* 3D effect elements */}
                <div className={`absolute top-0 left-0 w-full h-1 ${module.color} opacity-70 rounded-t-lg`}></div>
                <div className={`absolute bottom-0 right-0 w-1/3 h-1 ${module.color} opacity-50`}></div>
                <div className={`absolute top-1/2 right-4 w-20 h-20 ${module.color} opacity-10 rounded-full blur-xl -z-0`}></div>
                
                <CardHeader className="relative z-10">
                  <div className={`w-12 h-12 rounded-lg ${module.color} text-white flex items-center justify-center mb-3 shadow-lg transform transition-transform hover:rotate-12`}>
                    <module.icon size={24} />
                  </div>
                  <CardTitle className="text-gray-800">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-sm text-gray-500">
                    Accede para gestionar {module.title.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
