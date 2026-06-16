"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, Droplet, UtensilsCrossed, User, Plus,
  Sparkles, Activity, FileText,
} from "lucide-react";
import { C } from "@/lib/design";

const TABS_LEFT = [
  { href: "/app", label: "Início", icon: Home, exact: true },
  { href: "/app/glicemia", label: "Glicemia", icon: Droplet },
];
const TABS_RIGHT = [
  { href: "/app/alimentacao", label: "Comida", icon: UtensilsCrossed },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

const QUICK_ACTIONS = [
  { href: "/app/assistente", label: "Perguntar ao assistente", icon: Sparkles, color: "#5856D6" },
  { href: "/app/glicemia", label: "Registrar glicemia", icon: Droplet, color: "#0E7C7B" },
  { href: "/app/alimentacao", label: "Foto da refeição", icon: UtensilsCrossed, color: "#FF9F0A" },
  { href: "/app/documentos", label: "Enviar documento", icon: FileText, color: "#34C759" },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 45,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            animation: "fadeIn 200ms ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              padding: "0 18px calc(96px + env(safe-area-inset-bottom))",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={a.href}
                onClick={() => go(a.href)}
                className="press"
                style={{
                  display: "flex", alignItems: "center", gap: 13, padding: 15,
                  borderRadius: 16, border: "none", background: C.surface, cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(0,0,0,.12)",
                  animation: `riseIn 0.35s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.04}s both`,
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: a.color + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <a.icon size={21} color={a.color} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15.5 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.divider}`, display: "flex",
          justifyContent: "space-around", alignItems: "center",
          padding: "8px 6px calc(10px + env(safe-area-inset-bottom))", zIndex: 50,
        }}
      >
        {TABS_LEFT.map((t) => <Tab key={t.href} {...t} pathname={pathname} />)}

        <button
          onClick={() => setOpen(!open)}
          aria-label="Ações rápidas"
          style={{
            width: 52, height: 52, borderRadius: 18, border: "none",
            background: `linear-gradient(135deg, ${C.brand}, #0A5E5D)`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: "0 6px 18px rgba(14,124,123,.4)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 250ms cubic-bezier(0.34,1.4,0.64,1)", marginTop: -18,
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>

        {TABS_RIGHT.map((t) => <Tab key={t.href} {...t} pathname={pathname} />)}
      </nav>
    </>
  );
}

function Tab({ href, label, icon: Icon, exact, pathname }: { href: string; label: string; icon: any; exact?: boolean; pathname: string; }) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 8px" }}>
      <Icon size={22} color={active ? C.brand : "#A6A6AC"} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? C.brand : "#A6A6AC" }}>{label}</span>
    </Link>
  );
}
