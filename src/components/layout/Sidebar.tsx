
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, Database, File, Home, 
  MessageCircle, Search, Settings, Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    href: '/admin/dashboard' 
  },
  { 
    icon: Users, 
    label: 'Candidatos', 
    href: '/admin/candidates' 
  },
  { 
    icon: File, 
    label: 'Vacantes', 
    href: '/admin/jobs' 
  },
  { 
    icon: Calendar, 
    label: 'Campañas', 
    href: '/admin/campaigns' 
  },
  { 
    icon: MessageCircle, 
    label: 'Chatbot', 
    href: '/admin/chatbot' 
  },
  { 
    icon: Database, 
    label: 'Reportes', 
    href: '/admin/reports' 
  },
  { 
    icon: Settings, 
    label: 'Configuración', 
    href: '/admin/settings' 
  }
];

const AdminSidebar = () => {
  return (
    <Sidebar className="border-r border-hrm-light-gray">
      <SidebarHeader className="h-14 border-b border-hrm-light-gray">
        <div className="flex items-center justify-center h-full">
          <span className="text-xl font-bold text-hrm-dark-cyan">HRM AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-1 py-4">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-hrm-dark-cyan text-white"
                  : "text-gray-600 hover:bg-hrm-light-gray hover:text-hrm-dark-cyan"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-hrm-light-gray p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-hrm-steel-blue flex items-center justify-center text-white">
            <span className="text-sm font-medium">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
