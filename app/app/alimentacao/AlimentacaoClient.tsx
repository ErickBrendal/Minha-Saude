"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, Trash2, Sparkles, Loader2, UtensilsCrossed, BookOpen, Scale } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtTime } from "@/lib/design";
import { saveMeal, deleteMeal } from "./actions";
import BibliotecaTab from "./BibliotecaTab";
import PesoTab from "./PesoTab";

const MEAL_TYPES = ["Café", "Almoço", "Jantar", "Lanche"];

export default function AlimentacaoClient({
  meals,
  recipes,
  profile,
  weightLogs,
}: {
  meals: any[];
  recipes: any[];
  profile: any;
  weightLogs: any[];
}) {
  const [tab, setTab] = useState<"diario" | "biblioteca" | "peso">("diario");
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div style={{ padding: "20px 18px" }}>
      <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 14px", letterSpacing: -0.6 }}>Alimentação</h1>

      {/* Abas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <TabBtn active={tab === "diario"} onClick={() => setTab("diario")} icon={UtensilsCrossed} label="Diário" />
        <TabBtn active={tab === "biblioteca"} onClick={() => setTab("biblioteca")} icon={BookOpen} label="Receitas" />
        <TabBtn active={tab === "peso"} onClick={() => setTab("peso")} icon={Scale} label="Peso" />
      </div>

      {tab === "diario" && <DiarioTab meals={meals} profile={profile} flash={flash} />}
      {tab === "biblioteca" && <BibliotecaTab recipes={recipes} goalKind={profile?.primary_goal ?? null} flash={flash} />}
      {tab === "peso" && <PesoTab weightLogs={weightLogs} profile={profile} flash={flash} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 104, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "11px 20px", borderRadius: 99, fontSize: 14, fontWeight: 700, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", animation: "toastIn 220ms ease-out" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        borderRadius: 12,
        border: "none",
        background: active ? C.food : "#F0F0F2",
        color: active ? "#fff" : C.text2,
        fontWeight: 700,
        fontSize: 13.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        transition: "all 150ms ease",
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function DiarioTab({ meals, profile, flash }: { meals: any[]; profile: any; flash: (m: string) => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mealType, setMealType] = useState("Almoço");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const calTarget = profile?.daily_calorie_target;
  const carbTarget = profile?.daily_carb_target;

  async function handlePhoto(file: File) {
    setError(null);
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha na análise");
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mealsToday = meals.filter((m) => new Date(m.eaten_at) >= today);
  const totalKcal = mealsToday.reduce((s, m) => s + (m.calories_kcal || 0), 0);
  const totalCarbs = mealsToday.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const kcalPct = calTarget ? Math.min(100, Math.round((totalKcal / calTarget) * 100)) : null;

  return (
    <div>
      {/* Resumo do dia com progresso */}
      {mealsToday.length > 0 && (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 16 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Calorias hoje</div>
            <span style={{ fontSize: 22, fontWeight: 800, ...NUM }}>{Math.round(totalKcal)}</span>
            <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{calTarget ? ` / ${calTarget}` : " kcal"}</span>
            {kcalPct !== null && (
              <div style={{ height: 6, borderRadius: 99, background: C.divider, overflow: "hidden", marginTop: 8 }}>
                <div style={{ width: `${kcalPct}%`, height: "100%", background: kcalPct > 100 ? C.critHigh : C.food, borderRadius: 99, transition: "width 600ms ease" }} />
              </div>
            )}
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Carboidratos</div>
            <span style={{ fontSize: 22, fontWeight: 800, ...NUM }}>{Math.round(totalCarbs)}</span>
            <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{carbTarget ? ` / ${carbTarget}g` : " g"}</span>
          </Card>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />

      {!analysis && !analyzing && (
        <Card onClick={() => fileRef.current?.click()} className="press" style={{ marginBottom: 18, padding: 28, textAlign: "center", cursor: "pointer", border: `2px dashed ${C.food}66`, background: "#FFF8F0" }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: C.food, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulseGlow 2.5s ease-in-out infinite" }}>
            <Camera size={26} color="#fff" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Fotografe sua refeição</div>
          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.4 }}>
            A IA identifica os alimentos e calcula calorias e carboidratos automaticamente
          </div>
        </Card>
      )}

      {analyzing && (
        <Card style={{ marginBottom: 18, padding: 28, textAlign: "center" }}>
          <Loader2 size={28} color={C.food} style={{ animation: "spin 800ms linear infinite", margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Analisando sua refeição…</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 3 }}>Identificando alimentos e nutrientes</div>
        </Card>
      )}

      {error && (
        <Card style={{ marginBottom: 18, padding: 16, background: "#FFF1F0", border: "1px solid #FFD6D2" }}>
          <div style={{ fontSize: 13.5, color: C.critHigh, lineHeight: 1.5 }}>{error}</div>
          <button onClick={() => { setError(null); fileRef.current?.click(); }} style={{ marginTop: 10, border: "none", background: "transparent", color: C.brand, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Tentar de novo
          </button>
        </Card>
      )}

      {analysis && (
        <Card style={{ marginBottom: 18, padding: 18, animation: "scaleIn 0.3s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Sparkles size={15} color={C.food} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.food, letterSpacing: 0.4 }}>ANÁLISE AUTOMÁTICA</span>
            {analysis.confidence && <span style={{ fontSize: 11, color: C.text2, marginLeft: "auto" }}>confiança {analysis.confidence}</span>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>{analysis.description}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            {[["kcal", Math.round(analysis.calories_kcal || 0)], ["carbo", `${Math.round(analysis.carbs_g || 0)}g`], ["prot", `${Math.round(analysis.protein_g || 0)}g`], ["gord", `${Math.round(analysis.fat_g || 0)}g`]].map(([l, v]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, ...NUM }}>{v}</div>
                <div style={{ fontSize: 10, color: C.text2, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto" }}>
            {MEAL_TYPES.map((t) => (
              <Chip key={t} active={mealType === t} onClick={() => setMealType(t)} color={C.food}>{t}</Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton disabled={pending} style={{ background: C.food }} onClick={() => start(async () => {
              await saveMeal({ meal_type: mealType, description: analysis.description, calories_kcal: analysis.calories_kcal ?? null, carbs_g: analysis.carbs_g ?? null, protein_g: analysis.protein_g ?? null, fat_g: analysis.fat_g ?? null, ai_analysis: analysis });
              setAnalysis(null);
              flash("Refeição registrada ✓");
            })}>
              {pending ? <Spinner /> : "Salvar refeição"}
            </PrimaryButton>
            <button onClick={() => setAnalysis(null)} style={{ padding: "0 18px", borderRadius: 14, border: `1.5px solid ${C.divider}`, background: C.surface, fontWeight: 700, cursor: "pointer", color: C.text2 }}>
              Descartar
            </button>
          </div>
          <p style={{ fontSize: 11, color: C.text2, marginTop: 12, lineHeight: 1.5, marginBottom: 0 }}>
            Estimativas aproximadas por IA. Não use para calcular doses de insulina sem orientação médica.
          </p>
        </Card>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Refeições de hoje</h3>
      {meals.length === 0 && (
        <Card style={{ textAlign: "center", padding: 26, color: C.text2 }}>Nenhuma refeição registrada ainda.</Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {meals.map((m) => (
          <Card key={m.id} style={{ padding: "13px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35 }}>{m.description}</div>
                <div style={{ fontSize: 12.5, color: C.text2, marginTop: 3 }}>
                  {m.meal_type ? `${m.meal_type} · ` : ""}{Math.round(m.calories_kcal || 0)} kcal · {Math.round(m.carbs_g || 0)}g carbo · {fmtTime(new Date(m.eaten_at))}
                </div>
              </div>
              <button onClick={() => start(async () => { await deleteMeal(m.id); flash("Refeição removida"); })} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
                <Trash2 size={15} color="#C4C4C8" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
