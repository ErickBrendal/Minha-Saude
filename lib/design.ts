// Design tokens centrais — "Minha Saúde"
export const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  text2: "#6B7280",
  divider: "#EAEAEC",
  brand: "#0E7C7B",
  brandSoft: "#E6F2F2",
  inRange: "#34C759",
  warnHigh: "#FF9F0A",
  critHigh: "#FF6B35",
  hypo: "#FF3B30",
  insulin: "#5856D6",
  food: "#FF9F0A",
  activity: "#34C759",
  water: "#32ADE6",
  weight: "#64748B",
} as const;

export const NUM: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum"',
};

export function glucoseColor(v: number, low: number, high: number) {
  if (v < low) return C.hypo;
  if (v <= high) return C.inRange;
  if (v <= 250) return C.warnHigh;
  return C.critHigh;
}

export function glucoseLabel(v: number, low: number, high: number) {
  if (v < low) return "Hipoglicemia";
  if (v <= high) return "No alvo";
  return v <= 250 ? "Acima do alvo" : "Muito acima do alvo";
}

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function fmtAgo(d: Date) {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} d`;
}

export const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

export const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

// GMI (HbA1c estimada) a partir da média glicêmica
export const gmi = (avg: number) => (3.31 + 0.02392 * avg).toFixed(1);
