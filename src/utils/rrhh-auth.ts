
import { createClient } from '@supabase/supabase-js';

// RRHH auth usa la base de datos nativa (no el auth de Supabase)
export const rrhhClient = createClient(
  "https://kugocdtesaczbfrwblsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
);

// Hash password util con crypto-js para demo (en prod usar bcrypt@server o argon2+edge)
export async function hashPassword(password: string) {
  // SHA-256 para demo (NUNCA usar SHA-256 solo en producción real!)
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Login: verifica email/password y devuelve usuario o null; almacena sesión local simple
export async function rrhhLogin(email: string, password: string) {
  const password_hash = await hashPassword(password);
  const { data, error } = await rrhhClient
    .from("rrhh_users")
    .select("id, full_name, email, role_id, status")
    .eq("email", email)
    .eq("password_hash", password_hash)
    .maybeSingle();

  if (!data || error) return null;
  localStorage.setItem("rrhh_session", JSON.stringify({ ...data }));
  return data;
}

export function rrhhLogout() {
  localStorage.removeItem("rrhh_session");
  window.location.href = "/rrhh/login";
}

export function getRRHHUser() {
  const raw = localStorage.getItem("rrhh_session");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
