
import React, { useState } from "react";
import { rrhhClient, hashPassword, rrhhLogin } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const RRHHRegister = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(""); // UUID de rol
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Carga de roles de manera robusta compatible con políticas nuevas
  React.useEffect(() => {
    rrhhClient.from("rrhh_roles").select().then(({ data, error }) => {
      if (error) setError("No se pudieron cargar los roles.");
      setRoles(data || []);
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!email || !fullName || !password || !roleId) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }
    try {
      // Verifica si el email ya existe para evitar error SQL poco amigable
      const exists = await rrhhClient.from("rrhh_users").select("id").eq("email", email).maybeSingle();
      if (exists.data) {
        setError("El correo ya está registrado.");
        setLoading(false);
        return;
      }
      const password_hash = await hashPassword(password);
      const { error: insertError } = await rrhhClient.from("rrhh_users").insert({
        email, full_name: fullName, password_hash, role_id: roleId
      });
      if (insertError) {
        setError("Error: " + insertError.message);
        setLoading(false);
        return;
      }
      // Login automático tras registro exitoso
      const login = await rrhhLogin(email, password);
      if (login) {
        toast({ title: "Registro exitoso", description: "¡Bienvenido al área RRHH!" });
        setLoading(false);
        navigate("/rrhh/dashboard");
      } else {
        toast({ title: "Usuario registrado, pero debes iniciar sesión manualmente" });
        setLoading(false);
        navigate("/rrhh/login");
      }
    } catch (err: any) {
      setError("Error inesperado: " + (err?.message || JSON.stringify(err)));
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-hrm-dark-cyan to-purple-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md border">
        <h2 className="text-xl font-bold mb-2 text-hrm-dark-cyan">Registro RRHH (demo)</h2>
        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus />
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
            <select className="w-full px-3 py-2 border rounded-md"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              required>
              <option value="">Seleccione un rol</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button className="w-full mt-4" type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Crear Usuario"}
          </Button>
          <Button className="w-full" variant="secondary" type="button" onClick={() => navigate("/rrhh/login")}>
            Ir al Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RRHHRegister;
