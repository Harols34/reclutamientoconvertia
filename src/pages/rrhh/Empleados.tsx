import React from "react";
import { mockEmployees } from "./mock/employees";
import { Users } from "lucide-react";

const RRHHEmpleados = () => (
  <div>
    <h1 className="text-2xl font-bold text-hrm-dark-cyan mb-4 flex items-center gap-2">
      <Users /> Empleados
    </h1>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
            <th className="px-4 py-2 text-left font-semibold">Puesto</th>
            <th className="px-4 py-2 text-left font-semibold">Departamento</th>
            <th className="px-4 py-2 text-left font-semibold">Estado</th>
            <th className="px-4 py-2 text-left font-semibold">Fecha de ingreso</th>
          </tr>
        </thead>
        <tbody>
          {mockEmployees.map(e => (
            <tr key={e.id} className="border-b">
              <td className="px-4 py-2">{e.name}</td>
              <td className="px-4 py-2">{e.position}</td>
              <td className="px-4 py-2">{e.department}</td>
              <td className="px-4 py-2">
                <span className={`status-badge ${e.status === "Activo" ? "status-badge-active" : "status-badge-inactive"}`}>
                  {e.status}
                </span>
              </td>
              <td className="px-4 py-2">{e.hireDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RRHHEmpleados;
