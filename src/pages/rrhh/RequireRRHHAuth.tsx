
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// En proyectos reales, deberías usar context o un hook para la sesión
const RequireRRHHAuth = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const session = localStorage.getItem("rrhh_session");
  if (!session) {
    return <Navigate to="/rrhh/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default RequireRRHHAuth;
