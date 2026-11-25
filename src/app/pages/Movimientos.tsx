import { useEffect, useState } from "react";
import { ApiError, api, type Gasto, type Ingreso } from "@/app/api";
import { fechaCorta, pesos, soloDia } from "@/app/format";
import { Boton, Campo, CampoDinero, Cargando, Screen } from "@/app/ui";

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
    <Screen conNav>
      <p className="kicker">Este periodo</p>
      <h1>Lo que entró y salió</h1>
      {error && <p className="error">{error}</p>}
      {gastos === null ? (
        <Cargando />
      ) : (
        <>
          <section className="card">
            <h2>Ingresos</h2>
            {ingresos.length === 0 && <p className="vacio">Todavía no hay un pago en este periodo.</p>}
            {ingresos.map((ingreso) => (
              <div className="item" key={ingreso.id}>
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
                    <div>
                      <strong>{gasto.descripcion}</strong>
                      <p className="detalle">
                        {NOMBRES[gasto.categoria] || gasto.categoria}
                        {gasto.explicacion ? ` · ${gasto.explicacion}` : ""}
                      </p>
                      <button className="linkish" type="button" onClick={() => void borrar(gasto.id)}>
                        Borrar
                      </button>
                    </div>
                    <span className="tabular strong">{pesos(gasto.monto)}</span>
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
