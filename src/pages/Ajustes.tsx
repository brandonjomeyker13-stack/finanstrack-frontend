import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api, type Perfil } from "../api";
import { useAuth } from "../auth";
import { Calendario } from "../calendario";
import { Boton, Campo, CampoDinero, Cargando, Screen } from "../ui";

export function Ajustes() {
  const { salir } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saldo, setSaldo] = useState(0);
  const [ancla, setAncla] = useState("");
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    api<Perfil>("/api/v1/perfil")
      .then((datos) => {
        setPerfil(datos);
        setAncla(datos.ancla_de_pago || "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No pude abrir los ajustes."));
  }, []);

  if (!perfil && !error) {
    return (
      <Screen conNav>
        <Cargando />
      </Screen>
    );
  }
  if (!perfil) {
    return (
      <Screen conNav>
        <p className="error">{error}</p>
      </Screen>
    );
  }

  const actual = perfil;
  const suma =
    actual.pct_obligatorio +
    actual.pct_deuda_extra +
    actual.pct_variable +
    actual.pct_gustos +
    actual.pct_colchon;

  function poner(parcial: Partial<Perfil>) {
    setPerfil({ ...actual, ...parcial });
    setOk("");
  }

  async function guardar() {
    setError("");
    setOk("");
    try {
      const guardado = await api<Perfil>("/api/v1/perfil", {
        method: "PUT",
        body: JSON.stringify({
          ...actual,
          ancla_de_pago: actual.frecuencia === "catorcenal" ? ancla : null,
          segundo_dia_de_corte: actual.frecuencia === "quincenal" ? actual.segundo_dia_de_corte : null,
          dia_de_corte:
            actual.frecuencia === "catorcenal" && ancla ? Number(ancla.slice(8, 10)) : actual.dia_de_corte,
        }),
      });
      setPerfil(guardado);
      setOk("Listo. El periodo usa estos números.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude guardar.");
    }
  }

  async function declarar() {
    setError("");
    try {
      await api("/api/v1/presupuesto/saldo", {
        method: "POST",
        body: JSON.stringify({ monto: saldo }),
      });
      setOk("Este periodo ahora arranca con lo que dijiste que tienes.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude actualizar el saldo.");
    }
  }

  async function cerrar() {
    await salir();
    navegar("/entrar");
  }

  async function borrarCuenta() {
    setError("");
    setBorrando(true);
    try {
      await api("/api/v1/auth/cuenta", {
        method: "DELETE",
        body: JSON.stringify({ confirmacion: "BORRAR" }),
      });
      await salir();
      navegar("/entrar");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude borrar la cuenta.");
      setBorrando(false);
    }
  }

  return (
    <Screen conNav>
      <button className="linkish" type="button" onClick={() => navegar("/")}>
        Volver
      </button>
      <h1>Ajustes</h1>
      <p className="lead">El pago, el día y cómo se reparte. Las bolsas tienen que sumar 100.</p>

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
            className={perfil.frecuencia === id ? "chip on" : "chip"}
            onClick={() => poner({ frecuencia: id })}
          >
            {texto}
          </button>
        ))}
      </div>
      <Campo etiqueta="Nombre del pago" value={perfil.nombre_pago} onChange={(v) => poner({ nombre_pago: v })} />
      <CampoDinero etiqueta="Monto fijo" value={perfil.monto_pago} onChange={(v) => poner({ monto_pago: v })} />
      {perfil.frecuencia === "catorcenal" ? (
        <Calendario modo="fecha" etiqueta="Un día en que sí te pagaron" value={ancla} onChange={setAncla} />
      ) : (
        <Calendario
          modo="dia"
          etiqueta="Día de pago"
          value={perfil.dia_de_corte}
          onChange={(dia) => poner({ dia_de_corte: dia })}
        />
      )}
      {perfil.frecuencia === "quincenal" && (
        <Calendario
          modo="dia"
          etiqueta="Segundo día"
          value={perfil.segundo_dia_de_corte}
          onChange={(dia) => poner({ segundo_dia_de_corte: dia })}
        />
      )}

      <section className="grupo">
        <h2>Reparto</h2>
        {(
          [
            ["pct_obligatorio", "Cuentas"],
            ["pct_deuda_extra", "Deudas"],
            ["pct_variable", "Día a día"],
            ["pct_gustos", "Gustos"],
            ["pct_colchon", "Colchón"],
          ] as const
        ).map(([clave, nombre]) => (
          <label key={clave} className="campo">
            <span>
              {nombre} · {perfil[clave]}%
            </span>
            <input
              className="slider"
              type="range"
              min={0}
              max={100}
              value={perfil[clave]}
              onChange={(e) => poner({ [clave]: Number(e.target.value) } as Partial<Perfil>)}
            />
          </label>
        ))}
        <p className={suma === 100 ? "suma" : "suma mal"}>Suman {suma}%</p>
      </section>

      {error && <p className="error">{error}</p>}
      {ok && <p className="aviso bien">{ok}</p>}
      <Boton onClick={() => void guardar()} disabled={suma !== 100}>
        Guardar
      </Boton>

      <section className="card">
        <h2>Lo que tienes hoy</h2>
        <p className="detalle">
          Si el número no cuadra, dímelo. Reemplaza lo que este periodo traía. No borra los gastos ya anotados.
        </p>
        <CampoDinero etiqueta="Saldo de hoy" value={saldo} onChange={setSaldo} />
        <Boton variante="suave" onClick={() => void declarar()}>
          Usar este saldo
        </Boton>
      </section>

      <Boton variante="texto" onClick={() => void cerrar()}>
        Cerrar sesión
      </Boton>

      <section className="card">
        <h2>Tu cuenta</h2>
        <p className="detalle">
          Borrar la cuenta elimina el pago, los gastos, las deudas, el colchón y las metas. No se puede deshacer.
        </p>
        {confirmarBorrado ? (
          <Boton variante="texto" onClick={() => void borrarCuenta()} disabled={borrando}>
            {borrando ? "Borrando…" : "Sí, borrar todo"}
          </Boton>
        ) : (
          <Boton variante="suave" onClick={() => setConfirmarBorrado(true)}>
            Borrar mi cuenta
          </Boton>
        )}
      </section>
    </Screen>
  );
}
