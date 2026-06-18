// ============================================================
// Catálogo de objetivos de tratamento
// Cada objetivo molda o dashboard, as métricas e os insights da IA
// ============================================================

export type GoalKind =
  | "diabetes"
  | "colesterol"
  | "pressao"
  | "coracao"
  | "emagrecer"
  | "dieta"
  | "ganho_massa"
  | "mente"
  | "geral";

export interface GoalConfig {
  kind: GoalKind;
  label: string;
  tagline: string;
  emoji: string;
  color: string;
  colorSoft: string;
  // métricas que o dashboard prioriza para este objetivo
  primaryMetrics: ("glucose" | "weight" | "calories" | "carbs" | "activity" | "adherence" | "cholesterol" | "pressure" | "mood")[];
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
    primaryMetrics: ["pressure", "weight", "activity", "adherence"],
    guidelines: ["OMS", "SBC"],
    specialistFocus:
      "redução de sódio, atividade física regular, controle de peso e adesão à medicação anti-hipertensiva",
  },
  colesterol: {
    kind: "colesterol",
    label: "Controlar colesterol",
    tagline: "LDL na meta, coração protegido",
    emoji: "🫀",
    color: "#E8800A",
    colorSoft: "#FFF1E0",
    primaryMetrics: ["cholesterol", "weight", "activity", "adherence"],
    guidelines: ["SBC", "OMS"],
    specialistFocus:
      "redução de gorduras saturadas e trans, aumento de fibras, atividade física, controle de LDL/HDL/triglicerídeos e adesão à medicação (estatinas)",
  },
  coracao: {
    kind: "coracao",
    label: "Saúde do coração",
    tagline: "Cuidar do coração por inteiro",
    emoji: "💗",
    color: "#FF2D78",
    colorSoft: "#FFE6F0",
    primaryMetrics: ["pressure", "cholesterol", "activity", "weight"],
    guidelines: ["SBC", "OMS"],
    specialistFocus:
      "saúde cardiovascular integral: pressão, colesterol, peso, atividade aeróbica, controle de estresse e adesão às medicações cardiológicas",
  },
  mente: {
    kind: "mente",
    label: "Bem-estar mental",
    tagline: "Humor, sono e equilíbrio",
    emoji: "🧠",
    color: "#5856D6",
    colorSoft: "#ECECFB",
    primaryMetrics: ["mood", "activity", "weight"],
    guidelines: ["OMS"],
    specialistFocus:
      "regularidade de sono, atividade física, registro de humor, manejo de estresse e construção de rotina — sempre reforçando apoio profissional quando necessário",
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
