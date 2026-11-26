import { useState, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "@/app/router-compat";
import { useAuth } from "./auth";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GearSix, SidebarSimple } from "@phosphor-icons/react";
import logo from "@/assets/finanstrack-logo.png";
import { Ajustes } from "./pages/Ajustes";
import { Empezar } from "./pages/Empezar";
import { Entrar } from "./pages/Entrar";
import { Gastar } from "./pages/Gastar";
import { Inicio } from "./pages/Inicio";
import { Movimientos } from "./pages/Movimientos";
import { Plan } from "./pages/Plan";
import { Registro } from "./pages/Registro";
import { Boton, Nav } from "./ui";

function Puerta({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const { pathname } = useLocation();
  const [compacto, setCompacto] = useState(false);
  const reducirMovimiento = useReducedMotion();
  const publica = pathname === "/entrar" || pathname === "/registro";

  if (cargando) {
    return (
      <div className="ft-splash">
        <img src={logo} alt="Finanstrack" width={72} height={72} />
      </div>
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
      <div className={conMenu ? `app-frame con-menu${compacto ? " compacto" : ""}` : "app-frame"}>
        {conMenu && <Nav />}
        <div className="ft-contenido">
          {conMenu && (
            <header className="ft-cabecera">
              <div className="ft-cabecera-marca">
                <Boton
                  variante="suave"
                  clase="ft-icon-button ft-menu-toggle"
                  titulo={compacto ? "Expandir menú" : "Contraer menú"}
                  onClick={() => setCompacto(!compacto)}
                >
                  <SidebarSimple size={22} />
                </Boton>
                <img src={logo} alt="" width={30} height={30} />
                <span>Finanstrack</span>
              </div>
              <Link to="/ajustes" className="ft-perfil">
                <span className="ft-avatar">{usuario?.nombre.slice(0, 1).toUpperCase()}</span>
                <span className="ft-perfil-nombre">{usuario?.nombre}</span>
                <GearSix size={20} aria-hidden="true" />
              </Link>
            </header>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              className="ft-page"
              initial={reducirMovimiento ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducirMovimiento ? 0 : 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
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
