import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "./api";
import { useAuth } from "./auth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

type Credencial = { credential?: string };

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (respuesta: Credencial) => void;
    ux_mode?: "popup";
    auto_select?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

function clienteGoogle(): GoogleId | undefined {
  const ventana = window as Window & { google?: { accounts?: { id?: GoogleId } } };
  return ventana.google?.accounts?.id;
}

let carga: Promise<void> | null = null;

function cargarGoogle(): Promise<void> {
  if (clienteGoogle()) return Promise.resolve();
  if (carga) return carga;
  carga = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client?hl=es";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      carga = null;
      reject(new Error("script"));
    };
    document.head.appendChild(script);
  });
  return carga;
}

export function EntradaGoogle() {
  const { conGoogle } = useAuth();
  const navegar = useNavigate();
  const caja = useRef<HTMLDivElement>(null);
  const entrar = useRef(conGoogle);
  entrar.current = conGoogle;
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let vivo = true;
    cargarGoogle()
      .then(() => {
        const google = clienteGoogle();
        const nodo = caja.current;
        if (!vivo || !google || !nodo) return;
        nodo.replaceChildren();
        google.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          auto_select: false,
          callback: (respuesta) => {
            if (!respuesta.credential) {
              setError("Google no entregó la sesión.");
              return;
            }
            setOcupado(true);
            setError("");
            void entrar
              .current(respuesta.credential)
              .then(() => navegar("/"))
              .catch((err: unknown) => {
                setError(err instanceof ApiError ? err.message : "No pude entrar con Google.");
              })
              .finally(() => setOcupado(false));
          },
        });
        google.renderButton(nodo, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: Math.max(240, Math.min(nodo.offsetWidth, 400)),
          locale: "es",
          logo_alignment: "left",
        });
      })
      .catch(() => {
        if (vivo) setError("No pude cargar el inicio con Google.");
      });
    return () => {
      vivo = false;
    };
  }, [navegar]);

  return (
    <div className="google">
      {CLIENT_ID ? (
        <div className="google-caja" ref={caja} />
      ) : (
        <button
          className="btn suave google-btn"
          type="button"
          onClick={() =>
            setError("Falta el Client ID de Google. Va en VITE_GOOGLE_CLIENT_ID y en GOOGLE_CLIENT_ID.")
          }
        >
          Continuar con Google
        </button>
      )}
      {ocupado && <p className="muted small">Abriendo tu cuenta…</p>}
      {error && <p className="error">{error}</p>}
      <p className="separador">o con tu correo</p>
    </div>
  );
}
