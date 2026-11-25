import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
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

export function Nav() {
  return (
    <nav className="nav" aria-label="Principal">
      <p className="nav-marca">Finanstrack</p>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "activo" : "")}>
        Hoy
      </NavLink>
      <NavLink to="/gastar" className={({ isActive }) => (isActive ? "gastar activo" : "gastar")}>
        Gastar
      </NavLink>
      <NavLink to="/movimientos" className={({ isActive }) => (isActive ? "activo" : "")}>
        Gastos
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? "activo" : "")}>
        Plan
      </NavLink>
    </nav>
  );
}

export function Cargando() {
  return <p className="muted">Un momento…</p>;
}
