
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Home, LogOut } from "lucide-react";

const navItems = [
  { label: "Inicio", path: "/rrhh", icon: Home },
  { label: "Empleados", path: "/rrhh/empleados", icon: Users },
  // Agrega más secciones como 'Departamentos', 'Roles', etc si deseas
];

export default function RRHHSidenav() {
  const location = useLocation();
  return (
    <aside className="w-60 bg-hrm-dark-cyan text-white min-h-screen flex flex-col">
      <div className="flex items-center py-6 px-6 mb-6 border-b border-cyan-900">
        <img src="/lovable-uploads/e0944ff1-6821-41aa-840e-6412963e6eaa.png" className="h-8 w-8" alt="Logo" />
        <span className="ml-3 font-bold text-lg">CONVERT-IA RRHH</span>
      </div>
      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-2 rounded transition hover:bg-cyan-800 ${location.pathname === item.path ? "bg-cyan-900" : ""}`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-cyan-900">
        <button className="flex items-center gap-2 text-sm text-cyan-200 hover:text-white w-full" onClick={() => {
          localStorage.removeItem("rrhh_session");
          window.location.href = "/rrhh/login";
        }}>
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </div>
    </aside>
  );
}
