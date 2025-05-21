
import React from "react";
import { getRRHHUser } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RRHHOrganizacion = () => {
  const user = getRRHHUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/rrhh/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl mt-12 p-8 bg-white rounded-lg border border-cyan-200 shadow animate-fade-in">
      <h1 className="text-2xl font-bold text-hrm-dark-cyan mb-4">Organización RRHH</h1>
      <p className="mb-3">Este es el módulo independiente de Organización de RRHH.</p>
      <div className="mb-8">
        <p className="text-gray-700">
          Aquí irá la gestión de empleados, departamentos y estructura organizacional.
        </p>
      </div>
      <Button onClick={() => navigate("/rrhh/dashboard")}>Volver al Dashboard</Button>
    </div>
  );
};

export default RRHHOrganizacion;
