
import React from 'react';
import { Calendar, File, User, Users } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';

// Sample data - in production, this would come from your API
const stats = [
  {
    title: 'Candidatos Totales',
    value: 243,
    icon: Users,
    trend: { value: 12, isPositive: true },
  },
  {
    title: 'Vacantes Activas',
    value: 8,
    icon: File,
    trend: { value: 5, isPositive: true },
  },
  {
    title: 'Entrevistas Programadas',
    value: 15,
    icon: Calendar,
    trend: { value: 3, isPositive: false },
  },
  {
    title: 'Contrataciones este Mes',
    value: 4,
    icon: User,
    trend: { value: 25, isPositive: true },
  },
];

const Dashboard = () => {
  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-hrm-light-gray">
          <h2 className="section-title">Candidatos Recientes</h2>
          <p className="text-gray-500 text-sm">Lista de candidatos...</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-hrm-light-gray">
          <h2 className="section-title">Vacantes Populares</h2>
          <p className="text-gray-500 text-sm">Lista de vacantes...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
