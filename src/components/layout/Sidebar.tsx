import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Calendar, Database, File, Home, LogOut, MessageCircle, Search, Settings, Users, Code, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import ConvertIALogo from '@/assets/convert-ia-logo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const mainNavItems = [{
  icon: Home,
  label: 'Dashboard',
  href: '/admin/dashboard'
}, {
  icon: Users,
  label: 'Candidatos',
  href: '/admin/candidates'
}, {
  icon: File,
  label: 'Vacantes',
  href: '/admin/jobs'
}, {
  icon: Calendar,
  label: 'Campañas',
  href: '/admin/campaigns'
}, {
  icon: MessageCircle,
  label: 'Chatbot',
  href: '/admin/chatbot'
}, {
  icon: Code,
  label: 'Códigos Entrenamiento',
  href: '/admin/training-codes'
}, {
  icon: Database,
  label: 'Reportes',
  href: '/admin/reports'
}, {
  icon: History,
  label: 'Historial Entrenamientos',
  href: '/admin/training-history'
}, {
  icon: Settings,
  label: 'Configuración',
  href: '/admin/settings'
}];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  };
  return (
    <Sidebar className="border-r border-hrm-light-gray bg-hrm-dark-cyan">
      <SidebarHeader className="h-14 border-b border-hrm-light-gray/20 bg-teal-950">
        <div className="flex items-center justify-center h-full px-4">
          <ConvertIALogo className="h-10" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-teal-950">
        <nav className="space-y-1 py-4">
          {mainNavItems.map(item => <NavLink key={item.href} to={item.href} className={({
          isActive
        }) => cn("flex items-center px-4 py-2 text-sm font-medium rounded-md", isActive ? "bg-opacity-20 bg-white text-white" : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white")}>
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>)}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-hrm-light-gray/20 p-4 bg-teal-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
              <span className="text-sm font-medium">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-200">Administrador</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center text-white hover:text-red-300 transition-colors" title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
