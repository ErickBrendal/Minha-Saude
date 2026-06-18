"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Droplet, Syringe, UtensilsCrossed, Activity, CalendarClock, Scale,
  ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles, ChevronRight,
  Target, Trophy, Check, Flame, Gauge as GaugeIcon,
} from "lucide-react";
import {
  Card, GoalRing, MissionBar, StreakChip, AnimatedStat,
} from "@/components/ui";
import { C, NUM, glucoseColor, glucoseLabel, fmtAgo, mean } from "@/lib/design";
import { goalConfig } from "@/lib/goals";
import {
  computeDailyTasks, dailyProgress, streakMessage, levelFromPoints,
} from "@/lib/gamification";

export default function Dashboard({
  profile,
  gamification,
  glucose,
  glucoseToday,
  medLogsToday,
  mealsToday,
  activitiesToday,
  weightLogs,
  weightTodayCount,
  nextAppt,
  latestInsight,
}: any) {
  const goal = goalConfig(profile?.primary_goal);
  const hasGoal = !!profile?.primary_goal;
  const firstName = (profile?.full_name || "").split(" ")[0] || "você";
  const low = profile?.glucose_target_low ?? 70;
  const high = profile?.glucose_target_high ?? 180;

  const streak = gamification?.current_streak ?? 0;
  const points = gamification?.total_points ?? 0;
  const level = levelFromPoints(points);

  // Missões do dia
  const tasks = computeDailyTasks({
    glucoseToday: glucoseToday.length,
    medLogsToday: medLogsToday.length,
    mealsToday: mealsToday.length,
    activityToday: activitiesToday.length,
    weightToday: weightTodayCount,
  });
  const prog = dailyProgress(tasks);

  // Métricas
  const last = glucose[0];
  const prev = glucose[1];
  const todayVals = glucoseToday.map((g: any) => g.value);
  const tir = todayVals.length
    ? Math.round((todayVals.filter((v: number) => v >= low && v <= high).length / todayVals.length) * 100)
    : 0;
  const insulinToday = medLogsToday
    .filter((m: any) => (m.dose_unit || "").toUpperCase() === "U")
    .reduce((s: number, m: any) => s + (m.dose_amount || 0), 0);
  const caloriesToday = mealsToday.reduce((s: number, m: any) => s + (m.calories_kcal || 0), 0);
  const carbsToday = mealsToday.reduce((s: number, m: any) => s + (m.carbs_g || 0), 0);
  const activeMin = activitiesToday.reduce((s: number, a: any) => s + (a.duration_min || 0), 0);
  const curWeight = weightLogs[0]?.weight_kg ?? profile?.weight_kg;
  const calTarget = profile?.daily_calorie_target;

  // Evolução de peso
  const weightTrend = useMemo(() => {
    if (weightLogs.length < 2) return null;
    const newest = weightLogs[0].weight_kg;
    const oldest = weightLogs[weightLogs.length - 1].weight_kg;
    return +(newest - oldest).toFixed(1);
  }, [weightLogs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ padding: "20px 18px" }}>
      {/* Cabeçalho com streak */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>
            {new Date()
              .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
              .replace(/^./, (c) => c.toUpperCase())}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>
            {greeting}, {firstName}
          </h1>
        </div>
        <StreakChip streak={streak} />
      </div>

      <div className="stagger">
        {/* HERO: objetivo + missões diárias (signature) */}
        {hasGoal ? (
          <Card style={{ marginBottom: 14, padding: 18, background: `linear-gradient(135deg, ${goal.colorSoft}, ${C.surface})`, border: `1px solid ${goal.color}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <GoalRing
                pct={prog.pct}
                color={goal.color}
                emoji={goal.emoji}
                label={`${prog.done}/${prog.total}`}
                sublabel="MISSÕES"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href="/app/objetivos" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: goal.color, letterSpacing: 0.5 }}>
                      {goal.label.toUpperCase()}
                    </span>
                    <ChevronRight size={13} color={goal.color} />
                  </div>
                </Link>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.35, marginBottom: 10 }}>
                  {streakMessage(streak, prog.pct)}
                </div>
                <MissionBar pct={prog.pct} color={goal.color} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                  <span style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>
                    +{prog.pointsEarned} pts hoje
                  </span>
                  <span style={{ fontSize: 11.5, color: goal.color, fontWeight: 700 }}>
                    Nível {level.level} · {level.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist de missões */}
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {tasks.map((t) => (
                <div
                  key={t.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: t.done ? goal.color : "#F0F0F2",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: t.done ? "#fff" : C.text2,
                    transition: "all 200ms ease",
                  }}
                >
                  {t.done && <Check size={11} strokeWidth={3} />}
                  {t.label}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          /* Sem objetivo: CTA forte para escolher */
          <Link href="/app/objetivos" style={{ textDecoration: "none", color: "inherit" }}>
            <Card
              className="press"
              style={{
                marginBottom: 14,
                padding: 22,
                background: `linear-gradient(135deg, ${C.brand}, #0A5E5D)`,
                border: "none",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Target size={26} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Defina seu objetivo</div>
                  <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", marginTop: 2, lineHeight: 1.4 }}>
                    Diabetes, emagrecer, dieta… O app se molda à sua meta.
                  </div>
                </div>
                <ChevronRight size={22} color="#fff" />
              </div>
            </Card>
          </Link>
        )}

        {/* INSIGHT DA IA (especialista) */}
        <Link href="/app/especialista" style={{ textDecoration: "none", color: "inherit" }}>
          <Card className="press" style={{ marginBottom: 14, background: "#F5F3FF", border: "1px solid #E4DEFF", cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: "#5856D6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#5856D6", letterSpacing: 0.4, marginBottom: 2 }}>
                  ESPECIALISTA IA {latestInsight?.source_guideline ? `· ${latestInsight.source_guideline}` : ""}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.45, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {latestInsight?.content ||
                    `Toque para receber orientações personalizadas sobre ${goal.label.toLowerCase()}, baseadas em diretrizes ${goal.guidelines.join(" e ")}.`}
                </div>
                <div style={{ fontSize: 12, color: "#5856D6", fontWeight: 700, marginTop: 6 }}>
                  Ver dicas do dia →
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* INDICADORES — acompanhamento e velocímetros */}
        <Link href="/app/indicadores" style={{ textDecoration: "none", color: "inherit" }}>
          <Card className="press" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.brand + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GaugeIcon size={19} color={C.brand} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Meus indicadores</div>
              <div style={{ fontSize: 12.5, color: C.text2 }}>Acompanhe seus números frente às metas</div>
            </div>
            <ChevronRight size={18} color={C.text2} />
          </Card>
        </Link>

        {/* ASSISTENTE — chat de dúvidas */}
        <Link href="/app/assistente" style={{ textDecoration: "none", color: "inherit" }}>          <Card className="press" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#5856D61A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={19} color="#5856D6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Tire uma dúvida</div>
              <div style={{ fontSize: 12.5, color: C.text2 }}>Pergunte sobre dieta, remédios, insulina…</div>
            </div>
            <ChevronRight size={18} color={C.text2} />
          </Card>
        </Link>

        {/* GLICEMIA (se diabetes ou tem registros) */}
        {(goal.kind === "diabetes" || glucose.length > 0) && (
          <Link href="/app/glicemia" style={{ textDecoration: "none", color: "inherit" }}>
            <Card className="press" style={{ marginBottom: 12, padding: 18, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Droplet size={14} color={C.brand} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: C.brand, letterSpacing: 0.5 }}>GLICEMIA</span>
                  </div>
                  {last ? (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                        <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: -1.5, color: glucoseColor(last.value, low, high), ...NUM }}>
                          {last.value}
                        </span>
                        <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>mg/dL</span>
                        {prev && (last.value - prev.value > 15 ? <ArrowUpRight size={20} color={C.warnHigh} /> : prev.value - last.value > 15 ? <ArrowDownRight size={20} color={C.water} /> : <ArrowRight size={20} color={C.text2} />)}
                      </div>
                      <div style={{ fontSize: 12.5, marginTop: 5 }}>
                        <span style={{ color: glucoseColor(last.value, low, high), fontWeight: 700 }}>
                          {glucoseLabel(last.value, low, high)}
                        </span>
                        <span style={{ color: C.text2 }}> · {fmtAgo(new Date(last.measured_at))}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: C.text2, padding: "8px 0", fontSize: 14 }}>Toque para registrar</div>
                  )}
                </div>
                {todayVals.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: tir >= 70 ? C.inRange : C.warnHigh, ...NUM }}>{tir}%</div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: 0.3 }}>NO ALVO</div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        )}

        {/* GRADE DE MÉTRICAS adaptada ao objetivo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 12 }}>
          {goal.primaryMetrics.includes("weight") && (
            <MetricCard href="/app/perfil" icon={Scale} color={goal.color} label="Peso atual"
              value={curWeight ? `${curWeight}` : "—"} unit={curWeight ? "kg" : ""}
              trend={weightTrend !== null ? `${weightTrend > 0 ? "+" : ""}${weightTrend} kg` : undefined}
              trendGood={goal.kind === "emagrecer" ? (weightTrend ?? 0) < 0 : (weightTrend ?? 0) > 0} />
          )}
          {(goal.primaryMetrics.includes("calories")) && (
            <MetricCard href="/app/alimentacao" icon={UtensilsCrossed} color={C.food} label="Calorias hoje"
              value={`${Math.round(caloriesToday)}`} unit={calTarget ? `/${calTarget}` : "kcal"} />
          )}
          {goal.primaryMetrics.includes("carbs") && (
            <MetricCard href="/app/alimentacao" icon={UtensilsCrossed} color={C.food} label="Carboidratos"
              value={`${Math.round(carbsToday)}`} unit="g" />
          )}
          {goal.primaryMetrics.includes("adherence") && (
            <MetricCard href="/app/medicacoes" icon={Syringe} color={C.insulin} label="Insulina hoje"
              value={`${insulinToday}`} unit="U" />
          )}
          {goal.primaryMetrics.includes("activity") && (
            <MetricCard href="/app/exercicios" icon={Activity} color={C.activity} label="Atividade"
              value={`${activeMin}`} unit="min" />
          )}
          {/* Garante mínimo de 2 cards */}
          {goal.primaryMetrics.length < 2 && (
            <MetricCard href="/app/exercicios" icon={Activity} color={C.activity} label="Atividade"
              value={`${activeMin}`} unit="min" />
          )}
        </div>

        {/* PRÓXIMA CONSULTA */}
        <Link href="/app/consultas" style={{ textDecoration: "none", color: "inherit" }}>
          <Card className="press" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.brand + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CalendarClock size={19} color={C.brand} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {nextAppt ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                    {nextAppt.doctor_name || "Consulta"}{nextAppt.specialty ? ` · ${nextAppt.specialty}` : ""}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.text2 }}>
                    {new Date(nextAppt.appointment_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>Consultas e receitas</div>
                  <div style={{ fontSize: 12.5, color: C.text2 }}>Nenhuma consulta agendada</div>
                </>
              )}
            </div>
            <ChevronRight size={18} color={C.text2} />
          </Card>
        </Link>

        {/* CENTRAL DE DOCUMENTOS */}
        <Link href="/app/documentos" style={{ textDecoration: "none", color: "inherit" }}>
          <Card className="press" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#5856D61A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={19} color="#5856D6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Enviar documento</div>
              <div style={{ fontSize: 12.5, color: C.text2 }}>Receitas, exames e orientações — a IA organiza</div>
            </div>
            <ChevronRight size={18} color={C.text2} />
          </Card>
        </Link>

        {/* Nível / pontos */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#FFF4E6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={19} color="#E8800A" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Nível {level.level} · {level.name}</span>
                <span style={{ fontSize: 12.5, color: C.text2, fontWeight: 600, ...NUM }}>{points} pts</span>
              </div>
              <MissionBar pct={level.progressPct} color="#E8800A" />
              {level.toNext > 0 && (
                <div style={{ fontSize: 11.5, color: C.text2, marginTop: 5 }}>
                  Faltam {level.toNext} pts para o próximo nível
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <p style={{ fontSize: 11.5, color: C.text2, textAlign: "center", lineHeight: 1.5, margin: "4px 12px 0" }}>
        O Minha Saúde organiza seus dados e oferece orientações educativas, mas não substitui
        seu médico. Decisões sobre doses e tratamento devem ser tomadas com profissionais de saúde.
      </p>
    </div>
  );
}

function MetricCard({
  href, icon: Icon, color, label, value, unit, trend, trendGood,
}: {
  href: string; icon: any; color: string; label: string;
  value: string; unit: string; trend?: string; trendGood?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Card className="press" style={{ padding: 14, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={15} color={color} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <AnimatedStat value={value} unit={unit} />
          {trend && (
            <span style={{ fontSize: 12, fontWeight: 700, color: trendGood ? C.inRange : C.text2, ...NUM }}>
              {trend}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
