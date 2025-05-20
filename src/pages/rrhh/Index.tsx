
import React from "react";

const RRHHIndex = () => {
  return (
    <div className="mx-auto max-w-4xl mt-12 p-8 bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
      <h1 className="text-3xl font-bold text-hrm-dark-cyan mb-4">Bienvenido al Módulo RRHH</h1>
      <p className="text-lg text-gray-700">
        Plataforma modular de Recursos Humanos. Seleccione una opción del menú para continuar.
      </p>
      {/* Aquí luego irá menú, dashboard u otras vistas según los permisos del usuario */}
    </div>
  );
};

export default RRHHIndex;
