import { useEffect, useState } from "react";
import { ApiError, api, type Gasto, type Ingreso } from "@/app/api";
import { fechaCorta, pesos, soloDia } from "@/app/format";
import { IconoBolsa, ResumenMovimiento } from "@/app/dashboard";
import { Boton, Campo, CampoDinero, Cargando, Screen } from "@/app/ui";
import { ArrowDownLeft, Trash } from "@phosphor-icons/react";

const NOMBRES: Record<string, string> = {
  obligatorio: "Cuentas",
  deuda_extra: "Deudas",
  variable: "Día a día",
  gustos: "Gustos",
  colchon: "Colchón",
};

export function Movimientos() {
  const [gastos, setGastos] = useState<Gasto[] | null>(null);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [error, setError] = useState("");
  const [extra, setExtra] = useState(false);
  const [monto, setMonto] = useState(0);
  const [descripcion, setDescripcion] = useState("");

  async function cargar() {
    try {
      const [lista, entradas] = await Promise.all([
        api<Gasto[]>("/api/v1/gastos"),
        api<Ingreso[]>("/api/v1/ingresos"),
      ]);
      setGastos(lista);
      setIngresos(entradas);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude cargar los movimientos.");
      setGastos([]);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function borrar(id: string) {
    setError("");
    try {
      await api(`/api/v1/gastos/${id}`, { method: "DELETE" });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude borrarlo.");
    }
  }

  async function agregarIngreso() {
    if (monto <= 0 || !descripcion.trim()) return;
    setError("");
    try {
      await api("/api/v1/ingresos", {
        method: "POST",
        body: JSON.stringify({ monto, descripcion: descripcion.trim(), confirmado: true }),
      });
      setMonto(0);
      setDescripcion("");
      setExtra(false);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude anotar el ingreso.");
    }
  }

  const grupos = new Map<string, Gasto[]>();
  for (const gasto of gastos || []) {
    const lista = grupos.get(gasto.fecha) || [];
    lista.push(gasto);
    grupos.set(gasto.fecha, lista);
  }

  return (
    <Screen conNav clase="ft-movimientos">
      <p className="kicker">Este periodo</p>
      <h1>Movimientos</h1>
      {gastos && (
        <ResumenMovimiento
          ingresado={ingresos.filter((ingreso) => ingreso.estado === "confirmado").reduce((suma, ingreso) => suma + ingreso.monto, 0)}
          gastado={gastos.reduce((suma, gasto) => suma + gasto.monto, 0)}
        />
      )}
      {error && <p className="error">{error}</p>}
      {gastos === null ? (
        <Cargando />
      ) : (
        <>
          <section className="ft-panel">
            <h2>Ingresos</h2>
            {ingresos.length === 0 && <p className="vacio">Todavía no hay un pago en este periodo.</p>}
            {ingresos.map((ingreso) => (
              <div className="item" key={ingreso.id}>
                <span className="ft-icono ingreso">
                  <ArrowDownLeft size={22} aria-hidden="true" />
                </span>
                <div>
                  <strong>{ingreso.descripcion}</strong>
                  <p className="detalle">
                    {soloDia(ingreso.fecha)} · {ingreso.estado === "confirmado" ? "Ya llegó" : "Lo esperas"}
                  </p>
                </div>
                <span className="tabular strong">{pesos(ingreso.monto)}</span>
              </div>
            ))}
            {!extra ? (
              <Boton variante="suave" onClick={() => setExtra(true)}>
                Anotar otro ingreso
              </Boton>
            ) : (
              <>
                <Campo etiqueta="Qué fue" value={descripcion} onChange={setDescripcion} placeholder="Venta, bono" />
                <CampoDinero etiqueta="Monto" value={monto} onChange={setMonto} />
                <Boton onClick={() => void agregarIngreso()}>Guardar</Boton>
              </>
            )}
          </section>

          <section className="grupo">
            <h2>Gastos</h2>
            {gastos.length === 0 && (
              <p className="vacio">Cuando anotes un gasto, queda aquí. Se puede borrar si te equivocaste.</p>
            )}
            {[...grupos.entries()].map(([fecha, lista]) => (
              <div key={fecha}>
                <p className="kicker" style={{ marginTop: 16 }}>
                  {fechaCorta(fecha)}
                </p>
                {lista.map((gasto) => (
                  <div className="item" key={gasto.id}>
                    <span className={`ft-icono ft-color-${gasto.categoria}`}>
                      <IconoBolsa id={gasto.categoria} />
                    </span>
                    <div>
                      <strong>{gasto.descripcion}</strong>
                      <p className="detalle">
                        {NOMBRES[gasto.categoria] || gasto.categoria}
                        {gasto.explicacion ? ` · ${gasto.explicacion}` : ""}
                      </p>
                    </div>
                    <span className="tabular strong">{pesos(gasto.monto)}</span>
                    <Boton
                      variante="texto"
                      clase="ft-icon-button ft-borrar"
                      titulo={`Borrar ${gasto.descripcion}`}
                      onClick={() => void borrar(gasto.id)}
                    >
                      <Trash size={19} />
                    </Boton>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </>
      )}
    </Screen>
  );
}
