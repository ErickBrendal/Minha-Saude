"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Pill, ShieldCheck, LogOut, ChevronRight, Download, FileText, FileBarChart } from "lucide-react";
import { Card, Spinner } from "@/components/ui";
import { C, NUM } from "@/lib/design";
import { createClient } from "@/lib/supabase-browser";
import { updateTargets } from "../actions";

type Profile = {
  full_name: string | null;
  glucose_target_low: number;
  glucose_target_high: number;
};

export default function PerfilClient({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [low, setLow] = useState(profile?.glucose_target_low ?? 70);
  const [high, setHigh] = useState(profile?.glucose_target_high ?? 180);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const name = profile?.full_name || "";
  const dirty = low !== (profile?.glucose_target_low ?? 70) || high !== (profile?.glucose_target_high ?? 180);

  return (
    <div style={{ padding: "20px 18px" }}>
      <h1 style={{ fontSize: 27, fontWeight: 800, margin: "0 0 18px", letterSpacing: -0.6 }}>Perfil</h1>

      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            background: C.brand,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          {(name || email)[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{name || "Bem-vindo"}</div>
          <div style={{ fontSize: 13, color: C.text2, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
        </div>
      </Card>

      {/* ATALHOS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        <NavRow href="/app/consultas" icon={Stethoscope} label="Consultas e receitas" />
        <NavRow href="/app/medicacoes" icon={Pill} label="Medicações" />
        <NavRow href="/app/documentos" icon={FileText} label="Central de documentos" />
        <NavRow href="/app/relatorio" icon={FileBarChart} label="Relatório para o médico" />
      </div>

      {/* ALVOS */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        FAIXA-ALVO GLICÊMICA
      </h3>
      <Card style={{ marginBottom: 8, display: "flex", gap: 12 }}>
        {[
          ["Mínimo", low, setLow],
          ["Máximo", high, setHigh],
        ].map(([label, val, set]: any) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text2, fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <input
                type="number"
                value={val}
                onChange={(e) => set(+e.target.value)}
                style={{
                  width: 64,
                  border: "none",
                  borderBottom: `2px solid ${C.brandSoft}`,
                  outline: "none",
                  fontSize: 24,
                  fontWeight: 800,
                  color: C.brand,
                  background: "transparent",
                  ...NUM,
                }}
              />
              <span style={{ fontSize: 12, color: C.text2 }}>mg/dL</span>
            </div>
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 12, color: C.text2, margin: "0 4px 12px" }}>
        Ajuste sempre com orientação do seu médico.
      </div>
      {dirty && (
        <button
          onClick={() =>
            start(async () => {
              await updateTargets(low, high);
              flash("Alvos atualizados ✓");
            })
          }
          disabled={pending}
          style={{
            width: "100%",
            padding: 13,
            borderRadius: 14,
            border: "none",
            background: C.brand,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          {pending ? <Spinner /> : "Salvar alvos"}
        </button>
      )}

      {/* PRIVACIDADE */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, letterSpacing: 0.4, margin: "0 0 10px 2px" }}>
        PRIVACIDADE
      </h3>
      <Card style={{ marginBottom: 20, display: "flex", gap: 10, padding: 14 }}>
        <ShieldCheck size={18} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
          Seus dados ficam protegidos e isolados — só você acessa. Nada é vendido ou
          compartilhado para publicidade.
        </div>
      </Card>

      <InstallButton />

      <button
        onClick={logout}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 14,
          border: `1.5px solid ${C.divider}`,
          background: C.surface,
          color: C.hypo,
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <LogOut size={17} /> Sair
      </button>

      <div style={{ fontSize: 11.5, color: C.text2, textAlign: "center", marginTop: 18 }}>
        Minha Saúde v1.0
      </div>

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

function NavRow({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Card style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <Icon size={19} color={C.brand} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{label}</span>
        <ChevronRight size={18} color={C.text2} />
      </Card>
    </Link>
  );
}

// Botão de instalação do app — aparece só se ainda não instalado
function InstallButton() {
  const [deferred, setDeferred] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;

  async function install() {
    if (isIOS) {
      setShowIosHint(true);
      return;
    }
    if (!deferred) {
      setShowIosHint(true);
      return;
    }
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={install}
        className="press"
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 14,
          border: "none",
          background: `linear-gradient(135deg, ${C.brand}, #0A5E5D)`,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 8px 24px rgba(14,124,123,.28)",
        }}
      >
        <Download size={18} /> Instalar app no celular
      </button>
      {showIosHint && (
        <div
          style={{
            marginTop: 10,
            padding: "12px 14px",
            borderRadius: 12,
            background: C.brandSoft,
            fontSize: 13,
            color: C.text,
            lineHeight: 1.5,
          }}
        >
          No iPhone: toque no botão <strong>Compartilhar</strong> do Safari (o quadrado com seta
          para cima) e escolha <strong>“Adicionar à Tela de Início”</strong>.
        </div>
      )}
    </div>
  );
}
