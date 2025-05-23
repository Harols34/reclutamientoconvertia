
import React from "react";
import { mockUsers } from "./mock/users";
import { User } from "lucide-react";

const Usuarios = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-hrm-dark-cyan"><User /> Usuarios</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
            <th className="px-4 py-2 text-left font-semibold">Correo</th>
            <th className="px-4 py-2 text-left font-semibold">Rol</th>
            <th className="px-4 py-2 text-left font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {mockUsers.map(u => (
            <tr key={u.id} className="border-b">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2">{u.role}</td>
              <td className="px-4 py-2">
                <span className={`status-badge ${u.status === "Activo" ? "status-badge-active" : "status-badge-inactive"}`}>
                  {u.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Usuarios;
