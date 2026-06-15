"use client";

import { C, NUM } from "@/lib/design";

export function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
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
