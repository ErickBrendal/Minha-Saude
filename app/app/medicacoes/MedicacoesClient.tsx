"use client";

import { useState, useTransition } from "react";
import { Plus, X, Syringe, Pill, Check } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, fmtTime } from "@/lib/design";
import { addMedication, logMedication } from "../actions";

type Med = {
  id: string;
  name: string;
  kind: string;
  dose_amount: number | null;
  dose_unit: string | null;
  schedule_times: string[];
};
type Log = {
  id: string;
  medication_name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  taken_at: string;
};

const KINDS = [
  { key: "insulin_basal", label: "Insulina basal", unit: "U" },
  { key: "insulin_bolus", label: "Insulina bolus", unit: "U" },
  { key: "oral", label: "Comprimido", unit: "mg" },
  { key: "other", label: "Outro", unit: "mg" },
];

export default function MedicacoesClient({
  medications,
  logs,
}: {
  medications: Med[];
  logs: Log[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logsToday = logs.filter((l) => new Date(l.taken_at) >= today);

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>Medicações</h1>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 15px",
            borderRadius: 999,
            border: "none",
            background: C.brand,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Plus size={17} strokeWidth={2.6} /> Adicionar
        </button>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        MINHAS MEDICAÇÕES
      </h3>
      {medications.length === 0 && (
        <Card style={{ textAlign: "center", padding: 26, color: C.text2, marginBottom: 20 }}>
          Cadastre suas insulinas e medicamentos para registrar as doses com um toque.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        {medications.map((m) => {
          const isInsulin = m.kind.startsWith("insulin");
          const taken = logsToday.filter((l) => l.medication_name === m.name).length;
          return (
            <Card key={m.id} style={{ padding: "13px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: (isInsulin ? C.insulin : C.brand) + "1A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isInsulin ? <Syringe size={18} color={C.insulin} /> : <Pill size={18} color={C.brand} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: C.text2 }}>
                    {m.dose_amount ? `${m.dose_amount} ${m.dose_unit}` : ""}
                    {m.schedule_times?.length ? ` · ${m.schedule_times.join(", ")}` : ""}
                    {taken > 0 ? ` · ${taken}× hoje` : ""}
                  </div>
                </div>
                <button
                  onClick={() =>
                    start(async () => {
                      await logMedication(m.id, m.name, m.dose_amount, m.dose_unit, null);
                      flash(`${m.name} registrada ✓`);
                    })
                  }
                  style={{
                    border: "none",
                    background: C.brand,
                    color: "#fff",
                    borderRadius: 10,
                    padding: "9px 14px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Check size={15} /> Registrar
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        HISTÓRICO DE DOSES
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {logs.length === 0 && (
          <Card style={{ textAlign: "center", padding: 22, color: C.text2 }}>
            Nenhuma dose registrada ainda.
          </Card>
        )}
        {logs.slice(0, 30).map((l) => (
          <Card key={l.id} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <Check size={16} color={C.inRange} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{l.medication_name}</span>
              {l.dose_amount && (
                <span style={{ color: C.text2, fontSize: 13 }}>
                  {" "}
                  · {l.dose_amount} {l.dose_unit}
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: C.text2, ...NUM }}>
              {new Date(l.taken_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
              {fmtTime(new Date(l.taken_at))}
            </span>
          </Card>
        ))}
      </div>

      {addOpen && (
        <AddMedSheet
          pending={pending}
          onClose={() => setAddOpen(false)}
          onSave={(name, kind, dose, unit, times) =>
            start(async () => {
              await addMedication(name, kind, dose, unit, times);
              setAddOpen(false);
              flash("Medicação cadastrada ✓");
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

function AddMedSheet({
  pending,
  onClose,
  onSave,
}: {
  pending: boolean;
  onClose: () => void;
  onSave: (name: string, kind: string, dose: number | null, unit: string, times: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState("");

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
          boxShadow: "0 -8px 40px rgba(0,0,0,.18)",
          animation: "slideUp 280ms ease-out",
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Nova medicação</h2>
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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome (ex.: Lantus, Novorapid, Metformina)"
            style={inputStyle}
            autoFocus
          />
          <div style={{ display: "flex", gap: 7, overflowX: "auto" }}>
            {KINDS.map((k) => (
              <Chip key={k.key} active={kind.key === k.key} onClick={() => setKind(k)} color={k.key.startsWith("insulin") ? C.insulin : C.brand}>
                {k.label}
              </Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder={`Dose (${kind.unit})`}
              inputMode="decimal"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              value={times}
              onChange={(e) => setTimes(e.target.value)}
              placeholder="Horários (07:00, 22:00)"
              style={{ ...inputStyle, flex: 1.4 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryButton
            disabled={!name.trim() || pending}
            onClick={() =>
              onSave(
                name.trim(),
                kind.key,
                dose ? +dose : null,
                kind.unit,
                times
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
          >
            {pending ? <Spinner /> : "Cadastrar"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
