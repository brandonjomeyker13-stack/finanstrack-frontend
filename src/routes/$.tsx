import { createFileRoute } from "@tanstack/react-router";
import { Entry } from "@/app/Entry";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Finanstrack" },
      { name: "description", content: "Tu plan de dinero personal: gastos, deudas, metas y colchón." },
      { property: "og:title", content: "Finanstrack" },
      { property: "og:description", content: "Tu plan de dinero personal: gastos, deudas, metas y colchón." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});
