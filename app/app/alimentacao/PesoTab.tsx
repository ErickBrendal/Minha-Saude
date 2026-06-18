"use client";

import { useState, useTransition, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { Scale, Camera, Plus, X, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { Card, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtDate } from "@/lib/design";
import { addWeight } from "../actions";
import { usePhotoPicker } from "@/components/PhotoPicker";

export default function PesoTab({
  weightLogs,
  profile,
  flash,
}: {
  weightLogs: any[];
  profile: any;
  flash: (m: string) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const picker = usePhotoPicker((f) => handlePhoto(f));

  const target = profile?.target_weight_kg;
  const current = weightLogs[0]?.weight_kg ?? profile?.weight_kg;

  const change = useMemo(() => {
    if (weightLogs.length < 2) return null;
    return +(weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg).toFixed(1);
  }, [weightLogs]);

  const chartData = useMemo(
    () =>
      weightLogs
        .slice()
        .reverse()
        .map((w) => ({
          label: new Date(w.measured_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          v: w.weight_kg,
        })),
    [weightLogs]
  );

  async function handlePhoto(file: File) {
    setError(null);
    setAnalyzing(true);
    setAiResult(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/analyze-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha");
      if (!data.weight_kg) {
        setError(data.note || "Não consegui ler o peso. Tente uma foto mais nítida do visor.");
      } else {
        setAiResult(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      {/* Resumo */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: target ? "1fr 1fr 1fr" : "1fr 1fr", gap: 11, marginBottom: 16 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Atual</div>
          <span style={{ fontSize: 22, fontWeight: 800, ...NUM }}>{current ?? "—"}</span>
          <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}> kg</span>
        </Card>
        {target && (
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Meta</div>
            <span style={{ fontSize: 22, fontWeight: 800, color: C.brand, ...NUM }}>{target}</span>
            <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}> kg</span>
          </Card>
        )}
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Variação</div>
          {change !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {change < 0 ? <TrendingDown size={18} color={C.inRange} /> : change > 0 ? <TrendingUp size={18} color={C.warnHigh} /> : null}
              <span style={{ fontSize: 20, fontWeight: 800, color: change < 0 ? C.inRange : change > 0 ? C.warnHigh : C.text, ...NUM }}>
                {change > 0 ? "+" : ""}{change}
              </span>
              <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>kg</span>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: C.text2 }}>—</span>
          )}
        </Card>
      </div>

      {/* Gráfico */}
      {chartData.length >= 2 && (
        <Card style={{ marginBottom: 16, padding: "16px 8px 8px 0" }}>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 14, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.text2 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: C.text2 }} width={36} domain={["dataMin - 2", "dataMax + 2"]} tickLine={false} axisLine={false} />
                {target && <ReferenceLine y={target} stroke={C.brand} strokeDasharray="4 4" label={{ value: "meta", fontSize: 10, fill: C.brand, position: "right" }} />}
                <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.divider}`, fontSize: 13 }} formatter={(v: any) => [`${v} kg`, "Peso"]} labelFormatter={() => ""} />
                <Line type="monotone" dataKey="v" stroke={C.brand} strokeWidth={2.5} dot={{ r: 2.5, fill: C.brand, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Botões de registro */}
      <div style={{ display: "flex", gap: 11, marginBottom: 18 }}>
        <button
          onClick={() => setSheet(true)}
          className="press"
          style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: C.brand, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        >
          <Plus size={18} /> Digitar peso
        </button>
        <button
          onClick={() => picker.open()}
          className="press"
          style={{ flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid ${C.brand}`, background: C.surface, color: C.brand, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        >
          <Camera size={18} /> Foto da balança
        </button>
      </div>

      {analyzing && (
        <Card style={{ marginBottom: 16, padding: 24, textAlign: "center" }}>
          <Loader2 size={26} color={C.brand} style={{ animation: "spin 800ms linear infinite", margin: "0 auto 8px", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Lendo o visor da balança…</div>
        </Card>
      )}

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "#FFF1F0", border: "1px solid #FFD6D2" }}>
          <div style={{ fontSize: 13.5, color: C.critHigh, lineHeight: 1.5 }}>{error}</div>
        </Card>
      )}

      {aiResult && (
        <Card style={{ marginBottom: 16, padding: 18, border: `1.5px solid ${C.brand}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, marginBottom: 6 }}>
            LEITURA DA IA · confiança {aiResult.confidence}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 40, fontWeight: 800, ...NUM }}>{aiResult.weight_kg}</span>
            <span style={{ fontSize: 15, color: C.text2, fontWeight: 600 }}>kg</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await addWeight(aiResult.weight_kg, "ai_photo");
                  setAiResult(null);
                  flash("Peso registrado ✓");
                })
              }
            >
              {pending ? <Spinner /> : "Confirmar"}
            </PrimaryButton>
            <button onClick={() => setAiResult(null)} style={{ padding: "0 18px", borderRadius: 14, border: `1.5px solid ${C.divider}`, background: C.surface, fontWeight: 700, cursor: "pointer", color: C.text2 }}>
              Descartar
            </button>
          </div>
        </Card>
      )}

      {/* Histórico */}
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Histórico</h3>
      {weightLogs.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 26, color: C.text2 }}>
          <Scale size={30} color={C.divider} style={{ margin: "0 auto 8px", display: "block" }} />
          Nenhum peso registrado ainda.
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {weightLogs.map((w) => (
            <Card key={w.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <Scale size={17} color={C.brand} />
              <span style={{ fontSize: 18, fontWeight: 800, ...NUM }}>{w.weight_kg}</span>
              <span style={{ fontSize: 12.5, color: C.text2, fontWeight: 600 }}>kg</span>
              {w.source === "ai_photo" && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.brand, background: C.brandSoft, padding: "2px 7px", borderRadius: 999 }}>FOTO</span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.text2, ...NUM }}>
                {fmtDate(new Date(w.measured_at))}
              </span>
            </Card>
          ))}
        </div>
      )}

      {sheet && <ManualSheet pending={pending} onClose={() => setSheet(false)} onSave={(v) => start(async () => { await addWeight(v, "manual"); setSheet(false); flash("Peso registrado ✓"); })} />}
      {picker.sheet}
    </div>
  );
}

function ManualSheet({ pending, onClose, onSave }: { pending: boolean; onClose: () => void; onSave: (v: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: "12px 20px 28px", animation: "slideUp 280ms ease-out" }}>
        <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Registrar peso</h2>
          <button onClick={onClose} style={{ border: "none", background: "#F0F0F2", borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color={C.text2} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center", padding: "12px 0 18px" }}>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="0"
            style={{ width: 130, textAlign: "center", border: "none", borderBottom: `2px solid ${C.brand}`, outline: "none", fontSize: 44, fontWeight: 800, background: "transparent", ...NUM }}
          />
          <span style={{ fontSize: 18, color: C.text2, fontWeight: 700 }}>kg</span>
        </div>
        <PrimaryButton disabled={!val || +val <= 0 || pending} onClick={() => onSave(+val)}>
          {pending ? <Spinner /> : "Salvar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
