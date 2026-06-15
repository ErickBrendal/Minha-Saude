"use client";

import { useState, useMemo, useTransition } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Plus, X, Trash2 } from "lucide-react";
import { Card, Chip, Spinner, PrimaryButton } from "@/components/ui";
import { C, NUM, glucoseColor, glucoseLabel, fmtTime, mean, sd, gmi } from "@/lib/design";
import { addGlucose, deleteMeasurement } from "../actions";

type G = { id: string; value: number; context: any; measured_at: string };
const TIMINGS = ["Jejum", "Pré-refeição", "Pós-refeição", "Antes de dormir"];

export default function GlicemiaClient({
  low,
  high,
  glucose,
}: {
  low: number;
  high: number;
  glucose: G[];
}) {
  const [sheet, setSheet] = useState(false);
  const [period, setPeriod] = useState(7);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  const periodVals = useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() - period);
    return glucose.filter((g) => new Date(g.measured_at) >= cut);
  }, [glucose, period]);

  const vals = periodVals.map((g) => g.value);
  const tir = vals.length
    ? Math.round((vals.filter((v) => v >= low && v <= high).length / vals.length) * 100)
    : 0;
  const hypos = vals.filter((v) => v < low).length;
  const cv = vals.length ? Math.round((sd(vals) / mean(vals)) * 100) : 0;

  const chartData = useMemo(
    () =>
      periodVals
        .slice()
        .reverse()
        .map((g) => ({
          label: new Date(g.measured_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          v: g.value,
        })),
    [periodVals]
  );

  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: 0, letterSpacing: -0.6 }}>Glicemia</h1>
        <button
          onClick={() => setSheet(true)}
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
          <Plus size={17} strokeWidth={2.6} /> Registrar
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[7, 14, 30, 90].map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p} dias
          </Chip>
        ))}
      </div>

      {/* GRÁFICO */}
      <Card style={{ marginBottom: 14, padding: "18px 8px 8px 0" }}>
        <div style={{ height: 220 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: C.text2 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: C.text2 }}
                  width={36}
                  domain={[40, 280]}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceArea y1={low} y2={high} fill={C.inRange} fillOpacity={0.09} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${C.divider}`,
                    fontSize: 13,
                  }}
                  formatter={(v: any) => [`${v} mg/dL`, "Glicemia"]}
                  labelFormatter={() => ""}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={C.brand}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: C.brand, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text2,
                fontSize: 14,
              }}
            >
              Sem registros neste período
            </div>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: C.text2, padding: "6px 14px 8px" }}>
          Faixa verde = seu alvo ({low}–{high} mg/dL)
        </div>
      </Card>

      {/* ESTATÍSTICAS */}
      {vals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <Stat label="Média" value={`${Math.round(mean(vals))}`} unit="mg/dL" />
          <Stat label="Tempo no alvo" value={`${tir}`} unit="%" highlight={tir >= 70} />
          <Stat label="GMI estimada" value={gmi(mean(vals))} unit="%" />
          <Stat
            label="Hipoglicemias"
            value={`${hypos}`}
            unit={hypos === 1 ? "evento" : "eventos"}
            danger={hypos > 0}
          />
        </div>
      )}

      {/* HISTÓRICO */}
      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>Histórico</h3>
      {glucose.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28, color: C.text2 }}>
          Nenhuma glicemia registrada ainda.<br />Toque em “Registrar” para começar.
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {glucose.slice(0, 50).map((g) => (
          <Card key={g.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 36,
                borderRadius: 99,
                background: glucoseColor(g.value, low, high),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: glucoseColor(g.value, low, high), ...NUM }}>
                {g.value}
              </span>
              <span style={{ fontSize: 12.5, color: C.text2, fontWeight: 600 }}>
                {" "}
                mg/dL
                {g.context?.timing ? ` · ${g.context.timing}` : ""}
              </span>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: C.text2, ...NUM }}>
              {new Date(g.measured_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              <br />
              {fmtTime(new Date(g.measured_at))}
            </div>
            <button
              onClick={() =>
                start(async () => {
                  await deleteMeasurement(g.id);
                  flash("Registro excluído");
                })
              }
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
            >
              <Trash2 size={15} color="#C4C4C8" />
            </button>
          </Card>
        ))}
      </div>

      {sheet && (
        <LogSheet
          low={low}
          high={high}
          pending={pending}
          onClose={() => setSheet(false)}
          onSave={(value, timing) =>
            start(async () => {
              await addGlucose(value, timing, null);
              setSheet(false);
              flash("Glicemia registrada ✓");
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

function Stat({
  label,
  value,
  unit,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <span
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: danger ? C.hypo : highlight ? C.inRange : C.text,
          ...NUM,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}> {unit}</span>
    </Card>
  );
}

function LogSheet({
  low,
  high,
  pending,
  onClose,
  onSave,
}: {
  low: number;
  high: number;
  pending: boolean;
  onClose: () => void;
  onSave: (value: number, timing: string | null) => void;
}) {
  const [val, setVal] = useState("");
  const [timing, setTiming] = useState<string | null>(null);

  function press(k: string) {
    if (k === "⌫") return setVal(val.slice(0, -1));
    if (val.length >= 3) return;
    setVal(val + k);
  }
  const ok = val && +val > 0;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Registrar glicemia</h2>
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

        <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: val ? glucoseColor(+val, low, high) : "#D5D5DA",
              ...NUM,
            }}
          >
            {val || "0"}
          </span>
          <span style={{ fontSize: 16, color: C.text2, fontWeight: 700, marginLeft: 6 }}>mg/dL</span>
          {val && (
            <div style={{ fontSize: 13, fontWeight: 700, color: glucoseColor(+val, low, high), marginTop: 2 }}>
              {glucoseLabel(+val, low, high)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "8px 0 14px" }}>
          {TIMINGS.map((t) => (
            <Chip key={t} active={timing === t} onClick={() => setTiming(timing === t ? null : t)}>
              {t}
            </Chip>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
            k === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => press(k)}
                style={{
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "none",
                  background: "#F4F4F6",
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: C.text,
                  ...NUM,
                }}
              >
                {k}
              </button>
            )
          )}
        </div>

        <PrimaryButton disabled={!ok || pending} onClick={() => ok && onSave(+val, timing)}>
          {pending ? <Spinner /> : "Salvar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
