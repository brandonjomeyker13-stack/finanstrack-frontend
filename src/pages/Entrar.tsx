import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import { EntradaGoogle } from "../google";
import { Boton, Campo, Screen } from "../ui";

export function Entrar() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOcupado(true);
    try {
      await entrar(email.trim(), password);
      navegar("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude entrar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Screen>
      <div className="marca">F</div>
      <h1>Hola de nuevo</h1>
      <p className="lead">Entra para ver cuánto te queda de este pago.</p>
      <EntradaGoogle />
      <form onSubmit={enviar}>
        <Campo etiqueta="Correo" type="email" value={email} onChange={setEmail} />
        <Campo etiqueta="Contraseña" type="password" value={password} onChange={setPassword} />
        {error && <p className="error">{error}</p>}
        <Boton type="submit" disabled={ocupado || !email || password.length < 8}>
          {ocupado ? "Entrando…" : "Entrar"}
        </Boton>
      </form>
      <p className="lead">
        ¿Primera vez? <Link to="/registro">Crea tu cuenta</Link>
      </p>
    </Screen>
  );
}
