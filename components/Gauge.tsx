"use client";

import { C } from "@/lib/design";

// Velocímetro semicircular. score 0..100 controla a agulha.
// Cor da zona ativa muda conforme severidade.
export function Gauge({
  score,
  size = 150,
  label,
  display,
  unit,
  color,
}: {
  score: number;
  size?: number;
  label?: string;
  display?: string;
  unit?: string;
  color: string;
}) {
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 6;
  const r = w / 2 - 12;

  // ângulo: 180° (esquerda) a 0° (direita)
  const angle = Math.PI * (1 - Math.max(0, Math.min(100, score)) / 100);
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);

  // arco de fundo (semicírculo)
  const arc = (startPct: number, endPct: number) => {
    const a0 = Math.PI * (1 - startPct / 100);
    const a1 = Math.PI * (1 - endPct / 100);
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const large = endPct - startPct > 50 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={w} height={h + 4} viewBox={`0 0 ${w} ${h + 4}`}>
        {/* zonas: vermelha, amarela, verde */}
        <path d={arc(0, 40)} stroke="#FFE0DC" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={arc(40, 70)} stroke="#FFE8C9" strokeWidth={10} fill="none" />
        <path d={arc(70, 100)} stroke="#D6F2DF" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* arco preenchido até o score, na cor do estado */}
        <path d={arc(0, Math.max(2, score))} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.9} />
        {/* agulha */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.text} strokeWidth={3} strokeLinecap="round"
          style={{ transition: "all 700ms cubic-bezier(0.34,1.2,0.64,1)" }} />
        <circle cx={cx} cy={cy} r={5} fill={C.text} />
      </svg>
      {display && (
        <div style={{ textAlign: "center", marginTop: -2 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{display}</span>
          {unit && <span style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}> {unit}</span>}
        </div>
      )}
      {label && <div style={{ fontSize: 12.5, color: C.text2, fontWeight: 600, marginTop: 1 }}>{label}</div>}
    </div>
  );
}
