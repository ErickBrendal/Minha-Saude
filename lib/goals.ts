// ============================================================
// Catálogo de objetivos de tratamento
// Cada objetivo molda o dashboard, as métricas e os insights da IA
// ============================================================

export type GoalKind =
  | "diabetes"
  | "emagrecer"
  | "dieta"
  | "ganho_massa"
  | "pressao"
  | "geral";

export interface GoalConfig {
  kind: GoalKind;
  label: string;
  tagline: string;
  emoji: string;
  color: string;
  colorSoft: string;
  // métricas que o dashboard prioriza para este objetivo
  primaryMetrics: ("glucose" | "weight" | "calories" | "carbs" | "activity" | "adherence")[];
  // diretrizes que a IA cita
  guidelines: string[];
  // foco do especialista virtual
  specialistFocus: string;
}

export const GOALS: Record<GoalKind, GoalConfig> = {
  diabetes: {
    kind: "diabetes",
    label: "Controlar diabetes",
    tagline: "Glicemia no alvo, sem sustos",
    emoji: "🩸",
    color: "#0E7C7B",
    colorSoft: "#E6F2F2",
    primaryMetrics: ["glucose", "adherence", "carbs", "activity"],
    guidelines: ["ADA", "SBD"],
    specialistFocus:
      "controle glicêmico, tempo no alvo (TIR), contagem de carboidratos, adesão à insulina e prevenção de hipoglicemia",
  },
  emagrecer: {
    kind: "emagrecer",
    label: "Emagrecer",
    tagline: "Déficit sustentável, peso em queda",
    emoji: "⚖️",
    color: "#FF6B35",
    colorSoft: "#FFEDE5",
    primaryMetrics: ["weight", "calories", "activity"],
    guidelines: ["OMS", "SBD"],
    specialistFocus:
      "déficit calórico saudável, evolução de peso, saciedade, atividade física e mudança de hábitos sustentável",
  },
  dieta: {
    kind: "dieta",
    label: "Seguir dieta",
    tagline: "Refeições equilibradas todo dia",
    emoji: "🥗",
    color: "#34C759",
    colorSoft: "#E6F7EC",
    primaryMetrics: ["calories", "carbs", "weight"],
    guidelines: ["OMS"],
    specialistFocus:
      "equilíbrio de macronutrientes, qualidade alimentar, variedade no prato e aderência ao plano alimentar",
  },
  ganho_massa: {
    kind: "ganho_massa",
    label: "Ganhar massa",
    tagline: "Superávit e treino consistente",
    emoji: "💪",
    color: "#5856D6",
    colorSoft: "#ECECFB",
    primaryMetrics: ["weight", "calories", "activity"],
    guidelines: ["OMS"],
    specialistFocus:
      "superávit calórico, ingestão proteica adequada, consistência de treino e ganho de peso progressivo",
  },
  pressao: {
    kind: "pressao",
    label: "Controlar pressão",
    tagline: "Pressão estável e hábitos firmes",
    emoji: "❤️",
    color: "#FF3B30",
    colorSoft: "#FFEAE8",
    primaryMetrics: ["weight", "activity", "adherence"],
    guidelines: ["OMS", "SBC"],
    specialistFocus:
      "redução de sódio, atividade física regular, controle de peso e adesão à medicação anti-hipertensiva",
  },
  geral: {
    kind: "geral",
    label: "Saúde geral",
    tagline: "Mais energia e bem-estar",
    emoji: "✨",
    color: "#0E7C7B",
    colorSoft: "#E6F2F2",
    primaryMetrics: ["activity", "weight", "calories"],
    guidelines: ["OMS"],
    specialistFocus:
      "hábitos saudáveis, sono, atividade física, hidratação e equilíbrio alimentar",
  },
};

export const GOAL_LIST = Object.values(GOALS);

export function goalConfig(kind: string | null | undefined): GoalConfig {
  return GOALS[(kind as GoalKind) ?? "geral"] ?? GOALS.geral;
}
