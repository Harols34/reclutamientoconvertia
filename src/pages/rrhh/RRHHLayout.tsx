import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import RRHHSidenav from "./components/RRHHSidenav";
import RRHHHeader from "./components/RRHHHeader";

const navRoutes = [
  { label: "Dashboard", path: "/rrhh" },
  { label: "Empleados", path: "/rrhh/empleados" },
  { label: "Usuarios", path: "/rrhh/usuarios" },
  { label: "Módulos", path: "/rrhh/modulos" },
  { label: "Departamentos", path: "/rrhh/departamentos" },
  { label: "Ausencias", path: "/rrhh/ausencias" },
  { label: "Noticias", path: "/rrhh/noticias" },
  { label: "Feedback", path: "/rrhh/feedback" }
];

const RRHHLayout = () => (
  <div className="min-h-screen flex bg-gray-50">
    <RRHHSidenav />
    <div className="flex flex-col flex-1">
      <RRHHHeader />
      <nav className="flex gap-2 px-6 py-2 text-sm">
        {navRoutes.map(r =>
          <NavLink
            to={r.path}
            key={r.path}
            className={({ isActive }) =>
              "rounded px-3 py-1.5 hover:bg-cyan-100 " + (isActive ? "bg-cyan-200 font-semibold" : "")
            }
            end={r.path === "/rrhh"}
          >
            {r.label}
          </NavLink>
        )}
      </nav>
      <main className="flex-1 px-6 py-4">
        <Outlet />
      </main>
    </div>
  </div>
);

export default RRHHLayout;
