
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Calendar, Database, File, Home, MessageCircle, Search, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import ConvertIALogo from '@/assets/convert-ia-logo';

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
    <Sidebar className="border-r border-hrm-light-gray bg-hrm-dark-cyan">
      <SidebarHeader className="h-14 border-b border-hrm-light-gray/20">
        <div className="flex items-center justify-center h-full px-4">
          <ConvertIALogo className="h-10" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-1 py-4">
          {mainNavItems.map(item => (
            <NavLink 
              key={item.href} 
              to={item.href} 
              className={({isActive}) => cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md", 
                isActive 
                  ? "bg-opacity-20 bg-white text-white" 
                  : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-hrm-light-gray/20 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
            <span className="text-sm font-medium">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-gray-200">Administrador</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
