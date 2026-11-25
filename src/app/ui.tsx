import type { MouseEvent, ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "@/app/router-compat";
import { ChartPie, House, ListBullets, Plus } from "@phosphor-icons/react";
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

const ORDEN = ["/", "/gastar", "/movimientos", "/plan"];

export function Nav() {
  const { pathname } = useLocation();
  const navegar = useNavigate();

  void pathname;
  void navegar;
  function alIr(_destino: string) {
    return (_e: MouseEvent<HTMLAnchorElement>) => undefined;
  }

  return (
    <nav className="nav" aria-label="Principal">
      <p className="nav-marca"><img src={logo} alt="" width={30} height={30} />Finanstrack</p>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "activo" : "")} onClick={alIr("/")}>
        <House className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        Hoy
      </NavLink>
      <NavLink
        to="/gastar"
        className={({ isActive }) => (isActive ? "gastar activo" : "gastar")}
        onClick={alIr("/gastar")}
      >
        <Plus className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        Gastar
      </NavLink>
      <NavLink
        to="/movimientos"
        className={({ isActive }) => (isActive ? "activo" : "")}
        onClick={alIr("/movimientos")}
      >
        <ListBullets className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        Gastos
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? "activo" : "")} onClick={alIr("/plan")}>
        <ChartPie className="nav-ico" size={22} weight="regular" aria-hidden="true" />
        Plan
      </NavLink>
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
