"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Droplet, UtensilsCrossed, Activity, Heart, Pill, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, Spinner } from "@/components/ui";
import { C } from "@/lib/design";
import { goalConfig } from "@/lib/goals";

const CAT_ICON: Record<string, any> = {
  glicemia: Droplet,
  dieta: UtensilsCrossed,
  atividade: Activity,
  convivencia: Heart,
  medicacao: Pill,
};
const CAT_COLOR: Record<string, string> = {
  glicemia: "#0E7C7B",
  dieta: "#FF9F0A",
  atividade: "#34C759",
  convivencia: "#FF3B30",
  medicacao: "#5856D6",
};

export default function EspecialistaClient({
  goalKind,
  history,
}: {
  goalKind: string | null;
  history: any[];
}) {
  const goal = goalConfig(goalKind);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/specialist-insight", { method: "POST" });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Falha");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Gera automaticamente ao abrir
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Link href="/app" style={{ color: C.text2, display: "flex" }}>
          <ArrowLeft size={22} />
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Especialista IA</h1>
      </div>
      <p style={{ color: C.text2, fontSize: 13.5, margin: "0 0 18px 32px", lineHeight: 1.5 }}>
        Orientações educativas para <strong style={{ color: goal.color }}>{goal.label.toLowerCase()}</strong>,
        com base em diretrizes {goal.guidelines.join(", ")}.
      </p>

      {/* Banner do especialista */}
      <Card style={{ marginBottom: 16, padding: 18, background: "linear-gradient(135deg, #5856D6, #4240B8)", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "pulseGlow 2.5s ease-in-out infinite" }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
              {data?.saudacao || "Suas dicas personalizadas"}
            </div>
            {data?.foco_da_semana && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)", marginTop: 3, lineHeight: 1.4 }}>
                🎯 {data.foco_da_semana}
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading && (
        <Card style={{ padding: 32, textAlign: "center" }}>
          <Spinner size={28} color="#5856D6" />
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>Analisando seus dados…</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 3 }}>
            Cruzando com diretrizes {goal.guidelines.join(", ")}
          </div>
        </Card>
      )}

      {error && (
        <Card style={{ padding: 16, background: "#FFF1F0", border: "1px solid #FFD6D2" }}>
          <div style={{ fontSize: 13.5, color: C.critHigh, lineHeight: 1.5 }}>{error}</div>
          <button onClick={generate} style={{ marginTop: 10, border: "none", background: "transparent", color: "#5856D6", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Tentar de novo
          </button>
        </Card>
      )}

      {data?.insights && (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {data.insights.map((ins: any, i: number) => {
            const Icon = CAT_ICON[ins.categoria] || Sparkles;
            const color = CAT_COLOR[ins.categoria] || "#5856D6";
            return (
              <Card key={i} style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 11 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{ins.titulo}</span>
                      {ins.diretriz && (
                        <span style={{ fontSize: 10, fontWeight: 800, color, background: color + "1A", padding: "3px 7px", borderRadius: 999, letterSpacing: 0.3 }}>
                          {ins.diretriz}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.5, color: C.text }}>{ins.texto}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {data && !loading && (
        <button
          onClick={generate}
          style={{
            width: "100%",
            marginTop: 16,
            padding: 13,
            borderRadius: 14,
            border: `1.5px solid ${C.divider}`,
            background: C.surface,
            color: "#5856D6",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <RefreshCw size={16} /> Gerar novas dicas
        </button>
      )}

      <p style={{ fontSize: 11.5, color: C.text2, textAlign: "center", lineHeight: 1.5, margin: "18px 12px 0" }}>
        Conteúdo educativo gerado por IA com base em diretrizes públicas. Não substitui
        avaliação médica individual nem orienta ajuste de medicação.
      </p>
    </div>
  );
}
