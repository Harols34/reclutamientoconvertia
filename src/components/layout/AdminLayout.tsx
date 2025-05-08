
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';
import Chatbot from '../chatbot/Chatbot';

const AdminLayout = () => {
  // Get current location to help with preserving state
  const location = useLocation();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Chatbot userType="admin" />
    </SidebarProvider>
  );
};

export default AdminLayout;
