import { useEffect, useState } from "react";
import { ApiError, api, type Colchon, type Cuenta, type Deuda, type Meta } from "../api";
import { pesos } from "../format";
import { Boton, Campo, CampoDinero, Cargando, Dias, Screen } from "../ui";

type Pestaña = "deudas" | "cuentas" | "colchon" | "metas";

export function Plan() {
  const [pestaña, setPestaña] = useState<Pestaña>("deudas");
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [colchon, setColchon] = useState<Colchon | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function cargar() {
    try {
      const [d, c, k, m] = await Promise.all([
        api<Deuda[]>("/api/v1/deudas"),
        api<Cuenta[]>("/api/v1/cuentas-fijas"),
        api<Colchon>("/api/v1/colchon"),
        api<Meta[]>("/api/v1/metas"),
      ]);
      setDeudas(d);
      setCuentas(c);
      setColchon(k);
      setMetas(m);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude cargar el plan.");
    } finally {
      setListo(true);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  return (
    <Screen conNav>
      <p className="kicker">Para que el pago alcance</p>
      <h1>Plan</h1>
      <div className="tabs">
        {(
          [
            ["deudas", "Deudas"],
            ["cuentas", "Cuentas"],
            ["colchon", "Colchón"],
            ["metas", "Metas"],
          ] as const
        ).map(([id, nombre]) => (
          <button key={id} type="button" className={pestaña === id ? "on" : ""} onClick={() => setPestaña(id)}>
            {nombre}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {!listo ? (
        <Cargando />
      ) : (
        <>
          {pestaña === "deudas" && <Deudas deudas={deudas} alCambiar={cargar} />}
          {pestaña === "cuentas" && <Cuentas cuentas={cuentas} alCambiar={cargar} />}
          {pestaña === "colchon" && colchon && <ColchonVista datos={colchon} alCambiar={cargar} />}
          {pestaña === "metas" && <Metas metas={metas} alCambiar={cargar} />}
        </>
      )}
    </Screen>
  );
}

function Deudas({ deudas, alCambiar }: { deudas: Deuda[]; alCambiar: () => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"cuotas" | "pago_unico">("cuotas");
  const [total, setTotal] = useState(0);
  const [cuota, setCuota] = useState(0);
  const [dia, setDia] = useState<number | null>(5);
  const [fecha, setFecha] = useState("");
  const [tasa, setTasa] = useState("");
  const [error, setError] = useState("");

  async function crear() {
    setError("");
    try {
      await api("/api/v1/deudas", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo,
          monto_total: total,
          cuota_minima: tipo === "cuotas" ? cuota : null,
          dia_de_pago: tipo === "cuotas" ? dia : null,
          fecha_limite: tipo === "pago_unico" ? fecha : null,
          tasa_interes_anual: tasa ? Number(tasa) : null,
        }),
      });
      setAbierta(false);
      setNombre("");
      setTotal(0);
      setCuota(0);
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude guardar la deuda.");
    }
  }

  async function abonar(deuda: Deuda, comoCuota: boolean, monto: number) {
    setError("");
    try {
      await api(`/api/v1/deudas/${deuda.id}/abonar`, {
        method: "POST",
        body: JSON.stringify({ monto, como_cuota: comoCuota }),
      });
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude anotar el pago.");
    }
  }

  async function quitar(id: string) {
    await api(`/api/v1/deudas/${id}`, { method: "DELETE" });
    await alCambiar();
  }

  return (
    <section className="grupo">
      {deudas.length === 0 && <p className="vacio">Si no debes, mejor. Si debes, anótalo para apartar la cuota.</p>}
      {deudas.map((deuda) => (
        <article className="card" key={deuda.id}>
          <div className="row">
            <strong>
              {deuda.nombre}
              {deuda.sugerida ? " · conviene abonar" : ""}
              {deuda.vencida ? " · vencida" : ""}
            </strong>
            <span className="tabular">{pesos(deuda.saldo_pendiente)}</span>
          </div>
          <div className="barra-meta">
            <span style={{ width: `${Math.round(deuda.progreso * 100)}%` }} />
          </div>
          <p className="detalle">
            {deuda.tipo === "cuotas"
              ? `Cuota ${pesos(deuda.cuota_minima || 0)} el día ${deuda.dia_de_pago}. ${
                  deuda.cuota_pagada ? "Ya pagada en este periodo." : `Este periodo aparta ${pesos(deuda.compromiso)}.`
                }`
              : `Hay que pagarla ${deuda.fecha_limite || "pronto"}.`}
          </p>
          {deuda.saldo_pendiente > 0 && deuda.tipo === "cuotas" && !deuda.cuota_pagada && (
            <Boton onClick={() => void abonar(deuda, true, deuda.cuota_minima || deuda.saldo_pendiente)}>
              Pagar cuota
            </Boton>
          )}
          {deuda.saldo_pendiente > 0 && (
            <Boton variante="suave" onClick={() => void abonar(deuda, false, deuda.saldo_pendiente)}>
              {deuda.tipo === "pago_unico" ? "Pagarla toda" : "Abonar el saldo"}
            </Boton>
          )}
          <Boton variante="texto" onClick={() => void quitar(deuda.id)}>
            Quitar de la lista
          </Boton>
        </article>
      ))}
      {error && <p className="error">{error}</p>}
      {!abierta ? (
        <Boton onClick={() => setAbierta(true)}>Agregar una deuda</Boton>
      ) : (
        <div className="card">
          <Campo etiqueta="Nombre" value={nombre} onChange={setNombre} />
          <div className="chips">
            <button type="button" className={tipo === "cuotas" ? "chip on" : "chip"} onClick={() => setTipo("cuotas")}>
              Cuotas
            </button>
            <button
              type="button"
              className={tipo === "pago_unico" ? "chip on" : "chip"}
              onClick={() => setTipo("pago_unico")}
            >
              Una sola vez
            </button>
          </div>
          <CampoDinero etiqueta="Cuánto debías" value={total} onChange={setTotal} />
          {tipo === "cuotas" ? (
            <>
              <CampoDinero etiqueta="Cuota de este periodo" value={cuota} onChange={setCuota} />
              <p className="rotulo">Día de pago</p>
              <Dias value={dia} onChange={setDia} />
            </>
          ) : (
            <Campo etiqueta="¿Para cuándo?" type="date" value={fecha} onChange={setFecha} />
          )}
          <Campo etiqueta="Tasa anual, si la sabes" value={tasa} onChange={setTasa} placeholder="28" />
          <Boton onClick={() => void crear()} disabled={!nombre.trim() || total <= 0}>
            Guardar
          </Boton>
        </div>
      )}
    </section>
  );
}

function Cuentas({ cuentas, alCambiar }: { cuentas: Cuenta[]; alCambiar: () => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState(0);
  const [dia, setDia] = useState<number | null>(5);
  const [error, setError] = useState("");

  async function crear() {
    setError("");
    try {
      await api("/api/v1/cuentas-fijas", {
        method: "POST",
        body: JSON.stringify({ nombre: nombre.trim(), monto, dia_del_mes: dia }),
      });
      setAbierta(false);
      setNombre("");
      setMonto(0);
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude guardar la cuenta.");
    }
  }

  async function pagar(cuenta: Cuenta) {
    setError("");
    try {
      await api(`/api/v1/cuentas-fijas/${cuenta.id}/pagar`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude anotar el pago.");
    }
  }

  return (
    <section className="grupo">
      {cuentas.length === 0 && <p className="vacio">Arriendo, luz, plan. Lo que se paga sí o sí.</p>}
      {cuentas.map((cuenta) => (
        <article className="card" key={cuenta.id}>
          <div className="row">
            <strong>{cuenta.nombre}</strong>
            <span className="tabular">{pesos(cuenta.monto)}</span>
          </div>
          <p className="detalle">
            Día {cuenta.dia_del_mes}.{" "}
            {cuenta.pagada
              ? "Ya la pagaste en este periodo."
              : cuenta.compromiso > 0
                ? "Está apartada."
                : "En este periodo no cae."}
          </p>
          {!cuenta.pagada && cuenta.compromiso > 0 && (
            <Boton onClick={() => void pagar(cuenta)}>Marcar como pagada</Boton>
          )}
          <Boton
            variante="texto"
            onClick={() => {
              void api(`/api/v1/cuentas-fijas/${cuenta.id}`, { method: "DELETE" }).then(alCambiar);
            }}
          >
            Quitar
          </Boton>
        </article>
      ))}
      {error && <p className="error">{error}</p>}
      {!abierta ? (
        <Boton onClick={() => setAbierta(true)}>Agregar una cuenta fija</Boton>
      ) : (
        <div className="card">
          <Campo etiqueta="Nombre" value={nombre} onChange={setNombre} placeholder="Arriendo" />
          <CampoDinero etiqueta="Monto" value={monto} onChange={setMonto} />
          <p className="rotulo">Día del mes</p>
          <Dias value={dia} onChange={setDia} />
          <Boton onClick={() => void crear()} disabled={!nombre.trim() || monto <= 0}>
            Guardar
          </Boton>
        </div>
      )}
    </section>
  );
}

function ColchonVista({ datos, alCambiar }: { datos: Colchon; alCambiar: () => Promise<void> }) {
  const [monto, setMonto] = useState(0);
  const [error, setError] = useState("");

  async function aportar() {
    if (monto <= 0) return;
    setError("");
    try {
      await api("/api/v1/colchon/aportar", { method: "POST", body: JSON.stringify({ monto }) });
      setMonto(0);
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude meter esa plata.");
    }
  }

  return (
    <section className="grupo">
      <section className="hero">
        <p className="eyebrow">Guardado</p>
        <p className="numero">{pesos(datos.saldo)}</p>
        <p className="sub">Este periodo suma {pesos(datos.aporte_del_ciclo)} solo, del porcentaje.</p>
      </section>
      <CampoDinero etiqueta="Meter más, a mano" value={monto} onChange={setMonto} />
      <Boton onClick={() => void aportar()} disabled={monto <= 0}>
        Meter al colchón
      </Boton>
      {error && <p className="error">{error}</p>}
      <div className="card">
        {datos.movimientos.length === 0 && <p className="vacio">Todavía no hay movimientos.</p>}
        {datos.movimientos.map((mov) => (
          <div className="item" key={mov.id}>
            <div>
              <strong>{mov.motivo}</strong>
              <p className="detalle">{mov.fecha}</p>
            </div>
            <span className="tabular">
              {mov.tipo === "retiro" ? "−" : "+"}
              {pesos(mov.monto)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metas({ metas, alCambiar }: { metas: Meta[]; alCambiar: () => Promise<void> }) {
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState(0);
  const [ahorrado, setAhorrado] = useState(0);
  const [aporte, setAporte] = useState(0);
  const [error, setError] = useState("");

  async function crear() {
    setError("");
    try {
      await api("/api/v1/metas", {
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          monto_objetivo: objetivo,
          monto_ahorrado: ahorrado,
          aporte_por_ciclo: aporte,
        }),
      });
      setAbierta(false);
      setNombre("");
      setObjetivo(0);
      setAhorrado(0);
      setAporte(0);
      await alCambiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude guardar la meta.");
    }
  }

  async function actualizarAhorro(meta: Meta, valor: number) {
    await api(`/api/v1/metas/${meta.id}`, {
      method: "PATCH",
      body: JSON.stringify({ monto_ahorrado: valor }),
    });
    await alCambiar();
  }

  return (
    <section className="grupo">
      {metas.length === 0 && <p className="vacio">Algo que quieres, con un número. No mueve plata: solo te dice si cabe.</p>}
      {metas.map((meta) => (
        <article className="card" key={meta.id}>
          <div className="row">
            <strong>{meta.nombre}</strong>
            <span className="tabular">{pesos(meta.monto_ahorrado)}</span>
          </div>
          <div className="barra-meta">
            <span style={{ width: `${Math.min(100, Math.round(meta.progreso * 100))}%` }} />
          </div>
          <p className="detalle">
            Objetivo {pesos(meta.monto_objetivo)}. {meta.frase}
          </p>
          {meta.aporte_por_ciclo > 0 && (
            <Boton variante="suave" onClick={() => void actualizarAhorro(meta, meta.monto_ahorrado + meta.aporte_por_ciclo)}>
              Ya aparté {pesos(meta.aporte_por_ciclo)}
            </Boton>
          )}
        </article>
      ))}
      {error && <p className="error">{error}</p>}
      {!abierta ? (
        <Boton onClick={() => setAbierta(true)}>Nueva meta</Boton>
      ) : (
        <div className="card">
          <Campo etiqueta="Qué quieres" value={nombre} onChange={setNombre} />
          <CampoDinero etiqueta="Cuánto necesitas" value={objetivo} onChange={setObjetivo} />
          <CampoDinero etiqueta="Cuánto ya tienes" value={ahorrado} onChange={setAhorrado} />
          <CampoDinero etiqueta="Cuánto apartas cada pago" value={aporte} onChange={setAporte} />
          <Boton onClick={() => void crear()} disabled={!nombre.trim() || objetivo <= 0}>
            Guardar
          </Boton>
        </div>
      )}
    </section>
  );
}
