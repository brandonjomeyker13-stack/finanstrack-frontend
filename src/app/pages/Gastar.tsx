import { useEffect, useState } from "react";
import { useNavigate } from "@/app/router-compat";
import { ApiError, api, type Impacto } from "@/app/api";
import { IconoBolsa } from "@/app/dashboard";
import { Boton, Campo, CampoDinero, Screen } from "@/app/ui";
import { Check, Wallet } from "@phosphor-icons/react";
import { pesos } from "@/app/format";

const BOLSAS = [
  ["variable", "Día a día"],
  ["gustos", "Gustos"],
  ["obligatorio", "Cuentas"],
  ["deuda_extra", "Deudas"],
  ["colchon", "Colchón"],
] as const;

const ORIGENES = [
  ["ingreso_extra", "Me entró plata que no anoté"],
  ["ahorro", "La saqué de un ahorro"],
  ["prestamo", "Me la prestaron"],
  ["desconocido", "No estoy seguro"],
] as const;

export function Gastar() {
  const navegar = useNavigate();
  const [monto, setMonto] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<(typeof BOLSAS)[number][0]>("variable");
  const [impacto, setImpacto] = useState<Impacto | null>(null);
  const [explicacion, setExplicacion] = useState("");
  const [origen, setOrigen] = useState<(typeof ORIGENES)[number][0]>("desconocido");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (monto <= 0) {
      setImpacto(null);
      return;
    }
    const reloj = window.setTimeout(() => {
      api<Impacto>("/api/v1/presupuesto/impacto", {
        method: "POST",
        body: JSON.stringify({ monto, categoria }),
      })
        .then(setImpacto)
        .catch(() => setImpacto(null));
    }, 280);
    return () => window.clearTimeout(reloj);
  }, [monto, categoria]);

  const seSale = impacto?.nivel === "rompe_total";

  async function anotar() {
    setError("");
    if (monto <= 0 || !descripcion.trim()) {
      setError("Falta el monto o en qué se fue.");
      return;
    }
    if (seSale && !explicacion.trim()) {
      setError("Cuéntame de dónde sale, o bájale al monto.");
      return;
    }
    setOcupado(true);
    try {
      await api("/api/v1/gastos", {
        method: "POST",
        body: JSON.stringify({
          monto,
          descripcion: descripcion.trim(),
          categoria,
          explicacion: explicacion.trim() || null,
          origen: seSale && categoria !== "colchon" ? origen : null,
        }),
      });
      navegar("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude anotarlo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Screen conNav clase="ft-gastar">
      <p className="kicker">Un gasto a la vez</p>
      <h1>Anotar un gasto</h1>
      <div className="ft-gasto-layout">
        <div className="ft-formulario">
      <CampoDinero etiqueta="Monto" value={monto} onChange={setMonto} />
      <Campo etiqueta="Qué fue" value={descripcion} onChange={setDescripcion} placeholder="Almuerzo, bus, mercado" />
      <p className="rotulo" style={{ marginTop: 16 }}>
        De qué bolsa
      </p>
      <div className="chips">
        {BOLSAS.map(([id, nombre]) => (
          <Boton
            key={id}
            type="button"
            clase={categoria === id ? "chip on" : "chip"}
            seleccionado={categoria === id}
            onClick={() => setCategoria(id)}
          >
            <IconoBolsa id={id} size={19} />
            {nombre}
          </Boton>
        ))}
      </div>
        </div>
        <aside className="ft-impacto">
          <span className="ft-icono ingreso">
            <Wallet size={26} aria-hidden="true" />
          </span>
          <h2>Después de este gasto</h2>
          {impacto ? (
            <div className={seSale ? "aviso malo" : impacto.nivel === "rompe_bolsa" ? "aviso" : "aviso bien"}>
              <p style={{ margin: 0 }}>{impacto.frase}</p>
            </div>
          ) : (
            <p className="detalle">{monto > 0 ? "Calculando el disponible…" : "Disponible por día"}</p>
          )}
          <strong className="ft-impacto-numero">{impacto ? pesos(impacto.por_dia_despues) : "—"}</strong>
          {impacto && <p className="detalle">{pesos(impacto.total_despues)} disponibles en el periodo</p>}
        </aside>
      </div>

      {seSale && (
        <>
          <label className="campo">
            <span>¿De dónde sale?</span>
            <select value={origen} onChange={(e) => setOrigen(e.target.value as typeof origen)}>
              {ORIGENES.map(([id, texto]) => (
                <option key={id} value={id}>
                  {texto}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Cuéntalo en una frase</span>
            <textarea value={explicacion} maxLength={280} onChange={(e) => setExplicacion(e.target.value)} />
          </label>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <Boton onClick={() => void anotar()} disabled={ocupado}>
        <Check size={20} aria-hidden="true" />
        {ocupado ? "Anotando…" : seSale ? "Anotar igual" : "Anotar"}
      </Boton>
    </Screen>
  );
}
