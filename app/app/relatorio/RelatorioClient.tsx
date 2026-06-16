"use client";

import { useMemo, useRef } from "react";
import { ArrowLeft, FileDown, Activity, Droplet, Syringe, Scale, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { C, NUM, mean, sd, gmi } from "@/lib/design";

export default function RelatorioClient({
  profile, glucose, medications, medLogs, weightLogs, activities,
}: any) {
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const printRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const vals = glucose.map((g: any) => g.value);
    const n = vals.length;
    if (!n) return null;
    const avg = mean(vals);
    const inRange = vals.filter((v: number) => v >= low && v <= high).length;
    const below = vals.filter((v: number) => v < low).length;
    const above = vals.filter((v: number) => v > high).length;
    const veryLow = vals.filter((v: number) => v < 54).length;
    const veryHigh = vals.filter((v: number) => v > 250).length;
    const desvio = sd(vals);
    return {
      n,
      avg: Math.round(avg),
      gmiVal: gmi(avg),
      tir: Math.round((inRange / n) * 100),
      tbr: Math.round((below / n) * 100),
      tar: Math.round((above / n) * 100),
      veryLow, veryHigh,
      cv: Math.round((desvio / avg) * 100),
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [glucose, low, high]);

  // Adesão: doses registradas vs esperadas em 30 dias
  const adherence = useMemo(() => {
    const expectedPerDay = medications.reduce(
      (s: number, m: any) => s + Math.max(1, (m.schedule_times || []).length), 0
    );
    const expected = expectedPerDay * 30;
    const taken = medLogs.length;
    return expected > 0 ? Math.min(100, Math.round((taken / expected) * 100)) : null;
  }, [medications, medLogs]);

  const weightChange = weightLogs.length >= 2
    ? +(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)
    : null;
  const totalActivity = activities.reduce((s: number, a: any) => s + (a.duration_min || 0), 0);

  function exportar() {
    window.print();
  }

  const periodo = `${new Date(Date.now() - 30 * 864e5).toLocaleDateString("pt-BR")} a ${new Date().toLocaleDateString("pt-BR")}`;

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
        Resumo dos últimos 30 dias para levar à consulta. Toque em exportar para gerar PDF ou imprimir.
      </p>

      <div ref={printRef}>
        {/* Cabeçalho do relatório */}
        <Card style={{ marginBottom: 14, padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name || "Paciente"}</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>
            Relatório de autocuidado · {periodo}
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, marginTop: 6, lineHeight: 1.5 }}>
            Meta glicêmica configurada: {low}–{high} mg/dL
          </div>
        </Card>

        {!stats ? (
          <Card style={{ padding: 24, textAlign: "center", color: C.text2 }}>
            Ainda não há registros de glicemia suficientes neste período.
          </Card>
        ) : (
          <>
            {/* Métricas glicêmicas principais */}
            <Card style={{ marginBottom: 14, padding: 18 }}>
              <SectionTitle icon={Droplet} color={C.brand} title="Controle glicêmico" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <Metric label="Glicemia média" value={`${stats.avg}`} unit="mg/dL" />
                <Metric label="GMI (HbA1c estimada)" value={`${stats.gmiVal}`} unit="%" />
                <Metric label="Tempo no alvo (TIR)" value={`${stats.tir}`} unit="%" color={stats.tir >= 70 ? C.inRange : C.warnHigh} />
                <Metric label="Variabilidade (CV)" value={`${stats.cv}`} unit="%" color={stats.cv <= 36 ? C.inRange : C.warnHigh} />
              </div>

              {/* Barra TIR */}
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

            {/* Adesão à medicação */}
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
              {adherence !== null && (
                <div style={{ marginTop: 12, fontSize: 13.5 }}>
                  Adesão estimada no período: <strong style={{ color: adherence >= 80 ? C.inRange : C.warnHigh }}>{adherence}%</strong>
                  <span style={{ color: C.text2 }}> ({medLogs.length} doses registradas)</span>
                </div>
              )}
            </Card>

            {/* Outros indicadores */}
            <Card style={{ marginBottom: 14, padding: 18 }}>
              <SectionTitle icon={TrendingUp} color="#34C759" title="Outros indicadores" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <Metric label="Variação de peso" value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}` : "—"} unit={weightChange !== null ? "kg" : ""} />
                <Metric label="Atividade física" value={`${totalActivity}`} unit="min" />
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
        <button
          onClick={exportar}
          className="no-print press"
          style={{
            width: "100%", marginTop: 16, padding: 14, borderRadius: 14, border: "none",
            background: C.brand, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <FileDown size={18} /> Exportar / Imprimir PDF
        </button>
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

function Metric({ label, value, unit, color = C.text }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <span style={{ fontSize: 24, fontWeight: 800, color, ...NUM }}>{value}</span>
      <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}> {unit}</span>
    </div>
  );
}
