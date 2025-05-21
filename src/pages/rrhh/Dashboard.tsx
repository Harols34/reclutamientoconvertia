
import React from "react";
import { getRRHHUser } from "../../utils/rrhh-auth";

const RRHHDashboard = () => {
  const user = getRRHHUser();

  if (!user) return null;

  return (
    <div className="bg-white max-w-5xl mx-auto rounded-xl p-10 border border-gray-200 shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold mb-4 text-hrm-dark-cyan">Bienvenido, {user.full_name}</h1>
      <span className="bg-hrm-dark-cyan text-white px-3 py-1 rounded text-xs font-semibold">Módulo Exclusivo RRHH</span>
      <div className="my-5 text-lg text-gray-700">
        Este es tu panel principal para operar todos los procesos internos de RRHH de manera completamente independiente al resto del sistema.<br/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-5 rounded-lg border shadow-sm bg-hrm-dark-cyan/10">
          <div className="text-hrm-dark-cyan font-bold mb-1">Gestión organizacional</div>
          <div className="text-gray-700 text-sm">Accede a empleados, departamentos y jerarquías.</div>
        </div>
        <div className="p-5 rounded-lg border shadow-sm bg-hrm-dark-cyan/10">
          <div className="text-hrm-dark-cyan font-bold mb-1">Perfil Personal</div>
          <div className="text-gray-700 text-sm">Actualiza tus datos y preferencias de acceso.</div>
        </div>
        <div className="p-5 rounded-lg border shadow-sm bg-hrm-dark-cyan/10">
          <div className="text-hrm-dark-cyan font-bold mb-1">Novedades (demo)</div>
          <div className="text-gray-700 text-sm">Se pueden agregar módulos internos según rol o empresa.</div>
        </div>
      </div>
    </div>
  );
};
export default RRHHDashboard;
