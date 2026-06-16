"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, ChefHat, Star, Trash2, Sparkles, Plus, X } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM } from "@/lib/design";
import { saveRecipe, toggleFavoriteRecipe, deleteRecipe } from "./actions";

export default function BibliotecaTab({
  recipes,
  goalKind,
  flash,
}: {
  recipes: any[];
  goalKind: string | null;
  flash: (m: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [genKeyword, setGenKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [showFav, setShowFav] = useState(false);

  // Busca local na biblioteca salva
  const filtered = useMemo(() => {
    let list = recipes;
    if (showFav) list = list.filter((r) => r.favorite);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        (r.tags || []).some((t: string) => t.toLowerCase().includes(q)) ||
        (r.ingredients || []).some((i: string) => i.toLowerCase().includes(q))
    );
  }, [recipes, query, showFav]);

  async function generate() {
    if (!genKeyword.trim()) return;
    setLoading(true);
    setError(null);
    setGenerated([]);
    try {
      const resp = await fetch("/api/suggest-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: genKeyword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha");
      setGenerated(data.recipes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Gerar nova receita por palavra-chave */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Sparkles size={17} color={C.food} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Criar receita com IA</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={genKeyword}
            onChange={(e) => setGenKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="ex.: jantar low-carb, café da manhã proteico"
            style={inputStyle}
          />
          <button
            onClick={generate}
            disabled={loading}
            style={{ padding: "0 16px", borderRadius: 12, border: "none", background: C.food, color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {loading ? <Spinner size={16} /> : "Gerar"}
          </button>
        </div>
        {error && <div style={{ fontSize: 13, color: C.critHigh, marginTop: 10 }}>{error}</div>}
      </Card>

      {/* Receitas geradas (ainda não salvas) */}
      {generated.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.food, letterSpacing: 0.3, margin: "0 0 10px 2px" }}>
            SUGESTÕES DA IA · toque na estrela para salvar
          </h3>
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {generated.map((r, i) => (
              <GeneratedCard
                key={i}
                recipe={r}
                onSave={() =>
                  start(async () => {
                    await saveRecipe({
                      name: r.name,
                      tags: r.tags || [],
                      ingredients: [...(r.ingredients_used || []), ...(r.missing || [])],
                      steps: r.steps || [],
                      calories_kcal: r.calories_kcal ?? null,
                      carbs_g: r.carbs_g ?? null,
                      protein_g: r.protein_g ?? null,
                      fat_g: r.fat_g ?? null,
                      glycemic_note: r.glycemic_note ?? null,
                      goal_kind: goalKind,
                    });
                    flash("Receita salva na biblioteca ✓");
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Busca na biblioteca salva */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} color={C.text2} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nas minhas receitas…"
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <button
          onClick={() => setShowFav(!showFav)}
          style={{
            padding: "0 14px",
            borderRadius: 12,
            border: `1.5px solid ${showFav ? C.food : C.divider}`,
            background: showFav ? C.food + "1A" : C.surface,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Star size={18} color={showFav ? C.food : C.text2} fill={showFav ? C.food : "none"} />
        </button>
      </div>

      {recipes.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28, color: C.text2 }}>
          <ChefHat size={32} color={C.divider} style={{ margin: "0 auto 10px", display: "block" }} />
          Sua biblioteca está vazia.<br />Gere receitas acima e salve as favoritas.
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 24, color: C.text2 }}>
          Nenhuma receita encontrada para “{query}”.
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {filtered.map((r) => (
            <SavedCard
              key={r.id}
              recipe={r}
              onFav={() => start(async () => { await toggleFavoriteRecipe(r.id, !r.favorite); })}
              onDelete={() => start(async () => { await deleteRecipe(r.id); flash("Receita removida"); })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratedCard({ recipe: r, onSave }: { recipe: any; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</div>
          <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: C.text2, marginTop: 4 }}>
            <span>{Math.round(r.carbs_g || 0)}g carbo</span>
            <span>{Math.round(r.calories_kcal || 0)} kcal</span>
            {r.protein_g ? <span>{Math.round(r.protein_g)}g prot</span> : null}
          </div>
        </div>
        <button onClick={onSave} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
          <Star size={22} color={C.food} />
        </button>
      </div>
      {(r.tags || []).length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {r.tags.map((t: string, i: number) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.food, background: C.food + "1A", padding: "3px 8px", borderRadius: 999 }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {r.glycemic_note && (
        <div style={{ fontSize: 12.5, color: C.brand, background: C.brandSoft, padding: "8px 10px", borderRadius: 10, marginTop: 10, lineHeight: 1.4 }}>
          {r.glycemic_note}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ marginTop: 10, border: "none", background: "transparent", color: C.text2, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
        {open ? "Ocultar modo de preparo" : "Ver modo de preparo →"}
      </button>
      {open && (
        <ol style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: C.text }}>
          {(r.steps || []).map((s: string, j: number) => <li key={j}>{s}</li>)}
        </ol>
      )}
    </Card>
  );
}

function SavedCard({ recipe: r, onFav, onDelete }: { recipe: any; onFav: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpen(!open)}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</div>
          <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: C.text2, marginTop: 4 }}>
            <span>{Math.round(r.carbs_g || 0)}g carbo</span>
            <span>{Math.round(r.calories_kcal || 0)} kcal</span>
          </div>
        </div>
        <button onClick={onFav} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
          <Star size={20} color={C.food} fill={r.favorite ? C.food : "none"} />
        </button>
        <button onClick={onDelete} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}>
          <Trash2 size={16} color="#C4C4C8" />
        </button>
      </div>
      {(r.tags || []).length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {r.tags.map((t: string, i: number) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.food, background: C.food + "1A", padding: "3px 8px", borderRadius: 999 }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {open && (
        <>
          {r.glycemic_note && (
            <div style={{ fontSize: 12.5, color: C.brand, background: C.brandSoft, padding: "8px 10px", borderRadius: 10, marginTop: 10, lineHeight: 1.4 }}>
              {r.glycemic_note}
            </div>
          )}
          {(r.ingredients || []).length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 4 }}>INGREDIENTES</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{r.ingredients.join(", ")}</div>
            </div>
          )}
          {(r.steps || []).length > 0 && (
            <ol style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: C.text }}>
              {r.steps.map((s: string, j: number) => <li key={j}>{s}</li>)}
            </ol>
          )}
        </>
      )}
    </Card>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 15,
  padding: "11px 13px",
  borderRadius: 12,
  border: `1.5px solid ${C.divider}`,
  outline: "none",
  background: C.bg,
};
