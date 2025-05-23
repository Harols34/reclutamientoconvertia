
import React from "react";
import { Building } from "lucide-react";
const departamentos = [
  { id: 1, name: "TI", description: "Tecnología de la Información" },
  { id: 2, name: "Marketing", description: "Mercadeo y Publicidad" },
  { id: 3, name: "Operaciones", description: "Operación y Soporte" }
];
const Departamentos = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-hrm-dark-cyan"><Building /> Departamentos</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <ul className="space-y-2">
        {departamentos.map(dep => (
          <li key={dep.id}>
            <span className="font-semibold">{dep.name}</span>:{" "}
            <span className="text-sm text-gray-600">{dep.description}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
export default Departamentos;
