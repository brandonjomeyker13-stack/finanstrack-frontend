export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  onboarding_completo: boolean;
};

export type Token = {
  access_token: string;
  refresh_token: string;
  usuario: Usuario;
};

export type Bolsa = {
  id: string;
  nombre: string;
  detalle: string;
  porcentaje: number;
  asignado: number;
  gastado: number;
  disponible: number;
};

export type Presupuesto = {
  estado: string;
  frase: string;
  nombre: string;
  monto_pago: number;
  nombre_pago: string;
  saldo_apertura: number;
  ingreso_confirmado: number;
  ingreso_esperado: number;
  disponible_para_gastar: number;
  por_dia: number;
  faltante: number;
  ciclo: {
    inicio: string;
    fin: string;
    dias_restantes: number;
    frecuencia: string;
    proximo_pago: string;
  };
  bolsas: Bolsa[];
  colchon: { saldo: number; aporte_del_ciclo: number; porcentaje: number };
  reservas: { cuotas: number; cuentas: number; cuotas_pagadas: number; cuentas_pagadas: number };
  ajustes: { bolsa: string; nombre: string; monto: number; motivo: string }[];
  pago_fijo: { id: string; monto: number; fecha: string; confirmado: boolean; nombre: string } | null;
};

export type Recordatorio = {
  tipo: string;
  id: string;
  nombre: string;
  monto: number;
  vence: string;
  cuando: "manana" | "hoy" | "vencido" | string;
};

export type Informe = {
  recordatorios: Recordatorio[];
  actual: { inicio: string; fin: string; ingresado: number; gastado: number };
  anterior: { inicio: string; fin: string; ingresado: number; gastado: number } | null;
  diferencia_gasto: number | null;
  frase: string;
  consejos: string[];
};

export type Impacto = {
  nivel: string;
  frase: string;
  por_dia_despues: number;
  total_despues: number;
  cubierto_por_colchon: number;
};

export type Gasto = {
  id: string;
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: string;
  origen: string;
  nivel_alerta: string;
  explicacion: string | null;
  deuda_id: string | null;
  cuenta_fija_id: string | null;
  frase: string | null;
};

export type Ingreso = {
  id: string;
  monto: number;
  fecha: string;
  estado: string;
  descripcion: string;
  es_pago_fijo: boolean;
};

export type Deuda = {
  id: string;
  nombre: string;
  tipo: string;
  monto_total: number;
  saldo_pendiente: number;
  tasa_interes_anual: number | null;
  cuota_minima: number | null;
  dia_de_pago: number | null;
  fecha_limite: string | null;
  compromiso: number;
  cuota_pagada: boolean;
  vencida: boolean;
  sugerida: boolean;
  progreso: number;
};

export type Cuenta = {
  id: string;
  nombre: string;
  monto: number;
  dia_del_mes: number;
  compromiso: number;
  pagada: boolean;
};

export type Colchon = {
  saldo: number;
  aporte_del_ciclo: number;
  movimientos: { id: string; tipo: string; monto: number; fecha: string; motivo: string }[];
};

export type Meta = {
  id: string;
  nombre: string;
  monto_objetivo: number;
  monto_ahorrado: number;
  aporte_por_ciclo: number;
  fecha_deseada: string | null;
  restante: number;
  frase: string;
  progreso: number;
  no_cabe_este_ciclo: boolean;
};

export type Perfil = {
  frecuencia: string;
  dia_de_corte: number;
  segundo_dia_de_corte: number | null;
  ancla_de_pago: string | null;
  monto_pago: number;
  nombre_pago: string;
  pct_obligatorio: number;
  pct_deuda_extra: number;
  pct_variable: number;
  pct_gustos: number;
  pct_colchon: number;
};

const BASE = (import.meta.env["VITE_API_URL"] || "https://finanstrack-backend.onrender.com").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  codigo?: string | undefined;

  constructor(message: string, status: number, codigo?: string | undefined) {
    super(message);
    this.status = status;
    this.codigo = codigo;
  }
}

function leerMensaje(data: unknown): { texto: string; codigo?: string | undefined } {
  if (!data || typeof data !== "object") return { texto: "No pude completar eso." };
  const cuerpo = data as { detail?: unknown; codigo?: string | undefined };
  if (typeof cuerpo.detail === "string") return { texto: cuerpo.detail, codigo: cuerpo.codigo };
  if (Array.isArray(cuerpo.detail)) {
    const primero = cuerpo.detail[0] as { loc?: unknown[]; msg?: string } | undefined;
    const campo = Array.isArray(primero?.loc) ? primero.loc.join(".") : "";
    if (campo.includes("email")) return { texto: "Ese correo no sirve. Prueba con uno como nombre@gmail.com." };
    if (campo.includes("password")) return { texto: "La contraseña necesita entre 8 y 72 caracteres." };
  }
  return { texto: "Revisa los datos e inténtalo otra vez.", codigo: cuerpo.codigo };
}

export function guardarSesion(token: Token) {
  localStorage.setItem("ft_access", token.access_token);
  localStorage.setItem("ft_refresh", token.refresh_token);
}

export function borrarSesion() {
  localStorage.removeItem("ft_access");
  localStorage.removeItem("ft_refresh");
  window.dispatchEvent(new Event("ft-logout"));
}

async function refrescar(): Promise<boolean> {
  const refresh = localStorage.getItem("ft_refresh");
  if (!refresh) return false;
  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as Token;
  guardarSesion(data);
  return true;
}

export async function api<T>(path: string, options: RequestInit = {}, reintentar = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const access = localStorage.getItem("ft_access");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("No hay conexión con el servidor.", 0);
  }

  if (res.status === 401 && reintentar && !path.includes("/auth/login") && !path.includes("/auth/registro")) {
    const ok = await refrescar().catch(() => false);
    if (ok) return api<T>(path, options, false);
    borrarSesion();
    throw new ApiError("Tu sesión venció. Vuelve a entrar.", 401);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const mensaje = leerMensaje(data);
    throw new ApiError(mensaje.texto, res.status, mensaje.codigo);
  }
  return data as T;
}
