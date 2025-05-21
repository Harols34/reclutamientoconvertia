import { StrictMode, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Public Pages
import Home from "./pages/public/Home";
import JobsList from "./pages/public/JobsList";
import JobDetail from "./pages/public/JobDetail";
import ThankYou from "./pages/public/ThankYou";
import ApplicationForm from "./components/candidates/ApplicationForm";
import TrainingChat from "./pages/public/TrainingChat"; // Nueva página de entrenamiento

// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Jobs from "./pages/admin/Jobs";
import JobForm from "./pages/admin/JobForm";
import AdminJobDetail from "./pages/admin/JobDetail";
import Campaigns from "./pages/admin/Campaigns";
import Candidates from "./pages/admin/Candidates";
import CandidateDetail from "./pages/admin/CandidateDetail";
import ChatbotManager from "./pages/admin/ChatbotManager";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import TrainingCodes from "./pages/admin/TrainingCodes"; // Nueva página de códigos
import TrainingSessions from "./pages/admin/TrainingSessions"; // Nueva página de sesiones
import TrainingHistory from "./pages/admin/TrainingHistory"; // Nueva página de historial
import SessionDetail from './pages/admin/SessionDetail';

// RRHH Pages
import RRHHIndex from "./pages/rrhh/Index";
import RRHHLogin from "./pages/rrhh/Login";
import RRHHDashboard from "./pages/rrhh/Dashboard";
import RRHHRegister from "./pages/rrhh/Register";

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Componente para proteger rutas de administrador
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hrm-dark-cyan"></div>
      </div>;
    }

    if (!session) {
      // Solo redirigir si realmente NO estamos autenticados y NO estamos ya en /admin/login
      const path = window.location.pathname;
      if (!path.startsWith("/admin/login")) {
        return <Navigate to="/admin/login" replace />;
      }
    }
    return <>{children}</>;
  };

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/:jobId" element={<JobDetail />} />
                <Route path="postularse/:jobId" element={<ApplicationForm />} />
                <Route path="gracias" element={<ThankYou />} />
                <Route path="entrenamiento" element={<TrainingChat />} />
                <Route path="rrhh" element={<RRHHIndex />} />
                <Route path="rrhh/login" element={<RRHHLogin />} />
                <Route path="rrhh/dashboard" element={<RRHHDashboard />} />
                <Route path="rrhh/registro" element={<RRHHRegister />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/new" element={<JobForm />} />
                <Route path="jobs/:id" element={<AdminJobDetail />} />
                <Route path="jobs/:id/edit" element={<JobForm />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="candidates" element={<Candidates />} />
                <Route path="candidates/:id" element={<CandidateDetail />} />
                <Route path="chatbot" element={<ChatbotManager />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="training-codes" element={<TrainingCodes />} />
                <Route path="training-sessions" element={<TrainingSessions />} />
                <Route path="training-history" element={<TrainingHistory />} /> {/* New Training History Page */}
                <Route path="training-sessions/:sessionId" element={<SessionDetail />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

export default App;
