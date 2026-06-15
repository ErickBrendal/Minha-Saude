"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, X, Trash2, Sparkles, ChefHat, Loader2 } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtTime } from "@/lib/design";
import { saveMeal, deleteMeal } from "./actions";

type Meal = {
  id: string;
  meal_type: string | null;
  description: string | null;
  calories_kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  eaten_at: string;
};

const MEAL_TYPES = ["Café", "Almoço", "Jantar", "Lanche"];

export default function AlimentacaoClient({ meals }: { meals: Meal[] }) {
  const [tab, setTab] = useState<"diario" | "receitas">("diario");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mealType, setMealType] = useState("Almoço");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

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

  return (
    <div style={{ padding: "20px 18px" }}>
      <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 14px", letterSpacing: -0.6 }}>
        Alimentação
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Chip active={tab === "diario"} onClick={() => setTab("diario")} color={C.food}>
          Diário
        </Chip>
        <Chip active={tab === "receitas"} onClick={() => setTab("receitas")} color={C.food}>
          Sugerir receita
        </Chip>
      </div>

      {tab === "diario" ? (
        <>
          {/* RESUMO DO DIA */}
          {mealsToday.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Calorias hoje</div>
                <span style={{ fontSize: 24, fontWeight: 800, ...NUM }}>{Math.round(totalKcal)}</span>
                <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}> kcal</span>
              </Card>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Carboidratos</div>
                <span style={{ fontSize: 24, fontWeight: 800, ...NUM }}>{Math.round(totalCarbs)}</span>
                <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}> g</span>
              </Card>
            </div>
          )}

          {/* CAPTURA POR FOTO */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
          />

          {!analysis && !analyzing && (
            <Card
              onClick={() => fileRef.current?.click()}
              style={{
                marginBottom: 18,
                padding: 28,
                textAlign: "center",
                cursor: "pointer",
                border: `2px dashed ${C.divider}`,
                background: C.brandSoft + "60",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: C.food,
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={26} color="#fff" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Fotografe sua refeição</div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.4 }}>
                A IA descreve o prato e estima calorias e carboidratos
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
              <button
                onClick={() => { setError(null); fileRef.current?.click(); }}
                style={{ marginTop: 10, border: "none", background: "transparent", color: C.brand, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Tentar de novo
              </button>
            </Card>
          )}

          {analysis && (
            <Card style={{ marginBottom: 18, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Sparkles size={15} color={C.food} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.food, letterSpacing: 0.4 }}>
                  ANÁLISE DA IA
                </span>
                {analysis.confidence && (
                  <span style={{ fontSize: 11, color: C.text2, marginLeft: "auto" }}>
                    confiança {analysis.confidence}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
                {analysis.description}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  ["kcal", Math.round(analysis.calories_kcal || 0)],
                  ["carbo", `${Math.round(analysis.carbs_g || 0)}g`],
                  ["prot", `${Math.round(analysis.protein_g || 0)}g`],
                  ["gord", `${Math.round(analysis.fat_g || 0)}g`],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: C.bg, borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, ...NUM }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 600 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto" }}>
                {MEAL_TYPES.map((t) => (
                  <Chip key={t} active={mealType === t} onClick={() => setMealType(t)} color={C.food}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <PrimaryButton
                  disabled={pending}
                  style={{ background: C.food }}
                  onClick={() =>
                    start(async () => {
                      await saveMeal({
                        meal_type: mealType,
                        description: analysis.description,
                        calories_kcal: analysis.calories_kcal ?? null,
                        carbs_g: analysis.carbs_g ?? null,
                        protein_g: analysis.protein_g ?? null,
                        fat_g: analysis.fat_g ?? null,
                        ai_analysis: analysis,
                      });
                      setAnalysis(null);
                      flash("Refeição registrada ✓");
                    })
                  }
                >
                  {pending ? <Spinner /> : "Salvar refeição"}
                </PrimaryButton>
                <button
                  onClick={() => setAnalysis(null)}
                  style={{ padding: "0 18px", borderRadius: 14, border: `1.5px solid ${C.divider}`, background: C.surface, fontWeight: 700, cursor: "pointer", color: C.text2 }}
                >
                  Descartar
                </button>
              </div>
              <p style={{ fontSize: 11, color: C.text2, marginTop: 12, lineHeight: 1.5, marginBottom: 0 }}>
                Estimativas aproximadas geradas por IA. Não use para calcular doses de insulina sem orientação médica.
              </p>
            </Card>
          )}

          {/* DIÁRIO */}
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>Refeições</h3>
          {meals.length === 0 && (
            <Card style={{ textAlign: "center", padding: 26, color: C.text2 }}>
              Nenhuma refeição registrada ainda.
            </Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meals.map((m) => (
              <Card key={m.id} style={{ padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.35 }}>{m.description}</div>
                    <div style={{ fontSize: 12.5, color: C.text2, marginTop: 3 }}>
                      {m.meal_type ? `${m.meal_type} · ` : ""}
                      {Math.round(m.calories_kcal || 0)} kcal · {Math.round(m.carbs_g || 0)}g carbo ·{" "}
                      {fmtTime(new Date(m.eaten_at))}
                    </div>
                  </div>
                  <button
                    onClick={() => start(async () => { await deleteMeal(m.id); flash("Refeição removida"); })}
                    style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
                  >
                    <Trash2 size={15} color="#C4C4C8" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <RecipeSuggester flash={flash} />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 104,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.text,
            color: "#fff",
            padding: "11px 20px",
            borderRadius: 99,
            fontSize: 14,
            fontWeight: 700,
            zIndex: 60,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,.25)",
            animation: "toastIn 220ms ease-out",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function RecipeSuggester({ flash }: { flash: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const v = input.trim();
    if (v && !items.includes(v)) setItems([...items, v]);
    setInput("");
  }

  async function suggest() {
    setError(null);
    setLoading(true);
    setRecipes([]);
    try {
      const resp = await fetch("/api/suggest-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: items }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha");
      setRecipes(data.recipes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <ChefHat size={17} color={C.food} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>O que você tem em casa?</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="ex.: ovos, frango, brócolis"
            style={{
              flex: 1,
              fontSize: 15,
              padding: "11px 13px",
              borderRadius: 12,
              border: `1.5px solid ${C.divider}`,
              outline: "none",
              background: C.bg,
            }}
          />
          <button
            onClick={add}
            style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.food, color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            +
          </button>
        </div>
        {items.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {items.map((it) => (
              <button
                key={it}
                onClick={() => setItems(items.filter((x) => x !== it))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 11px",
                  borderRadius: 999,
                  border: "none",
                  background: C.food + "1A",
                  color: C.food,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {it} <X size={13} />
              </button>
            ))}
          </div>
        )}
        <PrimaryButton disabled={items.length === 0 || loading} style={{ background: C.food }} onClick={suggest}>
          {loading ? <Spinner /> : "Sugerir receitas"}
        </PrimaryButton>
      </Card>

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "#FFF1F0", border: "1px solid #FFD6D2" }}>
          <div style={{ fontSize: 13.5, color: C.critHigh }}>{error}</div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {recipes.map((r, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{r.name}</div>
            <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: C.text2, marginBottom: 10 }}>
              <span>{Math.round(r.carbs_g || 0)}g carbo</span>
              <span>{Math.round(r.calories_kcal || 0)} kcal</span>
            </div>
            {r.glycemic_note && (
              <div style={{ fontSize: 13, color: C.brand, background: C.brandSoft, padding: "8px 10px", borderRadius: 10, marginBottom: 10, lineHeight: 1.4 }}>
                {r.glycemic_note}
              </div>
            )}
            {r.missing?.length > 0 && (
              <div style={{ fontSize: 12.5, color: C.text2, marginBottom: 8 }}>
                Falta comprar: {r.missing.join(", ")}
              </div>
            )}
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: C.text }}>
              {(r.steps || []).map((s: string, j: number) => (
                <li key={j}>{s}</li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
