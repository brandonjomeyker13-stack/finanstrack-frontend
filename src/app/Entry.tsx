import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import logo from "@/assets/finanstrack_logo.png.asset.json";

const Shell = lazy(() => import("./Shell"));

function Splash() {
  return (
    <div className="ft-splash">
      <img src={logo.url} alt="Finanstrack" width={72} height={72} />
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
