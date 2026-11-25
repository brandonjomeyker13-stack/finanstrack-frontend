import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { Ajustes } from "./pages/Ajustes";
import { Empezar } from "./pages/Empezar";
import { Entrar } from "./pages/Entrar";
import { Gastar } from "./pages/Gastar";
import { Inicio } from "./pages/Inicio";
import { Movimientos } from "./pages/Movimientos";
import { Plan } from "./pages/Plan";
import { Registro } from "./pages/Registro";
import { Nav, Screen } from "./ui";

function Puerta({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const { pathname } = useLocation();
  const publica = pathname === "/entrar" || pathname === "/registro";

  if (cargando) {
    return (
      <Screen>
        <p className="muted">Un momento…</p>
      </Screen>
    );
  }
  if (!usuario && !publica) return <Navigate to="/entrar" replace />;
  if (usuario && publica) {
    return <Navigate to={usuario.onboarding_completo ? "/" : "/empezar"} replace />;
  }
  if (usuario && !usuario.onboarding_completo && pathname !== "/empezar") {
    return <Navigate to="/empezar" replace />;
  }
  if (usuario?.onboarding_completo && pathname === "/empezar") {
    return <Navigate to="/" replace />;
  }
  const conMenu = Boolean(usuario?.onboarding_completo);
  return (
    <div className="app">
      <div className={conMenu ? "app-frame con-menu" : "app-frame"}>
        {conMenu && <Nav />}
        {children}
      </div>
    </div>
  );
}

export function App() {
  return (
    <Puerta>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/gastar" element={<Gastar />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/empezar" element={<Empezar />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Puerta>
  );
}
