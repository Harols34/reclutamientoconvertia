
import React from "react";
import { getRRHHUser } from "../../utils/rrhh-auth";

const Perfil = () => {
  const user = getRRHHUser();

  if (!user) return null;

  return (
    <div className="animate-fade-in bg-white rounded-xl p-8 border border-gray-200 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-hrm-dark-cyan mb-5">Mi Perfil</h1>
      <div>
        <div className="mb-2"><span className="font-semibold text-gray-600">Nombre: </span>{user.full_name}</div>
        <div className="mb-2"><span className="font-semibold text-gray-600">Correo: </span>{user.email}</div>
        <div className="mb-2"><span className="font-semibold text-gray-600">Rol: </span>{user.role_id}</div>
        <div className="mb-2"><span className="font-semibold text-gray-600">Estado: </span>{user.status}</div>
      </div>
      <div className="mt-8 text-gray-500 text-sm text-center border-t pt-4">
        (Próximamente edición de perfil, cambio de contraseña, etc.)
      </div>
    </div>
  );
};
export default Perfil;
