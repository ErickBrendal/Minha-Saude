"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus, X, Trash2, Activity as ActIcon } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtTime } from "@/lib/design";
import { addActivity, deleteActivity } from "./actions";

type Act = {
  id: string;
  type: string;
  duration_min: number | null;
  intensity: string | null;
  calories_kcal: number | null;
  performed_at: string;
};

const TYPES = ["Caminhada", "Corrida", "Musculação", "Ciclismo", "Natação", "Yoga", "Outro"];
const INTENSITIES = ["Leve", "Moderada", "Intensa"];
const WEEKLY_GOAL = 150; // minutos (recomendação OMS)

export default function ExerciciosClient({ activities }: { activities: Act[] }) {
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  const weekMinutes = useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() - 7);
    return activities
      .filter((a) => new Date(a.performed_at) >= cut)
      .reduce((s, a) => s + (a.duration_min || 0), 0);
  }, [activities]);

  const goalPct = Math.min(100, Math.round((weekMinutes / WEEKLY_GOAL) * 100));

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>Exercícios</h1>
        <button
          onClick={() => setSheet(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 15px",
            borderRadius: 999,
            border: "none",
            background: C.activity,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Plus size={17} strokeWidth={2.6} /> Registrar
        </button>
      </div>

      {/* META SEMANAL */}
      <Card style={{ marginBottom: 18, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Meta da semana</span>
          <span style={{ fontSize: 13, color: C.text2, ...NUM }}>
            {weekMinutes} / {WEEKLY_GOAL} min
          </span>
        </div>
        <div style={{ height: 12, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div
            style={{
              width: `${goalPct}%`,
              height: "100%",
              background: C.activity,
              borderRadius: 99,
              transition: "width 600ms ease-out",
            }}
          />
        </div>
        <div style={{ fontSize: 12.5, color: C.text2, marginTop: 8 }}>
          {goalPct >= 100
            ? "Meta atingida! Excelente trabalho 💪"
            : `Faltam ${WEEKLY_GOAL - weekMinutes} min para a meta da OMS de atividade semanal.`}
        </div>
      </Card>

      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>Histórico</h3>
      {activities.length === 0 && (
        <Card style={{ textAlign: "center", padding: 26, color: C.text2 }}>
          Nenhuma atividade registrada ainda.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activities.map((a) => (
          <Card key={a.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: C.activity + "1A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ActIcon size={17} color={C.activity} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{a.type}</div>
              <div style={{ fontSize: 12.5, color: C.text2 }}>
                {a.duration_min} min
                {a.intensity ? ` · ${a.intensity}` : ""}
                {a.calories_kcal ? ` · ${Math.round(a.calories_kcal)} kcal` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: C.text2, ...NUM }}>
              {new Date(a.performed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              <br />
              {fmtTime(new Date(a.performed_at))}
            </div>
            <button
              onClick={() => start(async () => { await deleteActivity(a.id); flash("Atividade removida"); })}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
            >
              <Trash2 size={15} color="#C4C4C8" />
            </button>
          </Card>
        ))}
      </div>

      {sheet && (
        <AddSheet
          pending={pending}
          onClose={() => setSheet(false)}
          onSave={(type, dur, inten, cal) =>
            start(async () => {
              await addActivity(type, dur, inten, cal);
              setSheet(false);
              flash("Atividade registrada ✓");
            })
          }
        />
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

function AddSheet({
  pending,
  onClose,
  onSave,
}: {
  pending: boolean;
  onClose: () => void;
  onSave: (type: string, dur: number, inten: string, cal: number | null) => void;
}) {
  const [type, setType] = useState(TYPES[0]);
  const [dur, setDur] = useState("");
  const [inten, setInten] = useState("Moderada");
  const [cal, setCal] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    fontSize: 16,
    padding: "12px 14px",
    borderRadius: 12,
    border: `1.5px solid ${C.divider}`,
    outline: "none",
    background: C.bg,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          width: "100%",
          maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          padding: "12px 20px 28px",
          animation: "slideUp 280ms ease-out",
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Registrar atividade</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#F0F0F2",
              borderRadius: 99,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color={C.text2} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 7, overflowX: "auto" }}>
            {TYPES.map((t) => (
              <Chip key={t} active={type === t} onClick={() => setType(t)} color={C.activity}>
                {t}
              </Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="Duração (min)" inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
            <input value={cal} onChange={(e) => setCal(e.target.value)} placeholder="Calorias (opc.)" inputMode="numeric" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {INTENSITIES.map((it) => (
              <Chip key={it} active={inten === it} onClick={() => setInten(it)} color={C.activity}>
                {it}
              </Chip>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton
            disabled={!dur || pending}
            style={{ background: C.activity }}
            onClick={() => onSave(type, +dur, inten, cal ? +cal : null)}
          >
            {pending ? <Spinner /> : "Salvar"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
