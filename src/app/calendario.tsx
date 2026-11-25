import { useId, type KeyboardEvent, type MouseEvent } from "react";
import { DayPicker, type Modifiers } from "react-day-picker";
import { es } from "react-day-picker/locale/es";
import { Calendar } from "@phosphor-icons/react";
import "react-day-picker/style.css";

const MES_DEL_DIA = new Date(2026, 0, 1);

function isoLocal(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function leerIso(valor: string) {
  const [anio, mes, dia] = valor.split("-").map(Number);
  if (!anio || !mes || !dia) return undefined;
  return new Date(anio, mes - 1, dia);
}

function textoFecha(valor: string) {
  const fecha = leerIso(valor);
  if (!fecha) return "Abrir calendario";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(fecha);
}

type Props =
  | { modo: "dia"; etiqueta: string; value: number | null; onChange: (dia: number) => void }
  | { modo: "fecha"; etiqueta: string; value: string; onChange: (iso: string) => void };

export function Calendario(props: Props) {
  const id = useId().replace(/:/g, "");
  const panelId = `cal-${id}`;

  function cerrar() {
    document.getElementById(panelId)?.hidePopover();
  }

  function elegir(fecha: Date | undefined) {
    if (!fecha) return;
    if (props.modo === "dia") props.onChange(fecha.getDate());
    else props.onChange(isoLocal(fecha));
    cerrar();
  }

  const seleccionado =
    props.modo === "dia"
      ? props.value
        ? new Date(2026, 0, props.value)
        : undefined
      : leerIso(props.value);

  const texto = props.modo === "dia" ? (props.value ? `Día ${props.value}` : "Abrir calendario") : textoFecha(props.value);

  return (
    <div className="cal">
      <label className="rotulo" htmlFor={`${panelId}-abrir`}>
        {props.etiqueta}
      </label>
      <button
        id={`${panelId}-abrir`}
        type="button"
        className="cal-abrir"
        aria-label={`${props.etiqueta}: ${texto}`}
        {...({ popovertarget: panelId } as Record<string, string>)}
      >
        <Calendar className="cal-ico" size={20} weight="regular" aria-hidden="true" />
        {texto}
      </button>
      <div id={panelId} className="cal-panel" {...({ popover: "auto" } as Record<string, string>)}>
        <DayPicker
          mode="single"
          locale={es}
          selected={seleccionado}
          onSelect={(fecha: Date | undefined, _dia: Date, _mod: Modifiers, _evento: MouseEvent | KeyboardEvent) => {
            elegir(fecha);
          }}
          {...(props.modo === "dia"
            ? {
                month: MES_DEL_DIA,
                hideNavigation: true,
                formatters: { formatCaption: () => "Elige el día del mes" },
              }
            : {})}
        />
      </div>
    </div>
  );
}
