
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";

export default function RRHHLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email y contraseña requeridos");
      return;
    }
    // Simulación login RRHH (AJUSTA por lógica real)
    const session = (email === "admin@convertia.com" && password === "admin123");
    if (session) {
      localStorage.setItem("rrhh_session", JSON.stringify({ email }));
      navigate("/rrhh");
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 shadow-xl rounded-lg w-full max-w-sm border border-gray-100"
        onSubmit={handleLogin}>
        <div className="flex justify-center mb-4">
          <img src="/lovable-uploads/e0944ff1-6821-41aa-840e-6412963e6eaa.png" alt="Convert-IA Logo" className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-hrm-dark-cyan text-center">Iniciar sesión RRHH</h1>
        <div className="mb-4">
          <label className="block text-gray-700">Correo electrónico</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              required
              className="pl-10 pr-3 py-2 border rounded w-full mt-1"
              placeholder="usuario@convertia.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              required
              className="pl-10 pr-3 py-2 border rounded w-full mt-1"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>
        {error && <div className="bg-red-100 text-red-600 rounded p-2 text-sm mb-3">{error}</div>}
        <button
          type="submit"
          className="bg-hrm-dark-cyan text-white px-5 py-2 rounded-md w-full hover:bg-hrm-steel-blue font-semibold"
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
