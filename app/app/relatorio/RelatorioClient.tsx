"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, FileDown, Sheet, Droplet, Syringe, TrendingUp, GitCompare } from "lucide-react";
import Link from "next/link";
import { Card, Chip } from "@/components/ui";
import { C, NUM, mean, sd, gmi } from "@/lib/design";

const DAY = 864e5;
function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfDay(s: string) {
  return new Date(s + "T00:00:00");
}
function endOfDay(s: string) {
  return new Date(s + "T23:59:59");
}

function computeStats(
  glucose: any[], medications: any[], medLogs: any[], weightLogs: any[], activities: any[],
  from: Date, to: Date, low: number, high: number
) {
  const inWin = (ts: string) => {
    const t = new Date(ts).getTime();
    return t >= from.getTime() && t <= to.getTime();
  };
  const g = glucose.filter((x) => inWin(x.measured_at));
  const logs = medLogs.filter((x) => inWin(x.taken_at));
  const weights = weightLogs.filter((x) => inWin(x.measured_at)).sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );
  const acts = activities.filter((x) => inWin(x.performed_at));

  const vals = g.map((x: any) => x.value);
  const n = vals.length;
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY));

  let glucoseStats: any = null;
  if (n) {
    const avg = mean(vals);
    const inRange = vals.filter((v: number) => v >= low && v <= high).length;
    const below = vals.filter((v: number) => v < low).length;
    const above = vals.filter((v: number) => v > high).length;
    const desvio = sd(vals);
    glucoseStats = {
      n,
      avg: Math.round(avg),
      gmiVal: gmi(avg),
      tir: Math.round((inRange / n) * 100),
      tbr: Math.round((below / n) * 100),
      tar: Math.round((above / n) * 100),
      veryLow: vals.filter((v: number) => v < 54).length,
      veryHigh: vals.filter((v: number) => v > 250).length,
      cv: Math.round((desvio / avg) * 100),
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }

  const expectedPerDay = medications.reduce(
    (s: number, m: any) => s + Math.max(1, (m.schedule_times || []).length), 0
  );
  const expected = expectedPerDay * days;
  const adherence = expected > 0 ? Math.min(100, Math.round((logs.length / expected) * 100)) : null;

  const weightChange = weights.length >= 2
    ? +(weights[weights.length - 1].weight_kg - weights[0].weight_kg).toFixed(1)
    : null;
  const totalActivity = acts.reduce((s: number, a: any) => s + (a.duration_min || 0), 0);

  return { glucose: glucoseStats, adherence, dosesTaken: logs.length, weightChange, totalActivity, days, glucoseRows: g };
}

const PRESETS = [
  { key: 7, label: "7 dias" },
  { key: 14, label: "14 dias" },
  { key: 30, label: "30 dias" },
  { key: 90, label: "90 dias" },
];

export default function RelatorioClient({
  profile, glucose, medications, medLogs, weightLogs, activities,
}: any) {
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const printRef = useRef<HTMLDivElement>(null);

  const today = isoDay(new Date());
  const [preset, setPreset] = useState<number | "custom">(30);
  const [customFrom, setCustomFrom] = useState(isoDay(new Date(Date.now() - 30 * DAY)));
  const [customTo, setCustomTo] = useState(today);
  const [compare, setCompare] = useState(false);

  const { from, to } = useMemo(() => {
    if (preset === "custom") return { from: startOfDay(customFrom), to: endOfDay(customTo) };
    return { from: startOfDay(isoDay(new Date(Date.now() - preset * DAY))), to: endOfDay(today) };
  }, [preset, customFrom, customTo, today]);

  const prevWin = useMemo(() => {
    const span = to.getTime() - from.getTime();
    return { from: new Date(from.getTime() - span - DAY), to: new Date(from.getTime() - 1) };
  }, [from, to]);

  const cur = useMemo(
    () => computeStats(glucose, medications, medLogs, weightLogs, activities, from, to, low, high),
    [glucose, medications, medLogs, weightLogs, activities, from, to, low, high]
  );
  const prev = useMemo(
    () => computeStats(glucose, medications, medLogs, weightLogs, activities, prevWin.from, prevWin.to, low, high),
    [glucose, medications, medLogs, weightLogs, activities, prevWin, low, high]
  );

  const stats = cur.glucose;
  const periodoLabel = `${from.toLocaleDateString("pt-BR")} a ${to.toLocaleDateString("pt-BR")}`;

  function exportarPDF() {
    window.print();
  }

  function exportarCSV() {
    const rows: string[][] = [["Data", "Hora", "Glicemia (mg/dL)", "Momento", "Classificacao"]];
    for (const g of cur.glucoseRows) {
      const d = new Date(g.measured_at);
      const cls = g.value < low ? "Abaixo" : g.value <= high ? "No alvo" : "Acima";
      rows.push([
        d.toLocaleDateString("pt-BR"),
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        String(g.value),
        g.context?.timing || "",
        cls,
      ]);
    }
    if (stats) {
      rows.push([]);
      rows.push(["RESUMO DO PERIODO", periodoLabel]);
      rows.push(["Glicemia media", `${stats.avg} mg/dL`]);
      rows.push(["GMI (HbA1c estimada)", `${stats.gmiVal}%`]);
      rows.push(["Tempo no alvo (TIR)", `${stats.tir}%`]);
      rows.push(["Tempo abaixo (TBR)", `${stats.tbr}%`]);
      rows.push(["Tempo acima (TAR)", `${stats.tar}%`]);
      rows.push(["Variabilidade (CV)", `${stats.cv}%`]);
      rows.push(["Adesao a medicacao", cur.adherence !== null ? `${cur.adherence}%` : "-"]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glicemia-${isoDay(from)}-a-${isoDay(to)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div style={{ padding: "20px 18px" }}>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: #fff; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Link href="/app/perfil" style={{ color: C.text2, display: "flex" }}><ArrowLeft size={22} /></Link>
        <h1 style={{ fontSize: 23, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Relatório médico</h1>
      </div>
      <p className="no-print" style={{ color: C.text2, fontSize: 13.5, margin: "0 0 16px 32px", lineHeight: 1.5 }}>
        Escolha o período, compare com o anterior e exporte em PDF ou planilha (CSV).
      </p>

      <div className="no-print" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {PRESETS.map((p) => (
            <Chip key={p.key} active={preset === p.key} onClick={() => setPreset(p.key)}>{p.label}</Chip>
          ))}
          <Chip active={preset === "custom"} onClick={() => setPreset("custom")}>Personalizado</Chip>
        </div>

        {preset === "custom" && (
          <Card style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>De</span>
                <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} style={dateInput} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: "block", marginBottom: 5 }}>Até</span>
                <input type="date" value={customTo} min={customFrom} max={today} onChange={(e) => setCustomTo(e.target.value)} style={dateInput} />
              </label>
            </div>
          </Card>
        )}

        <button
          onClick={() => setCompare((c) => !c)}
          className="press"
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 12,
            border: `1.5px solid ${compare ? C.brand : C.divider}`,
            background: compare ? C.brandSoft : C.surface, cursor: "pointer",
            fontSize: 13.5, fontWeight: 700, color: compare ? C.brand : C.text2,
          }}
        >
          <GitCompare size={16} /> {compare ? "Comparando com período anterior" : "Comparar com período anterior"}
        </button>
      </div>

      <div ref={printRef}>
        <Card style={{ marginBottom: 14, padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name || "Paciente"}</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>
            Relatório de autocuidado · {periodoLabel}
          </div>
          {compare && (
            <div style={{ fontSize: 12.5, color: C.text2, marginTop: 2 }}>
              Comparado com: {prevWin.from.toLocaleDateString("pt-BR")} a {prevWin.to.toLocaleDateString("pt-BR")}
            </div>
          )}
          <div style={{ fontSize: 12.5, color: C.text2, marginTop: 6, lineHeight: 1.5 }}>
            Meta glicêmica configurada: {low}–{high} mg/dL
          </div>
        </Card>

        {!stats ? (
          <Card style={{ padding: 24, textAlign: "center", color: C.text2 }}>
            Ainda não há registros de glicemia neste período. Tente um intervalo maior.
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 14, padding: 18 }}>
              <SectionTitle icon={Droplet} color={C.brand} title="Controle glicêmico" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <Metric label="Glicemia média" value={`${stats.avg}`} unit="mg/dL"
                  delta={compare && prev.glucose ? stats.avg - prev.glucose.avg : null} betterWhenLower />
                <Metric label="GMI (HbA1c est.)" value={`${stats.gmiVal}`} unit="%"
                  delta={compare && prev.glucose ? +(+stats.gmiVal - +prev.glucose.gmiVal).toFixed(1) : null} betterWhenLower />
                <Metric label="Tempo no alvo (TIR)" value={`${stats.tir}`} unit="%" color={stats.tir >= 70 ? C.inRange : C.warnHigh}
                  delta={compare && prev.glucose ? stats.tir - prev.glucose.tir : null} />
                <Metric label="Variabilidade (CV)" value={`${stats.cv}`} unit="%" color={stats.cv <= 36 ? C.inRange : C.warnHigh}
                  delta={compare && prev.glucose ? stats.cv - prev.glucose.cv : null} betterWhenLower />
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>DISTRIBUIÇÃO</div>
                <div style={{ display: "flex", height: 22, borderRadius: 8, overflow: "hidden" }}>
                  {stats.tbr > 0 && <div style={{ width: `${stats.tbr}%`, background: C.hypo }} />}
                  <div style={{ width: `${stats.tir}%`, background: C.inRange }} />
                  {stats.tar > 0 && <div style={{ width: `${stats.tar}%`, background: C.warnHigh }} />}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5 }}>
                  <span style={{ color: C.hypo, fontWeight: 600 }}>Abaixo {stats.tbr}%</span>
                  <span style={{ color: C.inRange, fontWeight: 600 }}>No alvo {stats.tir}%</span>
                  <span style={{ color: C.warnHigh, fontWeight: 600 }}>Acima {stats.tar}%</span>
                </div>
              </div>

              <div style={{ marginTop: 14, fontSize: 12.5, color: C.text2, lineHeight: 1.6 }}>
                {stats.n} medições · mínima {stats.min} / máxima {stats.max} mg/dL<br />
                Eventos de hipoglicemia grave (&lt;54): <strong>{stats.veryLow}</strong> · hiperglicemia (&gt;250): <strong>{stats.veryHigh}</strong>
              </div>
            </Card>

            <Card style={{ marginBottom: 14, padding: 18 }}>
              <SectionTitle icon={Syringe} color={C.insulin} title="Medicação" />
              <div style={{ marginTop: 12 }}>
                {medications.map((m: any) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5, borderBottom: `1px solid ${C.divider}` }}>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <span style={{ color: C.text2, ...NUM }}>
                      {m.dose_amount}{m.dose_unit} · {(m.schedule_times || []).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
              {cur.adherence !== null && (
                <div style={{ marginTop: 12, fontSize: 13.5 }}>
                  Adesão estimada no período: <strong style={{ color: cur.adherence >= 80 ? C.inRange : C.warnHigh }}>{cur.adherence}%</strong>
                  <span style={{ color: C.text2 }}> ({cur.dosesTaken} doses registradas)</span>
                  {compare && prev.adherence !== null && cur.adherence - prev.adherence !== 0 && (
                    <DeltaInline delta={cur.adherence - prev.adherence} />
                  )}
                </div>
              )}
            </Card>

            <Card style={{ marginBottom: 14, padding: 18 }}>
              <SectionTitle icon={TrendingUp} color="#34C759" title="Outros indicadores" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <Metric label="Variação de peso" value={cur.weightChange !== null ? `${cur.weightChange > 0 ? "+" : ""}${cur.weightChange}` : "—"} unit={cur.weightChange !== null ? "kg" : ""} />
                <Metric label="Atividade física" value={`${cur.totalActivity}`} unit="min"
                  delta={compare ? cur.totalActivity - prev.totalActivity : null} />
              </div>
            </Card>
          </>
        )}

        <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.5, marginTop: 8 }}>
          Relatório gerado automaticamente pelo app Minha Saúde a partir dos registros do próprio paciente.
          Os valores são autorreferidos e podem conter imprecisões. GMI é uma estimativa derivada da glicemia
          média (fórmula ADA) e não substitui o exame laboratorial de HbA1c. Documento de apoio à consulta,
          sem valor diagnóstico.
        </p>
      </div>

      {stats && (
        <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={exportarPDF}
            className="press"
            style={{
              flex: 1, padding: 14, borderRadius: 14, border: "none",
              background: C.brand, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <FileDown size={18} /> PDF
          </button>
          <button
            onClick={exportarCSV}
            className="press"
            style={{
              flex: 1, padding: 14, borderRadius: 14, border: `1.5px solid ${C.brand}`,
              background: C.surface, color: C.brand, fontWeight: 700, fontSize: 14.5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Sheet size={18} /> Planilha CSV
          </button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, color, title }: { icon: any; color: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span>
    </div>
  );
}

function Metric({
  label, value, unit, color = C.text, delta = null, betterWhenLower = false,
}: {
  label: string; value: string; unit: string; color?: string;
  delta?: number | null; betterWhenLower?: boolean;
}) {
  return (
    <div style={{ background: C.bg, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <span style={{ fontSize: 24, fontWeight: 800, color, ...NUM }}>{value}</span>
      <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}> {unit}</span>
      {delta !== null && delta !== 0 && <DeltaInline delta={delta} betterWhenLower={betterWhenLower} />}
      {delta === 0 && <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginTop: 2 }}>sem mudança</div>}
    </div>
  );
}

function DeltaInline({ delta, betterWhenLower = false }: { delta: number; betterWhenLower?: boolean }) {
  const improved = betterWhenLower ? delta < 0 : delta > 0;
  const color = improved ? C.inRange : C.warnHigh;
  const sign = delta > 0 ? "+" : "";
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color, marginTop: 2, ...NUM }}>
      {sign}{delta} vs anterior
    </div>
  );
}

const dateInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontSize: 15, padding: "10px 12px",
  borderRadius: 10, border: `1.5px solid ${C.divider}`, outline: "none", background: C.bg,
  fontFamily: "inherit",
};
