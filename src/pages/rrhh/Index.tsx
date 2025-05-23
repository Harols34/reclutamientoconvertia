
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth, mockUsers } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Convert-IA: Gestión Inteligente de Recursos Humanos
            </h1>
            <p className="text-xl mb-8">
              Transforma la gestión de tu capital humano con nuestra plataforma potenciada por inteligencia artificial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="bg-white text-teal-900 hover:bg-gray-100">
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-teal-800">
                <a href="#demo-users">Usuarios de Prueba</a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="/lovable-uploads/91758d37-d41c-4b09-951e-88bd39ce5651.png" 
              alt="Convert-IA Platform" 
              className="w-64 h-64 mx-auto"
            />
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Características Principales</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Gestión del Tiempo</h3>
              <p>Control de asistencia, gestión de ausencias y monitoreo de horas de trabajo con reportes detallados.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Evaluación de Desempeño</h3>
              <p>Establece objetivos, realiza evaluaciones periódicas y visualiza el progreso de tu equipo.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Comunicación Interna</h3>
              <p>Mantén a tu equipo informado y conectado con nuestras herramientas de mensajería y notificaciones.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Organización Empresarial</h3>
              <p>Visualiza y gestiona la estructura organizacional de manera interactiva y eficiente.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Gestión Documental</h3>
              <p>Almacena, comparte y controla el acceso a documentos importantes de manera segura.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-3 text-teal-800">Análisis y Reportes</h3>
              <p>Obtén insights valiosos con nuestros dashboards analíticos y reportes personalizados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Users Section */}
      <section id="demo-users" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Usuarios de Prueba</h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Rol</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Contraseña</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className={Number(user.id) % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4 capitalize">{user.role}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.password}</td>
                      <td className="py-3 px-4">
                        <Link 
                          to="/login" 
                          className="text-teal-600 hover:text-teal-800 font-medium"
                          state={{ email: user.email, password: user.password }}
                        >
                          Iniciar Sesión
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 text-center">
              <Button asChild>
                <Link to="/login">Acceder a la Plataforma</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>© 2025 Convert-IA. Todos los derechos reservados.</p>
            <p className="mt-2 text-gray-400">Una plataforma de gestión de recursos humanos impulsada por IA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
