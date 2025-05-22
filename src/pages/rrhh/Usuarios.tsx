
import React, { useEffect, useState } from "react";
import { rrhhClient, hashPassword } from "../../utils/rrhh-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type RRHHUser = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  role_id: string | null;
  created_at: string;
};

const RRHHUsuarios = () => {
  const [usuarios, setUsuarios] = useState<RRHHUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", status: "active", role_id: "" });
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Obtiene usuarios RRHH
  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await rrhhClient.from("rrhh_users").select("id,email,full_name,status,role_id,created_at").order("created_at", { ascending: false });
    if (error) setError("Error consultando usuarios: " + error.message);
    setUsuarios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Cambios de campos del form
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear usuario
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.full_name || !form.password) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    // Verifica si ya existe
    const { data: existe } = await rrhhClient.from("rrhh_users").select("id").eq("email", form.email).maybeSingle();
    if (existe) {
      setError("Ya existe un usuario con ese email.");
      return;
    }
    const password_hash = await hashPassword(form.password);
    const { error: insertError } = await rrhhClient.from("rrhh_users").insert({
      email: form.email.trim().toLowerCase(),
      full_name: form.full_name.trim(),
      password_hash,
      status: form.status,
      role_id: form.role_id || null,
    });
    if (insertError) {
      setError("Error creando usuario: " + insertError.message);
      return;
    }
    toast({ title: "Usuario creado", description: "Se ha creado el usuario correctamente." });
    setShowForm(false);
    setForm({ email: "", full_name: "", password: "", status: "active", role_id: "" });
    fetchUsuarios();
  };

  // Cambia el estado activo/inactivo
  const toggleStatus = async (user: RRHHUser) => {
    const { error } = await rrhhClient.from("rrhh_users").update({ status: user.status === "active" ? "inactive" : "active" }).eq("id", user.id);
    if (!error) {
      toast({ title: "Actualización correcta", description: `El usuario ahora está ${user.status === "active" ? "INACTIVO" : "ACTIVO"}.` });
      fetchUsuarios();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-xl font-bold mb-4 text-hrm-dark-cyan">Usuarios RRHH</h1>

      <div className="mb-5 flex justify-between">
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cerrar formulario" : "Crear nuevo usuario"}</Button>
        <Button variant="secondary" onClick={fetchUsuarios} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
      {showForm && (
        <form className="space-y-4 bg-white rounded shadow p-5 mb-6" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <Input name="full_name" value={form.full_name} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input name="email" type="email" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <Input name="password" type="password" value={form.password} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select name="status" className="w-full px-3 py-2 border rounded-md" value={form.status} onChange={onChange}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          {/* Puedes agregar selección de rol si se requiere */}
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <Button type="submit" className="w-full mt-4">Crear usuario</Button>
        </form>
      )}

      <div className="rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{user.full_name}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className={`px-3 py-2 ${user.status === "active" ? "text-green-600" : "text-red-500"}`}>{user.status}</td>
                <td className="px-3 py-2">
                  <Button size="sm" variant={user.status === "active" ? "destructive" : "default"} onClick={() => toggleStatus(user)}>
                    {user.status === "active" ? "Inactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">Sin usuarios RRHH registrados aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RRHHUsuarios;
