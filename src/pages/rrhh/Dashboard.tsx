
import React from "react";

const RRHHDashboard = () => {
  // Aquí podrías mostrar resumen de empleados, nuevos ingresos, ausencias, etc.
  return (
    <div>
      <h1 className="text-2xl font-bold text-hrm-dark-cyan mb-4">Bienvenido al panel de Recursos Humanos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow border border-gray-100">
          <div className="text-hrm-dark-cyan font-semibold">Total Empleados</div>
          <div className="text-3xl mt-2 mb-1">--</div>
          <div className="text-gray-400 text-xs">Incluye activos e inactivos</div>
        </div>
        <div className="p-4 bg-white rounded shadow border border-gray-100">
          <div className="text-hrm-dark-cyan font-semibold">Nuevos Ingresos</div>
          <div className="text-3xl mt-2 mb-1">--</div>
          <div className="text-gray-400 text-xs">Últimos 30 días</div>
        </div>
        {/* Más estadísticas y resúmenes aquí */}
      </div>
    </div>
  );
};

export default RRHHDashboard;
