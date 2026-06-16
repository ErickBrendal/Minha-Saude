// ============================================================
// Lógica de gamificação — estratégia de engajamento
// ============================================================

export interface DailyTask {
  key: string;
  label: string;
  done: boolean;
  points: number;
}

// Calcula quais tarefas do dia foram cumpridas, para a "barra de missões"
export function computeDailyTasks(opts: {
  glucoseToday: number;
  medLogsToday: number;
  mealsToday: number;
  activityToday: number;
  weightToday: number;
}): DailyTask[] {
  return [
    { key: "glucose", label: "Registrar glicemia", done: opts.glucoseToday > 0, points: 10 },
    { key: "meal", label: "Anotar uma refeição", done: opts.mealsToday > 0, points: 10 },
    { key: "med", label: "Confirmar medicação", done: opts.medLogsToday > 0, points: 10 },
    { key: "activity", label: "Mexer o corpo", done: opts.activityToday > 0, points: 10 },
    { key: "weight", label: "Pesar-se", done: opts.weightToday > 0, points: 5 },
  ];
}

export function dailyProgress(tasks: DailyTask[]) {
  const done = tasks.filter((t) => t.done).length;
  return {
    done,
    total: tasks.length,
    pct: Math.round((done / tasks.length) * 100),
    pointsEarned: tasks.filter((t) => t.done).reduce((s, t) => s + t.points, 0),
    pointsTotal: tasks.reduce((s, t) => s + t.points, 0),
  };
}

// Mensagem motivacional conforme o progresso
export function streakMessage(streak: number, pct: number): string {
  if (pct === 100) return "Dia completo! Você fechou todas as missões 🎉";
  if (streak === 0 && pct === 0) return "Comece hoje — o primeiro registro vale ouro.";
  if (streak >= 7) return `${streak} dias seguidos! Você está voando 🔥`;
  if (streak >= 3) return `${streak} dias de sequência. Não quebre a corrente!`;
  if (pct >= 60) return "Quase lá — falta pouco para fechar o dia.";
  return "Cada registro te aproxima da sua meta.";
}

// Nível baseado em pontos totais (progressão visível)
export function levelFromPoints(points: number) {
  const levels = [
    { min: 0, name: "Iniciante", next: 100 },
    { min: 100, name: "Engajado", next: 300 },
    { min: 300, name: "Consistente", next: 600 },
    { min: 600, name: "Dedicado", next: 1000 },
    { min: 1000, name: "Mestre da Saúde", next: Infinity },
  ];
  const idx = levels.findIndex((l, i) => points >= l.min && points < (levels[i + 1]?.min ?? Infinity));
  const cur = levels[idx === -1 ? levels.length - 1 : idx];
  const prevMin = cur.min;
  const span = cur.next === Infinity ? 1 : cur.next - prevMin;
  const into = points - prevMin;
  return {
    name: cur.name,
    level: (idx === -1 ? levels.length - 1 : idx) + 1,
    progressPct: cur.next === Infinity ? 100 : Math.round((into / span) * 100),
    toNext: cur.next === Infinity ? 0 : cur.next - points,
  };
}

// Catálogo de conquistas
export const ACHIEVEMENTS: Record<string, { title: string; emoji: string; desc: string }> = {
  first_glucose: { title: "Primeira medição", emoji: "🩸", desc: "Registrou sua primeira glicemia" },
  first_meal: { title: "Primeiro prato", emoji: "🍽️", desc: "Anotou sua primeira refeição" },
  streak_3: { title: "Trinca", emoji: "🔥", desc: "3 dias seguidos de registros" },
  streak_7: { title: "Semana cheia", emoji: "⭐", desc: "7 dias seguidos" },
  streak_30: { title: "Mês de ferro", emoji: "🏆", desc: "30 dias seguidos" },
  perfect_day: { title: "Dia perfeito", emoji: "💯", desc: "Completou todas as missões do dia" },
  weight_goal: { title: "Meta de peso", emoji: "🎯", desc: "Alcançou seu peso-alvo" },
  tir_70: { title: "No alvo", emoji: "🎖️", desc: "Tempo no alvo acima de 70%" },
};
