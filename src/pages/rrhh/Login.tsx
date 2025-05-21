
import React, { useState } from "react";
import { rrhhLogin, getRRHHUser } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const RRHHLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    // Si ya está logueado, ir al dashboard
    if (getRRHHUser()) {
      navigate("/rrhh/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = await rrhhLogin(email, password);
    if (!user) setError("Credenciales incorrectas o usuario inactivo.");
    else navigate("/rrhh/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-hrm-dark-cyan to-purple-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md border">
        <h2 className="text-xl font-semibold mb-2 text-hrm-dark-cyan">Acceso RRHH</h2>
        <p className="text-gray-600 mb-4">Solo personal autorizado puede iniciar sesión en este módulo.</p>
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Contraseña</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full mt-4">Ingresar</Button>
        </form>
        <div className="mt-4 text-xs text-gray-500 text-center">
          ¿Olvidaste tu contraseña? <span className="underline cursor-pointer">Próximamente</span>
        </div>
        <div className="mt-3 text-center">
          <Button variant="link" onClick={() => navigate("/rrhh/registro")}>¿No tienes cuenta? Regístrate</Button>
        </div>
      </div>
    </div>
  );
};

export default RRHHLogin;
