"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Target } from "lucide-react";
import { Card, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM } from "@/lib/design";
import { GOAL_LIST } from "@/lib/goals";
import { setPrimaryGoal, setTargets } from "../actions";

export default function ObjetivosClient({
  currentGoal,
  profile,
}: {
  currentGoal: string | null;
  profile: any;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentGoal);
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight_kg?.toString() ?? "");
  const [calTarget, setCalTarget] = useState(profile?.daily_calorie_target?.toString() ?? "");
  const [pending, start] = useTransition();

  const showWeight = selected === "emagrecer" || selected === "ganho_massa" || selected === "dieta";
  const showCalories = selected === "emagrecer" || selected === "dieta" || selected === "ganho_massa";

  function save() {
    if (!selected) return;
    start(async () => {
      await setPrimaryGoal(selected);
      await setTargets({
        target_weight_kg: targetWeight ? +targetWeight : null,
        daily_calorie_target: calTarget ? +calTarget : null,
      });
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div style={{ padding: "24px 18px" }}>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <Target size={20} color={C.brand} />
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>Seu objetivo</h1>
      </div>
      <p style={{ color: C.text2, fontSize: 14.5, margin: "0 0 22px", lineHeight: 1.5 }}>
        Escolha seu foco principal. O app se adapta — métricas, insights e sugestões giram em torno do que importa para você.
      </p>

      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 22 }}>
        {GOAL_LIST.map((g) => {
          const active = selected === g.kind;
          return (
            <button
              key={g.kind}
              onClick={() => setSelected(g.kind)}
              className="press"
              style={{
                textAlign: "left",
                border: `2px solid ${active ? g.color : C.divider}`,
                background: active ? g.colorSoft : C.surface,
                borderRadius: 18,
                padding: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "all 200ms ease",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: active ? g.color : g.colorSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  flexShrink: 0,
                  transition: "all 200ms ease",
                }}
              >
                {g.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: active ? g.color : C.text }}>
                  {g.label}
                </div>
                <div style={{ fontSize: 13, color: C.text2, marginTop: 1 }}>{g.tagline}</div>
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: `2px solid ${active ? g.color : C.divider}`,
                  background: active ? g.color : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 200ms ease",
                }}
              >
                {active && <Check size={15} color="#fff" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Metas específicas, aparecem conforme o objetivo */}
      {(showWeight || showCalories) && (
        <Card style={{ marginBottom: 18, animation: "riseIn 0.4s ease-out" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Defina suas metas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {showWeight && (
              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>
                  Peso-alvo (kg)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="ex.: 75"
                  style={inputStyle}
                />
              </label>
            )}
            {showCalories && (
              <label style={{ display: "block" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>
                  Meta de calorias diárias (kcal)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={calTarget}
                  onChange={(e) => setCalTarget(e.target.value)}
                  placeholder="ex.: 1800"
                  style={inputStyle}
                />
              </label>
            )}
          </div>
        </Card>
      )}

      <PrimaryButton disabled={!selected || pending} onClick={save}>
        {pending ? <Spinner /> : currentGoal ? "Atualizar objetivo" : "Começar minha jornada"}
      </PrimaryButton>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 16,
  padding: "12px 14px",
  borderRadius: 12,
  border: `1.5px solid ${C.divider}`,
  outline: "none",
  background: C.bg,
};
