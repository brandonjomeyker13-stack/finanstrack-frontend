import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import { EntradaGoogle } from "../google";
import { Boton, Campo, Screen } from "../ui";

export function Registro() {
  const { registrar } = useAuth();
  const navegar = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOcupado(true);
    try {
      await registrar(nombre.trim(), email.trim(), password);
      navegar("/empezar");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pude crear la cuenta.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Screen>
      <div className="marca">F</div>
      <h1>Arma tu plata</h1>
      <p className="lead">Para quien cobra un monto fijo, en una fecha exacta. Sin voz y sin consejos de robot.</p>
      <EntradaGoogle />
      <form onSubmit={enviar}>
        <Campo etiqueta="Cómo te llamas" value={nombre} onChange={setNombre} />
        <Campo etiqueta="Correo" type="email" value={email} onChange={setEmail} />
        <Campo etiqueta="Contraseña, mínimo 8" type="password" value={password} onChange={setPassword} />
        {error && <p className="error">{error}</p>}
        <Boton type="submit" disabled={ocupado || nombre.trim().length < 1 || password.length < 8}>
          {ocupado ? "Creando…" : "Crear cuenta"}
        </Boton>
      </form>
      <p className="lead">
        ¿Ya tienes cuenta? <Link to="/entrar">Entra</Link>
      </p>
    </Screen>
  );
}
