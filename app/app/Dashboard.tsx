"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Droplet, Syringe, UtensilsCrossed, Activity, CalendarClock,
  ArrowUpRight, ArrowDownRight, ArrowRight, Lightbulb, ChevronRight,
} from "lucide-react";
import { Card, TIRRing } from "@/components/ui";
import {
  C, NUM, glucoseColor, glucoseLabel, fmtAgo, mean,
} from "@/lib/design";

type Glucose = { id: string; value: number; context: any; measured_at: string };
type Profile = { full_name: string; glucose_target_low: number; glucose_target_high: number };

export default function Dashboard({
  profile,
  glucose,
  medLogsToday,
  mealsToday,
  activitiesToday,
  nextAppt,
}: {
  profile: Profile | null;
  glucose: Glucose[];
  medLogsToday: any[];
  mealsToday: any[];
  activitiesToday: any[];
  nextAppt: any | null;
  email: string;
}) {
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;
  const firstName = (profile?.full_name || "").split(" ")[0] || "você";

  const last = glucose[0];
  const prev = glucose[1];

  const today = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    return glucose.filter((g) => new Date(g.measured_at) >= s);
  }, [glucose]);

  const todayVals = today.map((g) => g.value);
  const tir = todayVals.length
    ? Math.round((todayVals.filter((v) => v >= low && v <= high).length / todayVals.length) * 100)
    : 0;

  const insulinToday = medLogsToday
    .filter((m) => (m.dose_unit || "").toUpperCase() === "U")
    .reduce((s, m) => s + (m.dose_amount || 0), 0);
  const caloriesToday = mealsToday.reduce((s, m) => s + (m.calories_kcal || 0), 0);
  const activeMin = activitiesToday.reduce((s, a) => s + (a.duration_min || 0), 0);

  const insight = useMemo(() => {
    const post = glucose
      .filter((g) => g.context?.timing === "Pós-refeição")
      .map((g) => g.value);
    const fast = glucose
      .filter((g) => g.context?.timing === "Jejum")
      .map((g) => g.value);
    if (post.length >= 5 && mean(post) > high)
      return `Suas glicemias pós-refeição estão em média ${Math.round(
        mean(post)
      )} mg/dL — acima do seu alvo. Vale observar as refeições com mais carboidratos.`;
    if (fast.length >= 5 && mean(fast) <= high)
      return `Suas glicemias de jejum estão estáveis: média de ${Math.round(
        mean(fast)
      )} mg/dL. Bom trabalho!`;
    if (glucose.length > 0 && glucose.length < 5)
      return "Continue registrando — em poucos dias eu já consigo te mostrar padrões.";
    return null;
  }, [glucose, high]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>
          {new Date()
            .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
            .replace(/^./, (c) => c.toUpperCase())}
        </div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>
          {greeting}, {firstName}
        </h1>
      </div>

      {/* HERO GLICÊMICO */}
      <Link href="/app/glicemia" style={{ textDecoration: "none", color: "inherit" }}>
        <Card style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Droplet size={14} color={C.brand} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.brand, letterSpacing: 0.6 }}>
                  GLICEMIA
                </span>
              </div>
              {last ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 52,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: -1.5,
                        color: glucoseColor(last.value, low, high),
                        ...NUM,
                      }}
                    >
                      {last.value}
                    </span>
                    <span style={{ fontSize: 14, color: C.text2, fontWeight: 600 }}>mg/dL</span>
                    {prev &&
                      (last.value - prev.value > 15 ? (
                        <ArrowUpRight size={22} color={C.warnHigh} />
                      ) : prev.value - last.value > 15 ? (
                        <ArrowDownRight size={22} color={C.water} />
                      ) : (
                        <ArrowRight size={22} color={C.text2} />
                      ))}
                  </div>
                  <div style={{ fontSize: 13, color: C.text2, marginTop: 6 }}>
                    <span
                      style={{ color: glucoseColor(last.value, low, high), fontWeight: 700 }}
                    >
                      {glucoseLabel(last.value, low, high)}
                    </span>
                    {" · "}
                    {fmtAgo(new Date(last.measured_at))}
                  </div>
                </>
              ) : (
                <div style={{ color: C.text2, padding: "8px 0" }}>
                  Toque para registrar sua primeira glicemia
                </div>
              )}
            </div>
            {todayVals.length > 0 && <TIRRing pct={tir} />}
          </div>
        </Card>
      </Link>

      {insight && (
        <Card style={{ marginBottom: 14, background: C.brandSoft, border: "1px solid #CDE6E6" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Lightbulb size={18} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.brand,
                  marginBottom: 3,
                  letterSpacing: 0.4,
                }}
              >
                INSIGHT
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.45 }}>{insight}</div>
            </div>
          </div>
        </Card>
      )}

      {/* GRADE DE MÉTRICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <MetricLink href="/app/medicacoes" icon={Syringe} color={C.insulin} label="Insulina hoje" value={insulinToday} unit="U" />
        <MetricLink href="/app/alimentacao" icon={UtensilsCrossed} color={C.food} label="Calorias" value={Math.round(caloriesToday)} unit="kcal" />
        <MetricLink href="/app/exercicios" icon={Activity} color={C.activity} label="Atividade" value={activeMin} unit="min" />
        <MetricLink href="/app/medicacoes" icon={Droplet} color={C.brand} label="Medições hoje" value={today.length} unit="" />
      </div>

      {/* PRÓXIMA CONSULTA */}
      <Link href="/app/consultas" style={{ textDecoration: "none", color: "inherit" }}>
        <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: C.brand + "1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CalendarClock size={19} color={C.brand} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {nextAppt ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                  {nextAppt.doctor_name || "Consulta"}
                  {nextAppt.specialty ? ` · ${nextAppt.specialty}` : ""}
                </div>
                <div style={{ fontSize: 12.5, color: C.text2 }}>
                  {new Date(nextAppt.appointment_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>Consultas e receitas</div>
                <div style={{ fontSize: 12.5, color: C.text2 }}>
                  Nenhuma consulta agendada
                </div>
              </>
            )}
          </div>
          <ChevronRight size={18} color={C.text2} />
        </Card>
      </Link>

      <p
        style={{
          fontSize: 11.5,
          color: C.text2,
          textAlign: "center",
          lineHeight: 1.5,
          margin: "8px 12px 0",
        }}
      >
        O Minha Saúde organiza seus dados, mas não substitui orientação médica.
        Decisões sobre doses devem ser tomadas com seu profissional de saúde.
      </p>
    </div>
  );
}

function MetricLink({
  href,
  icon: Icon,
  color,
  label,
  value,
  unit,
}: {
  href: string;
  icon: any;
  color: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Card style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              background: color + "1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color={color} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text2 }}>{label}</span>
        </div>
        <span style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.5, ...NUM }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}> {unit}</span>}
      </Card>
    </Link>
  );
}
