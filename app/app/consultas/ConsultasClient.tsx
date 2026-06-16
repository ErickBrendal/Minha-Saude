"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, X, Stethoscope, Paperclip, Trash2, FileText, CalendarPlus } from "lucide-react";
import { Card, Spinner, PrimaryButton } from "@/components/ui";
import { C, fmtDate } from "@/lib/design";
import { createClient } from "@/lib/supabase-browser";
import { addAppointment, deleteAppointment, uploadAttachment } from "./actions";
import { downloadICS } from "@/lib/calendar";

type Appt = {
  id: string;
  doctor_name: string | null;
  specialty: string | null;
  appointment_date: string;
  summary: string | null;
  diagnosis: string | null;
  location: string | null;
  notes: string | null;
  attachments: { id: string; file_name: string; file_path: string }[];
};

export default function ConsultasClient({ appointments }: { appointments: Appt[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [supabase] = useState(() => createClient());

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

  async function openAttachment(path: string) {
    const { data } = await supabase.storage.from("medical").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.appointment_date) >= now);
  const past = appointments.filter((a) => new Date(a.appointment_date) < now);

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>Consultas</h1>
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
          <Plus size={17} strokeWidth={2.6} /> Nova
        </button>
      </div>

      {appointments.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28, color: C.text2 }}>
          Registre suas consultas e anexe receitas e exames.<br />
          Tudo fica organizado e seguro, só você acessa.
        </Card>
      )}

      {upcoming.length > 0 && (
        <Section title="PRÓXIMAS">
          {upcoming.map((a) => (
            <ApptCard key={a.id} a={a} pending={pending} start={start} flash={flash} openAttachment={openAttachment} />
          ))}
        </Section>
      )}
      {past.length > 0 && (
        <Section title="ANTERIORES">
          {past.map((a) => (
            <ApptCard key={a.id} a={a} pending={pending} start={start} flash={flash} openAttachment={openAttachment} />
          ))}
        </Section>
      )}

      {addOpen && (
        <AddSheet
          pending={pending}
          onClose={() => setAddOpen(false)}
          onSave={(form) =>
            start(async () => {
              await addAppointment(form);
              setAddOpen(false);
              flash("Consulta registrada ✓");
            })
          }
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function ApptCard({
  a,
  pending,
  start,
  flash,
  openAttachment,
}: {
  a: Appt;
  pending: boolean;
  start: (fn: () => Promise<void>) => void;
  flash: (m: string) => void;
  openAttachment: (path: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
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
          <Stethoscope size={18} color={C.brand} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {a.doctor_name || "Consulta"}
            {a.specialty ? ` · ${a.specialty}` : ""}
          </div>
          <div style={{ fontSize: 12.5, color: C.text2 }}>
            {new Date(a.appointment_date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <button
          onClick={() => start(async () => { await deleteAppointment(a.id); flash("Consulta removida"); })}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
        >
          <Trash2 size={15} color="#C4C4C8" />
        </button>
      </div>

      {(a.summary || a.diagnosis) && (
        <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.5, color: C.text }}>
          {a.diagnosis && (
            <div style={{ marginBottom: 4 }}>
              <strong>Diagnóstico:</strong> {a.diagnosis}
            </div>
          )}
          {a.summary && <div>{a.summary}</div>}
        </div>
      )}

      {a.attachments?.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {a.attachments.map((at) => (
            <button
              key={at.id}
              onClick={() => openAttachment(at.file_path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                border: `1px solid ${C.divider}`,
                background: C.bg,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: C.brand,
                textAlign: "left",
              }}
            >
              <FileText size={15} /> {at.file_name}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.append("file", file);
          start(async () => {
            await uploadAttachment(a.id, fd);
            flash("Anexo enviado ✓");
          });
        }}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() =>
            downloadICS(
              {
                title: `${a.specialty || a.doctor_name || "Consulta"}${a.doctor_name && a.specialty ? " · " + a.doctor_name : ""}`,
                start: new Date(a.appointment_date),
                durationMinutes: 60,
                location: a.location || null,
                description: [a.summary, a.notes].filter(Boolean).join(" — ") || "Consulta médica (Minha Saúde)",
                reminderMinutes: 120,
              },
              `consulta-${(a.specialty || "medica").toLowerCase().replace(/\s+/g, "-")}`
            )
          }
          className="press"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 13px",
            borderRadius: 10,
            border: "none",
            background: C.brand,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          <CalendarPlus size={15} /> Adicionar ao calendário
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 13px",
            borderRadius: 10,
            border: `1.5px solid ${C.divider}`,
            background: C.surface,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: C.text2,
          }}
        >
          <Paperclip size={15} /> Anexar
        </button>
      </div>
    </Card>
  );
}

function AddSheet({
  pending,
  onClose,
  onSave,
}: {
  pending: boolean;
  onClose: () => void;
  onSave: (form: {
    doctor_name: string;
    specialty: string;
    appointment_date: string;
    summary: string;
    diagnosis: string;
  }) => void;
}) {
  const [f, setF] = useState({
    doctor_name: "",
    specialty: "",
    appointment_date: "",
    summary: "",
    diagnosis: "",
  });
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
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 280ms ease-out",
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Nova consulta</h2>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Médico(a)" value={f.doctor_name} onChange={(e) => setF({ ...f, doctor_name: e.target.value })} style={inputStyle} />
          <input placeholder="Especialidade (ex.: Endocrinologia)" value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} style={inputStyle} />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: C.text2 }}>
            Data e hora
            <input type="datetime-local" value={f.appointment_date} onChange={(e) => setF({ ...f, appointment_date: e.target.value })} style={{ ...inputStyle, marginTop: 5 }} />
          </label>
          <input placeholder="Diagnóstico (opcional)" value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} style={inputStyle} />
          <textarea placeholder="Resumo do que foi discutido" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ marginTop: 18 }}>
          <PrimaryButton disabled={!f.appointment_date || pending} onClick={() => onSave(f)}>
            {pending ? <Spinner /> : "Salvar consulta"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
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
      {msg}
    </div>
  );
}
