
import React from "react";
const feedbacks = [
  { id: 1, name: "Ana Torres", type: "Sugerencia", message: "Estaría genial tener más capacitaciones.", date: "2024-02-12" },
  { id: 2, name: "Miguel Ruiz", type: "Queja", message: "No recibí mi pago a tiempo.", date: "2024-02-10" },
];
const Feedback = () => (
  <div>
    <h2 className="text-xl font-bold mb-4 text-hrm-dark-cyan">Feedback del Personal</h2>
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Nombre</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Mensaje</th>
            <th className="px-4 py-2 text-left">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map(fb => (
            <tr key={fb.id} className="border-b">
              <td className="px-4 py-2">{fb.name}</td>
              <td className="px-4 py-2">{fb.type}</td>
              <td className="px-4 py-2">{fb.message}</td>
              <td className="px-4 py-2">{fb.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
export default Feedback;
