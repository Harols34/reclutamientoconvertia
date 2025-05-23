
import React from "react";
import { mockModules } from "./mock/modules";
import { Settings } from "lucide-react";

const Modulos = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-hrm-dark-cyan"><Settings /> Módulos</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {mockModules.map(m => (
          <li key={m.id} className="p-4 border rounded shadow flex flex-col items-center bg-gray-50">
            <m.icon className="w-8 h-8 text-hrm-steel-blue mb-2" />
            <span className="font-semibold">{m.name}</span>
            <span className="text-xs text-gray-400">{m.description}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Modulos;
