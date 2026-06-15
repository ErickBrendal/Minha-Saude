"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Droplet, UtensilsCrossed, Activity, User } from "lucide-react";
import { C } from "@/lib/design";

const TABS = [
  { href: "/app", label: "Início", icon: Home, exact: true },
  { href: "/app/glicemia", label: "Glicemia", icon: Droplet },
  { href: "/app/alimentacao", label: "Comida", icon: UtensilsCrossed },
  { href: "/app/exercicios", label: "Exercício", icon: Activity },
  { href: "/app/perfil", label: "Perfil", icon: User },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.divider}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 6px calc(10px + env(safe-area-inset-bottom))",
        zIndex: 40,
      }}
    >
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "4px 8px",
            }}
          >
            <Icon
              size={22}
              color={active ? C.brand : "#A6A6AC"}
              strokeWidth={active ? 2.4 : 2}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: active ? C.brand : "#A6A6AC",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
