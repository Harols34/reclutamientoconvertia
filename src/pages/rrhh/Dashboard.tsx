import React from "react";
import { rrhhLogout, getRRHHUser } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RRHHDashboard = () => {
  const user = getRRHHUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/rrhh/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl mt-12 p-8 bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
      <div className="mb-4">
        <span className="inline-block bg-hrm-dark-cyan text-white px-3 py-1 text-xs rounded uppercase tracking-widest">Módulo Exclusivo RRHH</span>
      </div>
      <h1 className="text-2xl font-bold text-hrm-dark-cyan mb-4">Hola, {user.full_name}</h1>
      <p className="mb-2">Rol: <span className="font-semibold">{user.role_id}</span></p>
      <div className="flex gap-3 mb-8">
        <Button onClick={() => navigate("/rrhh/organizacion")}>Organización</Button>
        <Button onClick={() => navigate("/rrhh/perfil")}>Perfil</Button>
        <Button variant="destructive" onClick={rrhhLogout}>Cerrar Sesión</Button>
      </div>
      <div className="text-gray-700">Dashboard propio de RRHH. Su sesión y permisos no afectan el resto del sistema.</div>
    </div>
  );
};

export default RRHHDashboard;
