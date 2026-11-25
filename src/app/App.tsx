import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "@/app/router-compat";
import { useAuth } from "./auth";
import { AnimatePresence, motion } from "framer-motion";
import logo from "@/assets/finanstrack_logo.png.asset.json";
import { Ajustes } from "./pages/Ajustes";
import { Empezar } from "./pages/Empezar";
import { Entrar } from "./pages/Entrar";
import { Gastar } from "./pages/Gastar";
import { Inicio } from "./pages/Inicio";
import { Movimientos } from "./pages/Movimientos";
import { Plan } from "./pages/Plan";
import { Registro } from "./pages/Registro";
import { Nav } from "./ui";

function Puerta({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const { pathname } = useLocation();
  const publica = pathname === "/entrar" || pathname === "/registro";

  if (cargando) {
    return (
      <div className="ft-splash">
        <img src={logo.url} alt="Finanstrack" width={72} height={72} />
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
      <div className={conMenu ? "app-frame con-menu" : "app-frame"}>
        {conMenu && <Nav />}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            className="ft-page"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
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
