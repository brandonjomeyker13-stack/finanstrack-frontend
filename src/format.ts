const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function pesos(valor: number): string {
  const redondo = Math.round(valor);
  const texto = Math.abs(redondo).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return redondo < 0 ? `-$${texto}` : `$${texto}`;
}

export function miles(valor: number): string {
  return Math.abs(Math.round(valor)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES[(mes || 1) - 1]} ${anio}`;
}

export function soloDia(iso: string): string {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES[(mes || 1) - 1]}`;
}

export function digitos(texto: string): number {
  const limpio = texto.replace(/\D/g, "").slice(0, 12);
  return limpio ? Number(limpio) : 0;
}
