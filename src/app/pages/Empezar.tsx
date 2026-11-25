import { useState } from "react";
import { useNavigate } from "@/app/router-compat";
import { ApiError, api } from "@/app/api";
import { useAuth } from "@/app/auth";
import { Calendario } from "@/app/calendario";
import { Boton, Campo, CampoDinero, Screen } from "@/app/ui";

type Frecuencia = "mensual" | "quincenal" | "catorcenal";
type Situacion = "lo_espero" | "ya_llego" | "me_queda";

export function Empezar() {
  const { recargar } = useAuth();
  const navegar = useNavigate();
  const [paso, setPaso] = useState(0);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("mensual");
  const [dia, setDia] = useState<number | null>(null);
  const [segundo, setSegundo] = useState<number | null>(null);
  const [ancla, setAncla] = useState("");
  const [monto, setMonto] = useState(0);
  const [nombrePago, setNombrePago] = useState("Sueldo");
  const [situacion, setSituacion] = useState<Situacion>("lo_espero");
  const [meQueda, setMeQueda] = useState(0);
  const [colchon, setColchon] = useState(0);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function validarPaso(): string {
    if (paso === 0) {
      if (monto <= 0) return "Dime cuánto te pagan.";
      if (!nombrePago.trim()) return "Ponle un nombre a ese pago.";
      if (frecuencia === "catorcenal") {
        if (!ancla) return "¿Cuándo fue el último pago?";
        return "";
      }
      if (!dia) return "Elige el día en que te pagan.";
      if (frecuencia === "quincenal") {
        if (!segundo) return "Elige el día del segundo pago.";
        const separacion = segundo - dia;
        if (separacion < 10 || separacion > 20) {
          return "Los dos días tienen que estar separados entre 10 y 20, como el 15 y el 30.";
        }
      }
    }
    return "";
  }

  async function terminar() {
    setError("");
    setOcupado(true);
    const diaCorte = frecuencia === "catorcenal" ? Number(ancla.slice(8, 10)) : dia;
    try {
      await api("/api/v1/onboarding", {
        method: "POST",
        body: JSON.stringify({
          frecuencia,
          dia_de_corte: diaCorte,
          segundo_dia_de_corte: frecuencia === "quincenal" ? segundo : null,
          ancla_de_pago: frecuencia === "catorcenal" ? ancla : null,
          monto_pago: monto,
          nombre_pago: nombrePago.trim(),
          situacion,
          me_queda: situacion === "me_queda" ? meQueda : null,
          colchon_inicial: colchon,
        }),
      });
      await recargar();
      navegar("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude guardar eso.");
    } finally {
      setOcupado(false);
    }
  }

  function seguir() {
    const mensaje = validarPaso();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError("");
    if (paso < 2) setPaso(paso + 1);
    else void terminar();
  }

  return (
    <Screen clase="tarjeta">
      <ol className="pasos">
        {["Pago", "Hoy", "Colchón"].map((nombre, n) => (
          <li key={nombre} className={n === paso ? "on" : n < paso ? "hecho" : ""}>
            <button type="button" disabled={n > paso} onClick={() => n < paso && setPaso(n)}>
              <span>{n + 1}</span>
              {nombre}
            </button>
          </li>
        ))}
      </ol>
      <div key={paso} className="paso-cuerpo">
      {paso === 0 && (
        <>
          <h1>Tu pago, fijo y en fecha</h1>
          <p className="lead">Lo mismo, cada cierto tiempo exacto. Con eso armamos el periodo.</p>
          <p className="rotulo" style={{ marginTop: 18 }}>
            ¿Cada cuánto?
          </p>
          <div className="chips">
            {(
              [
                ["mensual", "Cada mes"],
                ["quincenal", "Cada quincena"],
                ["catorcenal", "Cada 14 días"],
              ] as const
            ).map(([id, texto]) => (
              <button
                key={id}
                type="button"
                className={frecuencia === id ? "chip on" : "chip"}
                onClick={() => setFrecuencia(id)}
              >
                {texto}
              </button>
            ))}
          </div>
          <Campo etiqueta="Cómo le dices a ese pago" value={nombrePago} onChange={setNombrePago} />
          <CampoDinero etiqueta="Cuánto es, exacto" value={monto} onChange={setMonto} />
          {frecuencia === "catorcenal" ? (
            <Calendario modo="fecha" etiqueta="Día de tu último pago" value={ancla} onChange={setAncla} />
          ) : (
            <Calendario
              modo="dia"
              etiqueta={frecuencia === "quincenal" ? "Primer día" : "Día en que te pagan"}
              value={dia}
              onChange={setDia}
            />
          )}
          {frecuencia === "quincenal" && (
            <Calendario modo="dia" etiqueta="Segundo día" value={segundo} onChange={setSegundo} />
          )}
        </>
      )}
      {paso === 1 && (
        <>
          <h1>¿Ya está en tu cuenta?</h1>
          <p className="lead">Si ya gastaste una parte, no inventamos el sueldo entero.</p>
          {(
            [
              ["lo_espero", "Todavía no llega", "Lo anoto como esperado. No entra al disponible."],
              ["ya_llego", "Ya llegó y no he gastado", "Repartimos el monto completo."],
              ["me_queda", "Ya llegó, pero ya gasté", "Me dices cuánto te queda hoy."],
            ] as const
          ).map(([id, titulo, texto]) => (
            <button
              key={id}
              type="button"
              className={situacion === id ? "opcion on" : "opcion"}
              onClick={() => setSituacion(id)}
            >
              <strong>{titulo}</strong>
              <span>{texto}</span>
            </button>
          ))}
          {situacion === "me_queda" && (
            <CampoDinero etiqueta="¿Cuánto te queda hoy?" value={meQueda} onChange={setMeQueda} />
          )}
        </>
      )}
      {paso === 2 && (
        <>
          <h1>¿Tienes un colchón?</h1>
          <p className="lead">Plata guardada para un golpe. Si no tienes, déjalo en cero y sigue.</p>
          <CampoDinero etiqueta="Lo que ya tienes guardado" value={colchon} onChange={setColchon} />
        </>
      )}
      {error && <p className="error">{error}</p>}
      <Boton onClick={seguir} disabled={ocupado}>
        {ocupado ? "Guardando…" : paso === 2 ? "Empezar" : "Seguir"}
      </Boton>
      {paso > 0 && (
        <Boton variante="suave" onClick={() => setPaso(paso - 1)} disabled={ocupado}>
          Atrás
        </Boton>
      )}
      </div>
    </Screen>
  );
}
