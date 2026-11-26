import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/app/router-compat";
import { ArrowRight, CalendarBlank, PiggyBank, Plus } from "@phosphor-icons/react";
import { ApiError, api, type Bolsa, type Informe, type Presupuesto } from "@/app/api";
import { fechaCorta, pesos } from "@/app/format";
import { Distribucion, IconoBolsa, ResumenMovimiento } from "@/app/dashboard";
import { Boton, Cargando, Screen } from "@/app/ui";

const FRECUENCIA: Record<string, string> = {
  mensual: "cada mes",
  quincenal: "cada quincena",
  catorcenal: "cada 14 días",
};

function reparto(foto: Presupuesto): Bolsa[] {
  return [
    ...foto.bolsas,
    {
      id: "colchon",
      nombre: "Colchón",
      detalle: "No se gasta. Se guarda para un golpe",
      porcentaje: foto.colchon.porcentaje,
      asignado: foto.colchon.aporte_del_ciclo,
      gastado: 0,
      disponible: foto.colchon.saldo,
    },
  ];
}

const CUANDO: Record<string, string> = {
  manana: "Mañana",
  hoy: "Hoy",
  vencido: "Venció",
};

export function Inicio() {
  const navegar = useNavigate();
  const [foto, setFoto] = useState<Presupuesto | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    setError("");
    try {
      const [periodo, resumen] = await Promise.all([
        api<Presupuesto>("/api/v1/presupuesto"),
        api<Informe>("/api/v1/informe"),
      ]);
      setFoto(periodo);
      setInforme(resumen);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude cargar tu periodo.");
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function confirmar() {
    if (!foto?.pago_fijo) return;
    setOcupado(true);
    try {
      await api(`/api/v1/ingresos/${foto.pago_fijo.id}/confirmar`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude confirmar el pago.");
    } finally {
      setOcupado(false);
    }
  }

  if (!foto && !error) {
    return (
      <Screen conNav>
        <Cargando />
      </Screen>
    );
  }

  const espera = foto?.estado === "esperando_pago";
  const mal = foto?.estado === "pasaste" || foto?.estado === "no_alcanza";
  const primer = foto?.nombre.split(" ")[0] || "";

  return (
    <Screen conNav clase="ft-inicio">
      <div className="top">
        <div>
          <p className="kicker">Tu dinero, al día</p>
          <h1>{primer ? `Hola, ${primer}` : "Tu resumen"}</h1>
          {foto && (
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              {fechaCorta(foto.ciclo.inicio)} – {fechaCorta(foto.ciclo.fin)} · {FRECUENCIA[foto.ciclo.frecuencia]}
            </p>
          )}
        </div>
        <Link to="/gastar" className="ft-accion">
          <Plus size={18} aria-hidden="true" />
          <span>Anotar gasto</span>
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="ft-resumen-principal">
      <div>

      {informe && informe.recordatorios.length > 0 && (
        <section className="aviso">
          <strong>Por vencer</strong>
          {informe.recordatorios.map((aviso) => (
            <p key={`${aviso.tipo}-${aviso.id}`}>
              {CUANDO[aviso.cuando] || "Pronto"} · {aviso.nombre} · {pesos(aviso.monto)} · {fechaCorta(aviso.vence)}
            </p>
          ))}
        </section>
      )}

      {foto && espera && (
        <section className="hero espera">
          <p className="eyebrow">{foto.nombre_pago} por llegar</p>
          <p className="numero">{pesos(foto.pago_fijo?.monto || foto.monto_pago)}</p>
          <p className="sub">{foto.frase}</p>
          {foto.pago_fijo && (
            <Boton onClick={() => void confirmar()} disabled={ocupado}>
              {ocupado ? "Anotando…" : "Ya me llegó"}
            </Boton>
          )}
        </section>
      )}

      {foto && !espera && (
        <section className="hero">
          <p className="eyebrow">Puedes gastar hoy</p>
          <p className={mal ? "numero malo" : "numero"}>{pesos(foto.por_dia)}</p>
          <p className="sub">
            {foto.disponible_para_gastar > 0
              ? `${pesos(foto.disponible_para_gastar)} para ${foto.ciclo.dias_restantes} días`
              : foto.frase}
          </p>
          <div className="ft-hero-pie">
            <span>
              <CalendarBlank size={17} aria-hidden="true" />
              {foto.ciclo.dias_restantes} días restantes
            </span>
            <Link to="/gastar">
              Anotar gasto <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
      </div>
      {foto && foto.bolsas.length > 0 && (
        <section className="ft-reparto">
          <h2>Así se reparte tu pago</h2>
          <Distribucion bolsas={reparto(foto)} />
        </section>
      )}
      </div>
      {informe && <ResumenMovimiento ingresado={informe.actual.ingresado} gastado={informe.actual.gastado} />}

      {foto && foto.frase && !espera && foto.estado !== "en_orden" && (
        <div className={mal ? "aviso malo" : "aviso"}>
          <strong>{foto.estado === "ajustado" ? "Hubo que achicar" : "Ojo"}</strong>
          <p>{foto.frase}</p>
          {foto.faltante > 0 && <p>Faltan {pesos(foto.faltante)} para cubrir lo fijo.</p>}
        </div>
      )}

      {foto &&
        foto.ajustes.map((ajuste) => (
          <p key={ajuste.bolsa} className="detalle">
            {ajuste.nombre}: se recortaron {pesos(ajuste.monto)}.
          </p>
        ))}

      {foto && foto.bolsas.length > 0 && (
        <section className="grupo">
          <div className="ft-section-head">
            <h2>Tus bolsas</h2>
            <Link to="/ajustes">
              Ver reparto <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="bolsas">
          {foto.bolsas.map((bolsa) => {
            const base = Math.max(bolsa.asignado, bolsa.gastado, 1);
            const ancho = Math.min(100, Math.round((Math.max(bolsa.gastado, 0) / base) * 100));
            return (
              <article key={bolsa.id} className={`bolsa ft-color-${bolsa.id}`}>
                <span className="ft-bolsa-icono">
                  <IconoBolsa id={bolsa.id} />
                </span>
                <header>
                  <strong>{bolsa.nombre}</strong>
                </header>
                <p className="ft-bolsa-saldo">{pesos(bolsa.disponible)}</p>
                <p className="ft-bolsa-disponible">Disponible</p>
                <div className="pista">
                  <span className={bolsa.disponible < 0 ? "llena" : ""} style={{ width: `${ancho}%` }} />
                </div>
                <p className="detalle">
                  {bolsa.detalle}. {bolsa.porcentaje}% del pago.
                </p>
              </article>
            );
          })}
          </div>
        </section>
      )}

      <div className="paneles">
      {foto && (foto.reservas.cuotas > 0 || foto.reservas.cuentas > 0) && (
        <section className="ft-panel">
          <h2>Apartado</h2>
          {foto.reservas.cuotas > 0 && (
            <div className="row" style={{ marginTop: 10 }}>
              <span>Cuotas de este periodo</span>
              <strong className="tabular">{pesos(foto.reservas.cuotas)}</strong>
            </div>
          )}
          {foto.reservas.cuentas > 0 && (
            <div className="row" style={{ marginTop: 8 }}>
              <span>Cuentas fijas</span>
              <strong className="tabular">{pesos(foto.reservas.cuentas)}</strong>
            </div>
          )}
          <p className="detalle">Esa plata ya tiene dueño. Puedes gastarla, pero te lo decimos antes.</p>
        </section>
      )}

      {foto && (
        <section className="ft-panel">
          <div className="row">
            <div>
              <h2>
                <PiggyBank size={22} aria-hidden="true" />
                Colchón
              </h2>
              <p className="detalle" style={{ marginTop: 4 }}>
                Este periodo aparta {pesos(foto.colchon.aporte_del_ciclo)}.
              </p>
            </div>
            <strong className="tabular">{pesos(foto.colchon.saldo)}</strong>
          </div>
        </section>
      )}

      {informe && (
        <section className="ft-panel">
          <h2>Informe</h2>
          <div className="row" style={{ marginTop: 10 }}>
            <span>Entró</span>
            <strong className="tabular">{pesos(informe.actual.ingresado)}</strong>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <span>Salió</span>
            <strong className="tabular">{pesos(informe.actual.gastado)}</strong>
          </div>
          {informe.anterior && (
            <div className="row" style={{ marginTop: 8 }}>
              <span>El periodo pasado salió</span>
              <strong className="tabular">{pesos(informe.anterior.gastado)}</strong>
            </div>
          )}
          <p className="detalle">{informe.frase}</p>
          {informe.consejos.map((texto) => (
            <p key={texto} className="detalle">
              {texto}
            </p>
          ))}
        </section>
      )}
      </div>

      <Boton clase="ft-bottom-action" onClick={() => navegar("/gastar")}>
        <Plus size={20} aria-hidden="true" />
        Anotar un gasto
      </Boton>
    </Screen>
  );
}
