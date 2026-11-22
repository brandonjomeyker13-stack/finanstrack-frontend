import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, borrarSesion, guardarSesion, type Token, type Usuario } from "./api";

type Auth = {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  registrar: (nombre: string, email: string, password: string) => Promise<void>;
  conGoogle: (credential: string) => Promise<void>;
  salir: () => Promise<void>;
  recargar: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

async function aplicar(token: Token, setUsuario: (u: Usuario) => void) {
  guardarSesion(token);
  setUsuario(token.usuario);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function recargar() {
    const yo = await api<Usuario>("/api/v1/auth/yo");
    setUsuario(yo);
  }

  useEffect(() => {
    const token = localStorage.getItem("ft_access");
    if (!token) {
      setCargando(false);
      return;
    }
    recargar()
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
    const alSalir = () => setUsuario(null);
    window.addEventListener("ft-logout", alSalir);
    return () => window.removeEventListener("ft-logout", alSalir);
  }, []);

  async function entrar(email: string, password: string) {
    const token = await api<Token>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await aplicar(token, setUsuario);
  }

  async function registrar(nombre: string, email: string, password: string) {
    const token = await api<Token>("/api/v1/auth/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, email, password }),
    });
    await aplicar(token, setUsuario);
  }

  async function conGoogle(credential: string) {
    const token = await api<Token>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    await aplicar(token, setUsuario);
  }

  async function salir() {
    const refresh = localStorage.getItem("ft_refresh");
    if (refresh) {
      await api("/api/v1/auth/cerrar-sesion", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
      }).catch(() => undefined);
    }
    borrarSesion();
    setUsuario(null);
  }

  return (
    <Ctx.Provider value={{ usuario, cargando, entrar, registrar, conGoogle, salir, recargar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Auth");
  return ctx;
}
