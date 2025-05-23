
import React from "react";
const noticias = [
  { id: 1, title: "Nuevo beneficio de salud", date: "2024-05-10", content: "Desde Junio, todos los empleados contarán con plan extendido de salud." },
  { id: 2, title: "Horario especial en julio", date: "2024-05-09", content: "La empresa operará de 9am a 3pm el 4 y 5 de julio por feriado." },
];
const Noticias = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 text-hrm-dark-cyan">Noticias RRHH</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <ul className="space-y-3">
        {noticias.map(n => (
          <li key={n.id}>
            <div className="font-semibold">{n.title} <span className="text-xs text-gray-400">({n.date})</span></div>
            <div className="text-gray-700">{n.content}</div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
export default Noticias;
