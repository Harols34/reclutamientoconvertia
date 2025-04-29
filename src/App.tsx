
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Public Pages
import Home from "./pages/public/Home";
import JobsList from "./pages/public/JobsList";
import ThankYou from "./pages/public/ThankYou";
import ApplicationForm from "./components/candidates/ApplicationForm";

// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Jobs from "./pages/admin/Jobs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="postularse/:jobId" element={<ApplicationForm />} />
            <Route path="gracias" element={<ThankYou />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="campaigns" element={<Dashboard />} /> {/* Placeholder */}
            <Route path="candidates" element={<Dashboard />} /> {/* Placeholder */}
            <Route path="chatbot" element={<Dashboard />} /> {/* Placeholder */}
            <Route path="reports" element={<Dashboard />} /> {/* Placeholder */}
            <Route path="settings" element={<Dashboard />} /> {/* Placeholder */}
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
