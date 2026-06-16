// ============================================================
// Detecção de padrões glicêmicos — insights acionáveis
// Analisa registros e destaca tendências por período do dia.
// NÃO calcula doses nem dá conduta clínica — apenas observa padrões.
// ============================================================

export interface GlucoseReading {
  value: number;
  measured_at: string;
}

type Period = "madrugada" | "manhã" | "tarde" | "noite";

function periodOf(d: Date): Period {
  const h = d.getHours();
  if (h < 6) return "madrugada";
  if (h < 12) return "manhã";
  if (h < 18) return "tarde";
  return "noite";
}

export interface Pattern {
  level: "alerta" | "atencao" | "positivo";
  text: string;
}

// Recebe leituras recentes (idealmente últimos 7-14 dias) e retorna padrões observados
export function detectPatterns(
  readings: GlucoseReading[],
  low: number,
  high: number
): Pattern[] {
  if (readings.length < 5) return [];

  const byPeriod: Record<Period, number[]> = {
    madrugada: [], manhã: [], tarde: [], noite: [],
  };
  for (const r of readings) {
    byPeriod[periodOf(new Date(r.measured_at))].push(r.value);
  }

  const patterns: Pattern[] = [];
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

  // Padrões por período (precisa de pelo menos 3 medições no período)
  for (const p of ["madrugada", "manhã", "tarde", "noite"] as Period[]) {
    const vals = byPeriod[p];
    if (vals.length < 3) continue;
    const m = avg(vals);
    const highRate = vals.filter((v) => v > high).length / vals.length;
    const lowRate = vals.filter((v) => v < low).length / vals.length;

    if (lowRate >= 0.3) {
      patterns.push({
        level: "alerta",
        text: `Tendência de hipoglicemia no período da ${p} (${Math.round(lowRate * 100)}% das medições abaixo do alvo). Vale conversar com seu médico.`,
      });
    } else if (highRate >= 0.5) {
      patterns.push({
        level: "atencao",
        text: `Glicemias da ${p} frequentemente acima do alvo (média ${Math.round(m)} mg/dL). Observe refeições e horários nesse período.`,
      });
    }
  }

  // Variabilidade geral
  const all = readings.map((r) => r.value);
  const mAll = avg(all);
  const variance = avg(all.map((v) => (v - mAll) ** 2));
  const cv = (Math.sqrt(variance) / mAll) * 100;
  if (cv > 36) {
    patterns.push({
      level: "atencao",
      text: `Sua glicemia está oscilando bastante (variabilidade ${Math.round(cv)}%). Estabilidade costuma vir de horários e porções mais regulares.`,
    });
  }

  // Reforço positivo
  const tir = all.filter((v) => v >= low && v <= high).length / all.length;
  if (tir >= 0.7) {
    patterns.push({
      level: "positivo",
      text: `Ótimo controle: ${Math.round(tir * 100)}% das suas medições estão no alvo. Continue assim! 🎯`,
    });
  }

  // Limita para não poluir o dashboard
  return patterns.slice(0, 3);
}
