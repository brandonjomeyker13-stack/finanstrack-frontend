import { ArrowDownLeft, ArrowUpRight, Bank, Coffee, CreditCard, PiggyBank, Wallet } from "@phosphor-icons/react";
import type { Bolsa } from "./api";
import { pesos } from "./format";

export function IconoBolsa({ id, size = 22 }: { id: string; size?: number }) {
  const Icono =
    id === "gustos" ? Coffee : id === "obligatorio" ? Bank : id === "deuda_extra" ? CreditCard : id === "colchon" ? PiggyBank : Wallet;
  return <Icono size={size} weight="duotone" aria-hidden="true" />;
}

export function ResumenMovimiento({ ingresado, gastado }: { ingresado: number; gastado: number }) {
  return (
    <div className="ft-totales">
      <div className="ft-total">
        <span className="ft-icono ingreso">
          <ArrowDownLeft size={24} aria-hidden="true" />
        </span>
        <div>
          <p>Ingresos del periodo</p>
          <strong>{pesos(ingresado)}</strong>
        </div>
      </div>
      <div className="ft-total">
        <span className="ft-icono salida">
          <ArrowUpRight size={24} aria-hidden="true" />
        </span>
        <div>
          <p>Gastos del periodo</p>
          <strong>{pesos(gastado)}</strong>
        </div>
      </div>
    </div>
  );
}

export function Distribucion({ bolsas }: { bolsas: Bolsa[] }) {
  const total = bolsas.reduce((suma, bolsa) => suma + Math.max(0, bolsa.asignado), 0);
  let recorrido = 0;
  return (
    <div className="ft-distribucion">
      <svg viewBox="0 0 120 120" role="img" aria-label="Distribución de tu presupuesto" className="ft-donut">
        <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="12" className="ft-anillo-base" />
        {bolsas.map((bolsa) => {
          const parte = total > 0 ? (Math.max(0, bolsa.asignado) / total) * 289.03 : 0;
          const inicio = recorrido;
          recorrido += parte;
          return (
            <circle
              key={bolsa.id}
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${Math.max(0, parte - 3)} 289.03`}
              strokeDashoffset={-inicio}
              transform="rotate(-90 60 60)"
              className={`ft-color-${bolsa.id}`}
            />
          );
        })}
        <text x="60" y="57" textAnchor="middle" className="ft-donut-label">
          Tu pago
        </text>
        <text x="60" y="73" textAnchor="middle" className="ft-donut-total">
          100%
        </text>
      </svg>
      <div className="ft-leyenda">
        {bolsas.map((bolsa) => (
          <div key={bolsa.id}>
            <span className={`ft-punto ft-color-${bolsa.id}`} />
            <span>{bolsa.nombre}</span>
            <strong>{bolsa.porcentaje}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
