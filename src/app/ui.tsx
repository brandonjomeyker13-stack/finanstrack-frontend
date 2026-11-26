import type { ReactNode } from "react";
import { NavLink } from "@/app/router-compat";
import { ChartPie, GearSix, House, ListBullets, Plus } from "@phosphor-icons/react";
import { miles } from "./format";
import logo from "@/assets/finanstrack-logo.png";

export function Screen({
  children,
  conNav = false,
  clase = "",
}: {
  children: ReactNode;
  conNav?: boolean;
  clase?: string;
}) {
  return <main className={["screen", conNav ? "navpad" : "", clase].filter(Boolean).join(" ")}>{children}</main>;
}

export function Boton({
  children,
  onClick,
  type = "button",
  disabled,
  variante,
  clase = "",
  titulo,
  seleccionado,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variante?: "oscuro" | "suave" | "texto";
  clase?: string;
  titulo?: string;
  seleccionado?: boolean;
}) {
  return (
    <button
      type={type}
      className={["btn", variante, clase].filter(Boolean).join(" ")}
      title={titulo}
      aria-label={titulo}
      aria-pressed={seleccionado}
      onClick={onClick}
      disabled={disabled}
    >
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

export function Nav() {
  return (
    <nav className="nav" aria-label="Principal">
      <p className="nav-marca">
        <img src={logo} alt="" width={30} height={30} />
        Finanstrack
      </p>
      <span className="ft-nav-label">MI DINERO</span>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "activo" : "")}>
        <House className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        <span>Hoy</span>
      </NavLink>
      <NavLink to="/gastar" className={({ isActive }) => (isActive ? "gastar activo" : "gastar")}>
        <Plus className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        <span>Gastar</span>
      </NavLink>
      <NavLink to="/movimientos" className={({ isActive }) => (isActive ? "activo" : "")}>
        <ListBullets className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        <span>Gastos</span>
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? "activo" : "")}>
        <ChartPie className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        <span>Plan</span>
      </NavLink>
      <div className="ft-nav-pie">
        <NavLink to="/ajustes" className={({ isActive }) => (isActive ? "activo" : "")}>
          <GearSix size={22} className="nav-ico" aria-hidden="true" />
          <span>Ajustes</span>
        </NavLink>
        <p>Un paso a la vez.</p>
      </div>
    </nav>
  );
}

export function Cargando() {
  return (
    <div className="ft-skeleton" aria-label="Cargando">
      <span /><span /><span />
    </div>
  );
}
