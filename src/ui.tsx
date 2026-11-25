import type { MouseEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { miles } from "./format";

export function Screen({ children, conNav = false }: { children: ReactNode; conNav?: boolean }) {
  return <main className={conNav ? "screen navpad" : "screen"}>{children}</main>;
}

export function Boton({
  children,
  onClick,
  type = "button",
  disabled,
  variante,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variante?: "oscuro" | "suave" | "texto";
}) {
  return (
    <button type={type} className={variante ? `btn ${variante}` : "btn"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Campo({
  etiqueta,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  etiqueta: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function CampoDinero({
  etiqueta,
  value,
  onChange,
}: {
  etiqueta: string;
  value: number;
  onChange: (valor: number) => void;
}) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <input
        className="dinero"
        inputMode="numeric"
        placeholder="0"
        value={value ? miles(value) : ""}
        onChange={(e) => {
          const limpio = e.target.value.replace(/\D/g, "").slice(0, 12);
          onChange(limpio ? Number(limpio) : 0);
        }}
      />
    </label>
  );
}

export function Dias({ value, onChange }: { value: number | null; onChange: (dia: number) => void }) {
  return (
    <div className="days" role="group" aria-label="Día del mes">
      {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
        <button
          key={dia}
          type="button"
          className={dia === value ? "day on" : "day"}
          onClick={() => onChange(dia)}
        >
          {dia}
        </button>
      ))}
    </div>
  );
}

const ORDEN = ["/", "/gastar", "/movimientos", "/plan"];

function Icono({ d }: { d: string }) {
  return (
    <svg className="nav-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Nav() {
  const { pathname } = useLocation();
  const navegar = useNavigate();

  function alIr(destino: string) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const desde = ORDEN.indexOf(pathname);
      const hacia = ORDEN.indexOf(destino);
      if (desde < 0 || hacia < 0 || desde === hacia) return;
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const soporta =
        typeof document.startViewTransition === "function" &&
        CSS.supports("selector(:active-view-transition-type(forward))");
      if (reducir || !soporta) return;
      e.preventDefault();
      const update = () => flushSync(() => navegar(destino));
      (
        document.startViewTransition as unknown as (opciones: {
          update: () => void;
          types: string[];
        }) => void
      )({
        update,
        types: [hacia > desde ? "forward" : "backward"],
      });
    };
  }

  return (
    <nav className="nav" aria-label="Principal">
      <p className="nav-marca">Finanstrack</p>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "activo" : "")} onClick={alIr("/")}>
        <Icono d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        Hoy
      </NavLink>
      <NavLink
        to="/gastar"
        className={({ isActive }) => (isActive ? "gastar activo" : "gastar")}
        onClick={alIr("/gastar")}
      >
        <Icono d="M12 5v14M5 12h14" />
        Gastar
      </NavLink>
      <NavLink
        to="/movimientos"
        className={({ isActive }) => (isActive ? "activo" : "")}
        onClick={alIr("/movimientos")}
      >
        <Icono d="M5 7h14M5 12h14M5 17h9" />
        Gastos
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? "activo" : "")} onClick={alIr("/plan")}>
        <Icono d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" />
        Plan
      </NavLink>
    </nav>
  );
}

export function Cargando() {
  return <p className="muted">Un momento…</p>;
}
