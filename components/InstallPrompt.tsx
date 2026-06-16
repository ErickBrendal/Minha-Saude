"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { C } from "@/lib/design";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Registra o service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Já instalado? não mostra nada
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    // Usuário já dispensou recentemente?
    const dismissed = localStorage.getItem("install_dismissed");
    if (dismissed && Date.now() - +dismissed < 1000 * 60 * 60 * 24 * 7) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      // iOS não dispara beforeinstallprompt — mostramos instruções
      setTimeout(() => { setIosHint(true); setShow(true); }, 2500);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("install_dismissed", String(Date.now()));
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferred(null);
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 448,
        zIndex: 70,
        animation: "riseIn 0.45s cubic-bezier(0.34,1.2,0.64,1)",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${C.brand}, #0A5E5D)`,
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 12px 32px rgba(14,124,123,.35)",
          display: "flex",
          alignItems: "center",
          gap: 13,
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background: "rgba(255,255,255,.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Download size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Instalar Minha Saúde</div>
          {iosHint ? (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.9)", marginTop: 2, lineHeight: 1.4 }}>
              Toque em <Share size={12} style={{ verticalAlign: "-1px" }} /> e depois em{" "}
              <strong>“Adicionar à Tela de Início”</strong>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.9)", marginTop: 2, lineHeight: 1.4 }}>
              Acesso rápido e funciona offline
            </div>
          )}
        </div>
        {!iosHint && (
          <button
            onClick={install}
            className="press"
            style={{
              border: "none",
              background: "#fff",
              color: C.brand,
              fontWeight: 800,
              fontSize: 14,
              padding: "9px 16px",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Instalar
          </button>
        )}
        <button
          onClick={dismiss}
          style={{
            border: "none",
            background: "rgba(255,255,255,.15)",
            borderRadius: 999,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}
