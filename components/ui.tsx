"use client";

import { C, NUM } from "@/lib/design";

export function Card({
  children,
  style,
  onClick,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: C.surface,
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: `1px solid ${C.divider}`,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
  color = C.brand,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 15px",
        borderRadius: 999,
        border: "none",
        fontSize: 13.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: active ? color : "#F0F0F2",
        color: active ? "#fff" : C.text2,
        transition: "all 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

export function TIRRing({ pct, size = 84 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.divider} strokeWidth={9} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C.inRange}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 19, fontWeight: 700, ...NUM }}>{pct}%</span>
        <span style={{ fontSize: 9, color: C.text2, fontWeight: 600, letterSpacing: 0.4 }}>
          NO ALVO
        </span>
      </div>
    </div>
  );
}

export function Spinner({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: `2.5px solid ${color}40`,
        borderTopColor: color,
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 700ms linear infinite",
      }}
    />
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 15,
        borderRadius: 14,
        border: "none",
        background: disabled ? "#D9E5E5" : C.brand,
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// Componentes de gamificação e objetivo (signature elements)
// ============================================================

// Chip de streak com chama animada
export function StreakChip({ streak }: { streak: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 999,
        background: streak > 0 ? "#FFF4E6" : "#F0F0F2",
        border: `1px solid ${streak > 0 ? "#FFE0B2" : C.divider}`,
      }}
    >
      <span style={{ fontSize: 15, animation: streak > 0 ? "flame 1.6s ease-in-out infinite" : "none" }}>
        {streak > 0 ? "🔥" : "💤"}
      </span>
      <span style={{ fontSize: 14, fontWeight: 800, color: streak > 0 ? "#E8800A" : C.text2, ...NUM }}>
        {streak}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: streak > 0 ? "#E8800A" : C.text2 }}>
        {streak === 1 ? "dia" : "dias"}
      </span>
    </div>
  );
}

// Anel de progresso de tratamento — o elemento-assinatura
export function GoalRing({
  pct,
  color,
  emoji,
  size = 120,
  label,
  sublabel,
}: {
  pct: number;
  color: string;
  emoji: string;
  size?: number;
  label: string;
  sublabel: string;
}) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, pct) / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.divider} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.34,1.2,0.64,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 21, fontWeight: 800, marginTop: 2, ...NUM }}>{label}</span>
        <span style={{ fontSize: 10, color: C.text2, fontWeight: 700, letterSpacing: 0.3 }}>{sublabel}</span>
      </div>
    </div>
  );
}

// Barra de missões diárias
export function MissionBar({ pct, color = C.brand }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 10, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          transition: "width 800ms cubic-bezier(0.34,1.2,0.64,1)",
        }}
      />
    </div>
  );
}

// Número que "sobe" ao aparecer
export function AnimatedStat({
  value,
  unit,
  color = C.text,
  size = 25,
}: {
  value: number | string;
  unit?: string;
  color?: string;
  size?: number;
}) {
  return (
    <span style={{ animation: "countUp 0.5s ease-out" }}>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.5, color, ...NUM }}>{value}</span>
      {unit && <span style={{ fontSize: size * 0.5, color: C.text2, fontWeight: 600 }}> {unit}</span>}
    </span>
  );
}
