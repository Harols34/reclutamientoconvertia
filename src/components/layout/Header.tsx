
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

const AdminHeader = () => {
  return (
    <header className="h-14 border-b border-hrm-light-gray bg-white flex items-center justify-between px-4">
      <div className="flex items-center">
        <SidebarTrigger />
        <div className="relative ml-4 w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-8 rounded-md border-hrm-light-gray focus:border-hrm-steel-blue"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
