// ============================================================
// Geração de evento de calendário (.ics) — universal
// Funciona em iPhone (iCloud/Apple Calendar) e Android (Google/Samsung)
// ============================================================

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Formata Date para o formato UTC do iCalendar: 20260626T210000Z
function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Escapa caracteres especiais conforme RFC 5545
function esc(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface CalEvent {
  title: string;
  start: Date;
  durationMinutes?: number;
  location?: string | null;
  description?: string | null;
  reminderMinutes?: number; // antecedência do alerta
}

export function buildICS(ev: CalEvent): string {
  const end = new Date(ev.start.getTime() + (ev.durationMinutes ?? 60) * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@minhasaude.app`;
  const reminder = ev.reminderMinutes ?? 60;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Minha Saude//PT-BR//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(ev.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminder}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

// Dispara o download/abertura do .ics — o SO abre o app de calendário nativo
export function downloadICS(ev: CalEvent, fileName = "consulta") {
  const ics = buildICS(ev);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
