import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import logo from "@/assets/finanstrack-logo.png";

const Shell = lazy(() => import("./Shell"));

function Splash() {
  return (
    <div className="ft-splash">
      <img src={logo} alt="Finanstrack" width={72} height={72} />
    </div>
  );
}

export function Entry() {
  return (
    <ClientOnly fallback={<Splash />}>
      <Suspense fallback={<Splash />}>
        <Shell />
      </Suspense>
    </ClientOnly>
  );
}
