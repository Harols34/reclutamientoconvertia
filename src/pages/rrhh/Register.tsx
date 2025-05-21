
import React, { useState } from "react";
import { rrhhClient, hashPassword } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const RRHHRegister = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(""); // UUID de rol
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Opcional: Cargar roles de la base
  React.useEffect(() => {
    rrhhClient.from("rrhh_roles").select().then(({ data }) => setRoles(data || []));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !fullName || !password || !roleId) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    const password_hash = await hashPassword(password);
    const { error } = await rrhhClient.from("rrhh_users").insert({
      email, full_name: fullName, password_hash, role_id: roleId
    });
    if (error) setError("Error: " + error.message);
    else navigate("/rrhh/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-hrm-dark-cyan to-purple-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md border">
        <h2 className="text-xl font-bold mb-2 text-hrm-dark-cyan">Registro RRHH (demo)</h2>
        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select className="w-full px-3 py-2 border rounded-md" value={roleId} onChange={e => setRoleId(e.target.value)} required>
              <option value="">Seleccione un rol</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full mt-4" type="submit">Crear Usuario</Button>
          <Button className="w-full" variant="secondary" type="button" onClick={() => navigate("/rrhh/login")}>Ir al Login</Button>
        </form>
      </div>
    </div>
  );
};

export default RRHHRegister;
