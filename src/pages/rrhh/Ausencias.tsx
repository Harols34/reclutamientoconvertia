
import React from "react";
const ausencias = [
  { id: 1, name: "Andrea López", type: "Permiso", start: "2024-03-01", end: "2024-03-03", status: "Aprobada" },
  { id: 2, name: "Luis Fernández", type: "Enfermedad", start: "2024-04-10", end: "2024-04-12", status: "Pendiente" },
];
const Ausencias = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 text-hrm-dark-cyan">Ausencias</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Empleado</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Desde</th>
            <th className="px-4 py-2 text-left">Hasta</th>
            <th className="px-4 py-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ausencias.map(a => (
            <tr key={a.id} className="border-b">
              <td className="px-4 py-2">{a.name}</td>
              <td className="px-4 py-2">{a.type}</td>
              <td className="px-4 py-2">{a.start}</td>
              <td className="px-4 py-2">{a.end}</td>
              <td className="px-4 py-2">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
export default Ausencias;
