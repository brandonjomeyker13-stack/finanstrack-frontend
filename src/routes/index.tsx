import { createFileRoute } from "@tanstack/react-router";
import { Entry } from "@/app/Entry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finanstrack — Tu dinero, claro y al día" },
      { name: "description", content: "Organiza tu pago, tus gastos, deudas y metas con un plan simple que se ajusta solo." },
      { property: "og:title", content: "Finanstrack — Tu dinero, claro y al día" },
      { property: "og:description", content: "Organiza tu pago, tus gastos, deudas y metas con un plan simple." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});
