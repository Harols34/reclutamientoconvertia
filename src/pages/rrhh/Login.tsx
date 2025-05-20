
import React from "react";

const RRHHLogin = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-hrm-dark-cyan to-purple-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md border">
        <h2 className="text-xl font-semibold mb-2 text-hrm-dark-cyan">Acceso RRHH</h2>
        <p className="text-gray-600 mb-4">Solo personal autorizado puede iniciar sesión en este módulo.</p>
        {/* Aquí irá el formulario de login personalizado */}
        <form className="space-y-5">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Email</label>
            <input className="w-full px-3 py-2 border rounded-md" type="email" placeholder="usuario@empresa.com" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Contraseña</label>
            <input className="w-full px-3 py-2 border rounded-md" type="password" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full mt-4 py-2 bg-hrm-dark-cyan hover:bg-hrm-steel-blue text-white rounded-md font-semibold">
            Ingresar
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-500 text-center">
          ¿Olvidaste tu contraseña? <span className="underline cursor-pointer">Recuperar acceso</span>
        </div>
      </div>
    </div>
  );
};

export default RRHHLogin;
