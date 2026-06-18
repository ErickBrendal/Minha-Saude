"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, X, Heart, Activity as ActIcon, Droplet, Smile,
  TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Settings2,
} from "lucide-react";
import { Card, Spinner, PrimaryButton, Chip } from "@/components/ui";
import { Gauge } from "@/components/Gauge";
import { C, NUM } from "@/lib/design";
import {
  glucoseIndicator, pressureIndicator, cholesterolIndicator,
  adherenceIndicator, moodIndicator, overallScore, buildCareSignals,
  type Indicator, type CareSignal, type Severity,
} from "@/lib/monitoring";
import { addPressure, addCholesterol, addMood, updateHealthTargets } from "../actions";

const SEV_COLOR: Record<Severity, string> = {
  good: C.inRange,
  attention: C.warnHigh,
  alert: C.hypo,
};

export default function IndicadoresClient({
  profile, measures, cholesterol, medications, medLogsWeek, weekISO, twoWeeksISO,
}: any) {
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState<null | "pressure" | "cholesterol" | "mood" | "targets">(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const bpTarget = profile?.bp_systolic_target ?? 130;
  const ldlTarget = profile?.ldl_target ?? 100;

  // separa medições por tipo e janela
  const weekStart = new Date(weekISO).getTime();
  const byType = (t: string) => measures.filter((m: any) => m.metric_type === t);
  const inWeek = (arr: any[]) => arr.filter((m: any) => new Date(m.measured_at).getTime() >= weekStart);
  const prevWindow = (arr: any[]) =>
    arr.filter((m: any) => new Date(m.measured_at).getTime() < weekStart);

  const glucoseAll = byType("glucose");
  const glucoseWeek = inWeek(glucoseAll).map((m: any) => m.value);
  const glucosePrev = prevWindow(glucoseAll).map((m: any) => m.value);
  const pressureAll = byType("pressure");
  const pressureWeek = inWeek(pressureAll).map((m: any) => m.value);
  const pressurePrev = prevWindow(pressureAll).map((m: any) => m.value);
  const moodWeek = inWeek(byType("mood")).map((m: any) => m.value);
  const ldlValues = cholesterol.map((c: any) => c.context?.ldl).filter((v: any) => v != null);

  // adesão
  const expectedPerWeek = medications.reduce(
    (s: number, m: any) => s + Math.max(1, (m.schedule_times || []).length) * 7, 0
  );
  const adherencePct = expectedPerWeek > 0
    ? Math.min(100, Math.round((medLogsWeek.length / expectedPerWeek) * 100)) : null;

  const hyposThisWeek = glucoseWeek.filter((v: number) => v < low).length;

  // monta indicadores conforme há dados
  const indicators: Indicator[] = useMemo(() => {
    const list: (Indicator | null)[] = [
      glucoseIndicator(glucoseWeek, low, high),
      pressureIndicator(pressureWeek, bpTarget),
      cholesterolIndicator(ldlValues, ldlTarget),
      adherenceIndicator(medLogsWeek.length, expectedPerWeek),
      moodIndicator(moodWeek),
    ];
    return list.filter(Boolean) as Indicator[];
  }, [glucoseWeek, pressureWeek, ldlValues, moodWeek, medLogsWeek, low, high, bpTarget, ldlTarget, expectedPerWeek]);

  const overall = overallScore(indicators);
  const overallSev: Severity = overall >= 70 ? "good" : overall >= 40 ? "attention" : "alert";

  const signals: CareSignal[] = useMemo(
    () => buildCareSignals({
      glucoseRecent: glucoseWeek, glucosePrev, low, high,
      hyposThisWeek, adherencePct,
      pressureRecent: pressureWeek, pressurePrev, bpTarget,
    }),
    [glucoseWeek, glucosePrev, pressureWeek, pressurePrev, hyposThisWeek, adherencePct, low, high, bpTarget]
  );

  const hasData = indicators.length > 0;

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Link href="/app" style={{ color: C.text2, display: "flex" }}><ArrowLeft size={22} /></Link>
        <h1 style={{ fontSize: 23, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Meus indicadores</h1>
      </div>
      <p style={{ color: C.text2, fontSize: 13.5, margin: "0 0 18px 32px", lineHeight: 1.5 }}>
        Acompanhamento dos seus números frente às metas combinadas com seu médico.
      </p>

      {/* SCORE GERAL com velocímetro grande */}
      <Card style={{ marginBottom: 16, padding: 20, background: `linear-gradient(135deg, ${SEV_COLOR[overallSev]}14, ${C.surface})`, border: `1px solid ${SEV_COLOR[overallSev]}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Gauge score={overall} size={150} color={SEV_COLOR[overallSev]}
            display={hasData ? `${overall}` : "—"} unit={hasData ? "/100" : ""} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: SEV_COLOR[overallSev], letterSpacing: 0.4 }}>
              ÍNDICE DE CUIDADO
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, marginTop: 2 }}>
              {!hasData ? "Comece a registrar"
                : overallSev === "good" ? "Você está cuidando bem de si"
                : overallSev === "attention" ? "Dá para melhorar alguns pontos"
                : "Hora de retomar o controle"}
            </div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 4, lineHeight: 1.45 }}>
              {!hasData
                ? "Registre glicemia, pressão, colesterol ou humor para ver seu índice."
                : "Combina seus indicadores ativos. Sobe conforme você volta para as faixas combinadas."}
            </div>
          </div>
        </div>
      </Card>

      {/* SINAIS DE CUIDADO */}
      {signals.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
            FIQUE DE OLHO
          </h3>
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {signals.map((s) => (
              <SignalCard key={s.key} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* TUDO EM DIA (quando há dados e nenhum sinal) */}
      {hasData && signals.length === 0 && (
        <Card style={{ marginBottom: 18, padding: 16, background: "#EAF8EF", border: "1px solid #BFE9CD", display: "flex", gap: 11, alignItems: "center" }}>
          <CheckCircle2 size={22} color={C.inRange} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.45 }}>
            <strong>Tudo dentro do combinado.</strong> Seus indicadores estão nas faixas certas. Continue com a boa rotina!
          </div>
        </Card>
      )}

      {/* GRADE DE VELOCÍMETROS */}
      {hasData && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
            INDICADORES
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {indicators.map((ind) => (
              <Card key={ind.key} style={{ padding: "14px 10px 12px" }}>
                <Gauge score={ind.score} size={130} color={SEV_COLOR[ind.severity]}
                  display={ind.display} unit={ind.unit} />
                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ind.label}</div>
                  <div style={{ fontSize: 11.5, color: SEV_COLOR[ind.severity], fontWeight: 600, marginTop: 1, lineHeight: 1.3 }}>
                    {ind.status}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* REGISTRAR NOVOS INDICADORES */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        REGISTRAR
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 14 }}>
        <RegBtn icon={Heart} color="#FF3B30" label="Pressão" onClick={() => setSheet("pressure")} />
        <RegBtn icon={Droplet} color="#E8800A" label="Colesterol" onClick={() => setSheet("cholesterol")} />
        <RegBtn icon={Smile} color="#5856D6" label="Humor" onClick={() => setSheet("mood")} />
        <RegBtn icon={Settings2} color={C.brand} label="Metas" onClick={() => setSheet("targets")} />
      </div>

      <p style={{ fontSize: 11, color: C.text2, textAlign: "center", lineHeight: 1.5, margin: "8px 12px 0" }}>
        Este painel organiza seus registros e os compara com metas definidas com seu médico.
        Não calcula doses nem substitui avaliação clínica. Em sinais de emergência, procure atendimento.
      </p>

      {sheet === "pressure" && (
        <PressureSheet pending={pending} onClose={() => setSheet(null)}
          onSave={(s: number, d: number, n: string | null) => start(async () => { await addPressure(s, d, n); setSheet(null); flash("Pressão registrada ✓"); })} />
      )}
      {sheet === "cholesterol" && (
        <CholesterolSheet pending={pending} onClose={() => setSheet(null)}
          onSave={(t: number, l: number | null, h: number | null, tg: number | null, n: string | null) => start(async () => { await addCholesterol(t, l, h, tg, n); setSheet(null); flash("Colesterol registrado ✓"); })} />
      )}
      {sheet === "mood" && (
        <MoodSheet pending={pending} onClose={() => setSheet(null)}
          onSave={(lv: number, n: string | null) => start(async () => { await addMood(lv, n); setSheet(null); flash("Humor registrado ✓"); })} />
      )}
      {sheet === "targets" && (
        <TargetsSheet pending={pending} profile={profile} onClose={() => setSheet(null)}
          onSave={(o: any) => start(async () => { await updateHealthTargets(o); setSheet(null); flash("Metas atualizadas ✓"); })} />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

function SignalCard({ signal: s }: { signal: CareSignal }) {
  const color = SEV_COLOR[s.severity];
  const Icon = s.recovering ? TrendingUp : s.severity === "alert" ? AlertTriangle : Sparkles;
  const bg = s.recovering ? "#EAF8EF" : s.severity === "alert" ? "#FFF1F0" : "#FFF9EC";
  const border = s.recovering ? "#BFE9CD" : s.severity === "alert" ? "#FFD6D2" : "#FBE4B0";
  return (
    <Card style={{ padding: 15, background: bg, border: `1px solid ${border}` }}>
      <div style={{ display: "flex", gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{s.title}</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{s.message}</div>
        </div>
      </div>
    </Card>
  );
}

function RegBtn({ icon: Icon, color, label, onClick }: any) {
  return (
    <button onClick={onClick} className="press"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, border: `1.5px solid ${C.divider}`, background: C.surface, cursor: "pointer", textAlign: "left" }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
    </button>
  );
}

// ---------- Folhas de registro ----------
function SheetShell({ title, onClose, children }: any) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: "12px 20px calc(28px + env(safe-area-inset-bottom))", maxHeight: "90vh", overflowY: "auto", animation: "slideUp 280ms ease-out" }}>
        <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "#F0F0F2", borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color={C.text2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontSize: 16, padding: "12px 14px",
  borderRadius: 12, border: `1.5px solid ${C.divider}`, outline: "none", background: C.bg,
};

function PressureSheet({ pending, onClose, onSave }: any) {
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [note, setNote] = useState("");
  const ok = +sys > 0 && +dia > 0;
  return (
    <SheetShell title="Registrar pressão" onClose={onClose}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>Sistólica</span>
          <input inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="120" style={inp} autoFocus />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>Diastólica</span>
          <input inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="80" style={inp} />
        </label>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação (opcional)" style={{ ...inp, marginBottom: 16 }} />
      <PrimaryButton disabled={!ok || pending} onClick={() => onSave(+sys, +dia, note || null)}>
        {pending ? <Spinner /> : "Salvar"}
      </PrimaryButton>
    </SheetShell>
  );
}

function CholesterolSheet({ pending, onClose, onSave }: any) {
  const [total, setTotal] = useState("");
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [tg, setTg] = useState("");
  const ok = +total > 0;
  return (
    <SheetShell title="Registrar colesterol" onClose={onClose}>
      <p style={{ fontSize: 12.5, color: C.text2, margin: "0 0 14px", lineHeight: 1.5 }}>
        Copie do seu exame de sangue. Total é obrigatório; o resto ajuda no acompanhamento.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <label>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>Colesterol total (mg/dL)</span>
          <input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="190" style={inp} autoFocus />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>LDL</span>
            <input inputMode="numeric" value={ldl} onChange={(e) => setLdl(e.target.value)} placeholder="100" style={inp} />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>HDL</span>
            <input inputMode="numeric" value={hdl} onChange={(e) => setHdl(e.target.value)} placeholder="50" style={inp} />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>Triglic.</span>
            <input inputMode="numeric" value={tg} onChange={(e) => setTg(e.target.value)} placeholder="150" style={inp} />
          </label>
        </div>
      </div>
      <PrimaryButton disabled={!ok || pending}
        onClick={() => onSave(+total, ldl ? +ldl : null, hdl ? +hdl : null, tg ? +tg : null, null)}>
        {pending ? <Spinner /> : "Salvar"}
      </PrimaryButton>
    </SheetShell>
  );
}

function MoodSheet({ pending, onClose, onSave }: any) {
  const [level, setLevel] = useState(0);
  const faces = [
    { v: 1, emoji: "😢", label: "Muito mal" },
    { v: 2, emoji: "😟", label: "Mal" },
    { v: 3, emoji: "😐", label: "Neutro" },
    { v: 4, emoji: "🙂", label: "Bem" },
    { v: 5, emoji: "😄", label: "Ótimo" },
  ];
  return (
    <SheetShell title="Como você está hoje?" onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 18 }}>
        {faces.map((f) => (
          <button key={f.v} onClick={() => setLevel(f.v)} className="press"
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: `2px solid ${level === f.v ? C.insulin : C.divider}`, background: level === f.v ? C.insulin + "1A" : C.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 26 }}>{f.emoji}</span>
            <span style={{ fontSize: 9.5, color: C.text2, fontWeight: 600 }}>{f.label}</span>
          </button>
        ))}
      </div>
      <PrimaryButton disabled={!level || pending} style={{ background: C.insulin }}
        onClick={() => onSave(level, null)}>
        {pending ? <Spinner /> : "Salvar"}
      </PrimaryButton>
    </SheetShell>
  );
}

function TargetsSheet({ pending, profile, onClose, onSave }: any) {
  const [bpSys, setBpSys] = useState(profile?.bp_systolic_target?.toString() ?? "130");
  const [bpDia, setBpDia] = useState(profile?.bp_diastolic_target?.toString() ?? "80");
  const [ldl, setLdl] = useState(profile?.ldl_target?.toString() ?? "100");
  const [total, setTotal] = useState(profile?.total_chol_target?.toString() ?? "190");
  return (
    <SheetShell title="Minhas metas" onClose={onClose}>
      <p style={{ fontSize: 12.5, color: C.text2, margin: "0 0 16px", lineHeight: 1.5 }}>
        Use os valores que seu médico definiu para você. Os indicadores usam essas metas como referência.
      </p>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Pressão-alvo (mmHg)</span>
        <div style={{ display: "flex", gap: 12 }}>
          <input inputMode="numeric" value={bpSys} onChange={(e) => setBpSys(e.target.value)} placeholder="130" style={inp} />
          <input inputMode="numeric" value={bpDia} onChange={(e) => setBpDia(e.target.value)} placeholder="80" style={inp} />
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Colesterol-alvo (mg/dL)</span>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>LDL máx.</span>
            <input inputMode="numeric" value={ldl} onChange={(e) => setLdl(e.target.value)} placeholder="100" style={{ ...inp, marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>Total máx.</span>
            <input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="190" style={{ ...inp, marginTop: 4 }} />
          </label>
        </div>
      </div>
      <PrimaryButton disabled={pending}
        onClick={() => onSave({
          bp_systolic_target: bpSys ? +bpSys : null,
          bp_diastolic_target: bpDia ? +bpDia : null,
          ldl_target: ldl ? +ldl : null,
          total_chol_target: total ? +total : null,
        })}>
        {pending ? <Spinner /> : "Salvar metas"}
      </PrimaryButton>
    </SheetShell>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 104, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "11px 20px", borderRadius: 99, fontSize: 14, fontWeight: 700, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", animation: "toastIn 220ms ease-out" }}>
      {msg}
    </div>
  );
}
