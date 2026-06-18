// ============================================================
// Acompanhamento de saúde — compara registros com as metas
// definidas pelo usuário/médico e gera indicadores + sinais
// construtivos (nunca alarmistas, nunca conduta clínica).
// ============================================================

export type Severity = "good" | "attention" | "alert";

export interface Indicator {
  key: string;
  label: string;
  // posição da agulha do velocímetro: 0..100 (100 = ideal)
  score: number;
  severity: Severity;
  // texto curto do estado atual
  status: string;
  // valor exibido (ex.: "162 mg/dL")
  display?: string;
  unit?: string;
}

export interface CareSignal {
  key: string;
  severity: Severity;
  title: string;
  message: string; // construtivo, orientado a ação suave
  recovering?: boolean; // true quando a tendência já está melhorando
}

// Clampa um número entre 0 e 100
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// ---- Score para um valor que deve ficar DENTRO de uma faixa ----
// Quanto mais perto do centro da faixa, maior o score.
function rangeScore(v: number, low: number, high: number): number {
  if (v >= low && v <= high) {
    const center = (low + high) / 2;
    const half = (high - low) / 2 || 1;
    return clamp(100 - (Math.abs(v - center) / half) * 25); // 75..100 dentro da faixa
  }
  // fora da faixa: cai conforme a distância da borda
  const dist = v < low ? low - v : v - high;
  const ref = (high - low) || high || 1;
  return clamp(70 - (dist / ref) * 90);
}

// ---- Score para um valor que deve ficar ABAIXO de um teto ----
function ceilingScore(v: number, target: number, hardMax: number): number {
  if (v <= target) return clamp(85 + ((target - v) / target) * 15);
  if (v >= hardMax) return 5;
  return clamp(85 - ((v - target) / (hardMax - target)) * 80);
}

function sevFromScore(score: number): Severity {
  if (score >= 70) return "good";
  if (score >= 40) return "attention";
  return "alert";
}

// ============================================================
// GLICEMIA — % de medições no alvo (TIR) nos últimos 7 dias
// ============================================================
export function glucoseIndicator(values: number[], low: number, high: number): Indicator | null {
  if (!values.length) return null;
  const inRange = values.filter((v) => v >= low && v <= high).length;
  const tir = Math.round((inRange / values.length) * 100);
  const score = clamp(tir); // a meta de TIR já é uma porcentagem
  const sev = tir >= 70 ? "good" : tir >= 50 ? "attention" : "alert";
  return {
    key: "glucose",
    label: "Glicemia no alvo",
    score,
    severity: sev,
    status: sev === "good" ? "No alvo na maior parte do tempo" : sev === "attention" ? "Pode melhorar o tempo no alvo" : "Muito tempo fora do alvo",
    display: `${tir}%`,
    unit: "no alvo",
  };
}

// ============================================================
// PRESSÃO — média sistólica vs meta
// ============================================================
export function pressureIndicator(systolics: number[], target: number): Indicator | null {
  if (!systolics.length) return null;
  const avg = Math.round(mean(systolics));
  const score = ceilingScore(avg, target, target + 50);
  const sev = sevFromScore(score);
  return {
    key: "pressure",
    label: "Pressão arterial",
    score,
    severity: sev,
    status: avg <= target ? "Dentro da meta combinada" : "Acima da meta combinada",
    display: `${avg}`,
    unit: "mmHg (sist. média)",
  };
}

// ============================================================
// COLESTEROL — LDL mais recente vs meta
// ============================================================
export function cholesterolIndicator(ldlValues: number[], target: number): Indicator | null {
  if (!ldlValues.length) return null;
  const latest = ldlValues[0];
  const score = ceilingScore(latest, target, target + 80);
  const sev = sevFromScore(score);
  return {
    key: "cholesterol",
    label: "Colesterol LDL",
    score,
    severity: sev,
    status: latest <= target ? "LDL dentro da meta" : "LDL acima da meta",
    display: `${latest}`,
    unit: "mg/dL (LDL)",
  };
}

// ============================================================
// ADESÃO À MEDICAÇÃO — doses tomadas vs esperadas (7 dias)
// ============================================================
export function adherenceIndicator(taken: number, expected: number): Indicator | null {
  if (expected <= 0) return null;
  const pct = Math.min(100, Math.round((taken / expected) * 100));
  const sev = pct >= 80 ? "good" : pct >= 50 ? "attention" : "alert";
  return {
    key: "adherence",
    label: "Adesão à medicação",
    score: pct,
    severity: sev,
    status: sev === "good" ? "Tomando como combinado" : sev === "attention" ? "Algumas doses esquecidas" : "Muitas doses em falta",
    display: `${pct}%`,
    unit: "das doses",
  };
}

// ============================================================
// HUMOR — média (1..5) nos últimos 7 dias
// ============================================================
export function moodIndicator(values: number[]): Indicator | null {
  if (!values.length) return null;
  const avg = mean(values);
  const score = clamp(((avg - 1) / 4) * 100);
  const sev = sevFromScore(score);
  return {
    key: "mood",
    label: "Humor",
    score,
    severity: sev,
    status: sev === "good" ? "Bom, na média" : sev === "attention" ? "Oscilando" : "Tem estado para baixo",
    display: avg.toFixed(1),
    unit: "de 5",
  };
}

// ============================================================
// SINAIS DE CUIDADO — comparam tendência recente vs anterior
// Sempre construtivos. Marcam "recovering" quando melhora.
// ============================================================
export function buildCareSignals(opts: {
  glucoseRecent: number[];
  glucosePrev: number[];
  low: number;
  high: number;
  hyposThisWeek: number;
  adherencePct: number | null;
  pressureRecent: number[];
  pressurePrev: number[];
  bpTarget: number;
}): CareSignal[] {
  const signals: CareSignal[] = [];

  // Glicemia: compara TIR recente vs anterior
  if (opts.glucoseRecent.length >= 3) {
    const tir = (arr: number[]) =>
      arr.length ? arr.filter((v) => v >= opts.low && v <= opts.high).length / arr.length : 0;
    const now = tir(opts.glucoseRecent);
    const before = tir(opts.glucosePrev);
    if (now < 0.5 && opts.glucosePrev.length >= 3 && now >= before) {
      signals.push({
        key: "glucose_recovering",
        severity: "attention",
        recovering: true,
        title: "Glicemia melhorando",
        message: "Seu tempo no alvo ainda está abaixo do ideal, mas vem subindo em relação à semana passada. Continue assim — está no caminho.",
      });
    } else if (now < 0.5) {
      signals.push({
        key: "glucose_low_tir",
        severity: "alert",
        title: "Glicemia bastante fora do alvo",
        message: "Esta semana boa parte das medições ficou fora da faixa combinada. Vale anotar o que mudou na rotina e levar isso para a próxima consulta.",
      });
    }
  }

  // Hipoglicemias na semana
  if (opts.hyposThisWeek >= 2) {
    signals.push({
      key: "hypos",
      severity: "alert",
      title: `${opts.hyposThisWeek} episódios de glicemia baixa`,
      message: "Quedas repetidas merecem atenção. Anote os horários em que aconteceram — esse padrão é importante para o seu médico avaliar.",
    });
  }

  // Adesão
  if (opts.adherencePct !== null && opts.adherencePct < 60) {
    signals.push({
      key: "adherence",
      severity: "attention",
      title: "Algumas medicações ficaram para trás",
      message: "Registrar as doses ajuda a manter a constância. Que tal usar os lembretes de horário? Pequenos ajustes já fazem diferença.",
    });
  }

  // Pressão
  if (opts.pressureRecent.length >= 2) {
    const avgNow = mean(opts.pressureRecent);
    const avgBefore = mean(opts.pressurePrev);
    if (avgNow > opts.bpTarget + 15 && (opts.pressurePrev.length < 2 || avgNow >= avgBefore)) {
      signals.push({
        key: "pressure_high",
        severity: "alert",
        title: "Pressão acima da meta",
        message: "Suas últimas medições passaram da meta combinada. Reduzir sal e manter a medicação em dia costuma ajudar — confirme a conduta com seu médico.",
      });
    } else if (avgNow > opts.bpTarget && opts.pressurePrev.length >= 2 && avgNow < avgBefore) {
      signals.push({
        key: "pressure_recovering",
        severity: "attention",
        recovering: true,
        title: "Pressão começando a ceder",
        message: "Ainda um pouco acima da meta, mas melhor que antes. O que você está fazendo está surtindo efeito.",
      });
    }
  }

  return signals;
}

// Resumo geral de saúde (0..100) — média ponderada dos indicadores ativos
export function overallScore(indicators: Indicator[]): number {
  if (!indicators.length) return 0;
  return clamp(mean(indicators.map((i) => i.score)));
}
