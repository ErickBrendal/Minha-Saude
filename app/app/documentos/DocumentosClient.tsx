"use client";

import { useState, useRef, useTransition } from "react";
import {
  FileText, Upload, Sparkles, Loader2, Check, Pill, Syringe, CalendarClock,
  UtensilsCrossed, FlaskConical, FileCheck, Trash2, ChevronRight, X,
} from "lucide-react";
import { Card, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtDate } from "@/lib/design";
import { applyDocument, deleteDocument } from "./actions";

const CATEGORIES = [
  { key: "receita", label: "Receita", icon: Pill, color: "#5856D6" },
  { key: "consulta", label: "Consulta", icon: CalendarClock, color: "#0E7C7B" },
  { key: "dieta", label: "Dieta", icon: UtensilsCrossed, color: "#FF9F0A" },
  { key: "exame", label: "Exame", icon: FlaskConical, color: "#34C759" },
];

const CAT_META: Record<string, { label: string; icon: any; color: string }> = {
  receita: { label: "Receita", icon: Pill, color: "#5856D6" },
  consulta: { label: "Consulta", icon: CalendarClock, color: "#0E7C7B" },
  dieta: { label: "Dieta", icon: UtensilsCrossed, color: "#FF9F0A" },
  exame: { label: "Exame", icon: FlaskConical, color: "#34C759" },
  atestado: { label: "Atestado", icon: FileCheck, color: "#FF6B35" },
  outro: { label: "Documento", icon: FileText, color: "#8E8E93" },
};

export default function DocumentosClient({ documents }: { documents: any[] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  }

  function pick(hint: string | null) {
    hintRef.current = hint;
    fileRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setAnalyzing(true);
    try {
      // PDFs e imagens: enviamos como base64. (PDF é aceito pela API de visão como image_url data URI em muitos casos;
      // para PDF nativo seria outro fluxo, mas a maioria dos uploads aqui são fotos/JPEG.)
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, hint: hintRef.current }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha na análise");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
      hintRef.current = null;
    }
  }

  function apply() {
    if (!result) return;
    start(async () => {
      const r = await applyDocument({
        category: result.category || "outro",
        title: result.title || "Documento",
        summary: result.summary || "",
        extracted: result,
      });
      setResult(null);
      flash(r.applied.length ? `Adicionado: ${r.applied.length} item(ns) ✓` : "Documento guardado ✓");
    });
  }

  const meta = result ? CAT_META[result.category] || CAT_META.outro : null;

  return (
    <div style={{ padding: "20px 18px" }}>
      <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.6 }}>Documentos</h1>
      <p style={{ color: C.text2, fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
        Suba receitas, exames, pedidos de consulta ou orientações. A IA lê, organiza e adiciona
        automaticamente nas áreas certas do app.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Central inteligente */}
      {!result && !analyzing && (
        <>
          <Card
            onClick={() => pick(null)}
            className="press"
            style={{
              marginBottom: 14,
              padding: 26,
              textAlign: "center",
              cursor: "pointer",
              border: `2px dashed ${C.brand}66`,
              background: C.brandSoft,
            }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 18, background: C.brand, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulseGlow 2.5s ease-in-out infinite" }}>
              <Sparkles size={27} color="#fff" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Upload inteligente</div>
            <div style={{ fontSize: 13.5, color: C.text2, lineHeight: 1.45 }}>
              Suba qualquer documento — a IA descobre o que é e organiza sozinha
            </div>
          </Card>

          {/* Botões por categoria */}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text2, letterSpacing: 0.3, margin: "18px 2px 10px" }}>
            OU ESCOLHA A CATEGORIA
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 22 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => pick(c.key)}
                className="press"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: 15, borderRadius: 16, border: `1.5px solid ${C.divider}`, background: C.surface, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 11, background: c.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <c.icon size={19} color={c.color} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {analyzing && (
        <Card style={{ marginBottom: 18, padding: 30, textAlign: "center" }}>
          <Loader2 size={30} color={C.brand} style={{ animation: "spin 800ms linear infinite", margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>Lendo o documento…</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>Identificando tipo, doses, datas e orientações</div>
        </Card>
      )}

      {error && (
        <Card style={{ marginBottom: 18, padding: 16, background: "#FFF1F0", border: "1px solid #FFD6D2" }}>
          <div style={{ fontSize: 13.5, color: C.critHigh, lineHeight: 1.5 }}>{error}</div>
          <button onClick={() => { setError(null); pick(null); }} style={{ marginTop: 10, border: "none", background: "transparent", color: C.brand, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Tentar de novo
          </button>
        </Card>
      )}

      {/* Preview do que a IA extraiu */}
      {result && meta && (
        <Card style={{ marginBottom: 18, padding: 18, animation: "scaleIn 0.3s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <meta.icon size={20} color={meta.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: meta.color, letterSpacing: 0.4 }}>{meta.label.toUpperCase()}</div>
              <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.25 }}>{result.title}</div>
            </div>
          </div>

          {result.summary && (
            <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, marginBottom: 14 }}>{result.summary}</div>
          )}

          {/* O que será adicionado */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {(result.medications || []).map((m: any, i: number) => (
              <ExtractRow key={`m${i}`} icon={m.dose_unit === "U" ? Syringe : Pill} color="#5856D6"
                title={m.name}
                sub={`${m.dose_amount ?? ""}${m.dose_unit ?? ""}${(m.schedule_times || []).length ? " · " + m.schedule_times.join(", ") : ""}`} />
            ))}
            {result.appointment?.specialty && (
              <ExtractRow icon={CalendarClock} color="#0E7C7B"
                title={result.appointment.specialty}
                sub={result.appointment.date ? new Date(result.appointment.date).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "data a confirmar"} />
            )}
            {(result.diet_items || []).map((d: any, i: number) => (
              <ExtractRow key={`d${i}`} icon={UtensilsCrossed} color="#FF9F0A" title={d.name} sub={(d.tags || []).join(" · ")} />
            ))}
            {(result.exam_results || []).map((e: any, i: number) => (
              <ExtractRow key={`e${i}`} icon={FlaskConical} color="#34C759" title={e.name} sub={`${e.value}${e.reference ? " (ref: " + e.reference + ")" : ""}`} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton disabled={pending} onClick={apply}>
              {pending ? <Spinner /> : "Adicionar ao meu app"}
            </PrimaryButton>
            <button onClick={() => setResult(null)} style={{ padding: "0 18px", borderRadius: 14, border: `1.5px solid ${C.divider}`, background: C.surface, fontWeight: 700, cursor: "pointer", color: C.text2 }}>
              Descartar
            </button>
          </div>
          <p style={{ fontSize: 11, color: C.text2, marginTop: 12, lineHeight: 1.5, marginBottom: 0 }}>
            Confira os dados antes de adicionar. A IA pode cometer erros — valide doses e datas com o documento original.
          </p>
        </Card>
      )}

      {/* Histórico */}
      {documents.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Já organizados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {documents.map((d) => {
              const m = CAT_META[d.category] || CAT_META.outro;
              return (
                <Card key={d.id} style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: m.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <m.icon size={17} color={m.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>{m.label} · {fmtDate(new Date(d.created_at))}</div>
                  </div>
                  <button onClick={() => start(async () => { await deleteDocument(d.id); flash("Documento removido"); })} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={15} color="#C4C4C8" />
                  </button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 104, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "11px 20px", borderRadius: 99, fontSize: 14, fontWeight: 700, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", animation: "toastIn 220ms ease-out" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function ExtractRow({ icon: Icon, color, title, sub }: { icon: any; color: string; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: C.bg }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: C.text2 }}>{sub}</div>}
      </div>
      <Check size={16} color={color} strokeWidth={2.5} />
    </div>
  );
}
