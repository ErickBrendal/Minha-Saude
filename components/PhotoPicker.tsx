"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { C } from "@/lib/design";

// Hook + folha de opções para escolher câmera ou galeria.
// Uso: const picker = usePhotoPicker(handleFile); ... picker.open(); ... {picker.sheet}
export function usePhotoPicker(onFile: (file: File) => void) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
    e.target.value = ""; // permite re-selecionar o mesmo arquivo
    setOpen(false);
  }

  const sheet = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handle} />
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 80,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface, width: "100%", maxWidth: 480,
              borderRadius: "24px 24px 0 0", padding: "12px 20px calc(24px + env(safe-area-inset-bottom))",
              animation: "slideUp 280ms ease-out",
            }}
          >
            <div style={{ width: 38, height: 4.5, borderRadius: 99, background: C.divider, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Adicionar foto</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "#F0F0F2", borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} color={C.text2} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => cameraRef.current?.click()}
                className="press"
                style={optStyle}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.brand + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={21} color={C.brand} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15.5 }}>Tirar foto agora</span>
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="press"
                style={optStyle}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.food + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={21} color={C.food} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15.5 }}>Escolher da galeria</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return { open: () => setOpen(true), sheet };
}

const optStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 13, padding: 14,
  borderRadius: 16, border: `1.5px solid ${C.divider}`, background: C.surface,
  cursor: "pointer", textAlign: "left", width: "100%",
};
