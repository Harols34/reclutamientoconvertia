
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Building, Users, User, Home, LogOut } from "lucide-react";
import { rrhhLogout } from "../../utils/rrhh-auth";

const navItems = [
  { path: "/rrhh/dashboard", icon: Home, label: "Dashboard" },
  { path: "/rrhh/empleados", icon: Users, label: "Empleados" },
  { path: "/rrhh/departamentos", icon: Building, label: "Departamentos" },
  { path: "/rrhh/perfil", icon: User, label: "Mi Perfil" },
];

const RRHHSidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="h-screen w-64 bg-hrm-dark-cyan flex flex-col py-6 px-3 shadow-xl relative">
      <div className="text-white text-2xl font-extrabold mb-10 tracking-wide select-none text-center">
        RRHH Suite
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all " +
              (isActive
                ? "bg-white/20 text-white"
                : "text-white hover:bg-white/10")
            }
          >
            <item.icon className="w-5 h-5" /> {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={rrhhLogout}
        className="absolute bottom-7 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-white/15 rounded-md text-white hover:bg-white/25 font-semibold transition"
        type="button"
      >
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </aside>
  );
};

export default RRHHSidebar;
