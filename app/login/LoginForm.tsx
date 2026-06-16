"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { C } from "@/lib/design";

export default function LoginForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        // Se a confirmação de e-mail estiver desativada, já há sessão.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.push("/app");
          router.refresh();
        } else {
          setMsg("Conta criada! Verifique seu e-mail para confirmar e depois entre.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/app");
        router.refresh();
      }
    } catch (e: any) {
      const m = e?.message || "Algo deu errado.";
      setMsg(
        m.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : m.includes("already registered")
          ? "Este e-mail já tem conta. Tente entrar."
          : m
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: C.bg,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo.svg"
            alt="Minha Saúde"
            width={84}
            height={84}
            style={{
              margin: "0 auto 18px",
              display: "block",
              borderRadius: 24,
              boxShadow: "0 12px 32px rgba(14,124,123,.35)",
            }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.6 }}>
            Minha Saúde
          </h1>
          <p style={{ color: C.text2, fontSize: 15, margin: 0 }}>
            {mode === "login" ? "Bem-vindo de volta." : "Vamos começar a cuidar de você."}
          </p>
        </div>

        <div
          style={{
            background: C.surface,
            borderRadius: 18,
            padding: 22,
            border: `1px solid ${C.divider}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {mode === "signup" && (
            <Field label="Nome">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                style={inputStyle}
              />
            </Field>
          )}
          <Field label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoCapitalize="none"
              style={inputStyle}
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && submit()}
              style={inputStyle}
            />
          </Field>

          {msg && (
            <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.4 }}>{msg}</div>
          )}

          <button
            onClick={submit}
            disabled={loading || !email || !password || (mode === "signup" && !name)}
            style={{
              padding: 15,
              borderRadius: 14,
              border: "none",
              background:
                loading || !email || !password ? "#C9D6D6" : C.brand,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </div>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMsg(null);
          }}
          style={{
            display: "block",
            margin: "18px auto 0",
            border: "none",
            background: "transparent",
            color: C.brand,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "Não tem conta? Criar agora"
            : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 16,
  padding: "13px 14px",
  borderRadius: 12,
  border: `1.5px solid ${C.divider}`,
  outline: "none",
  background: C.bg,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: C.text2,
          display: "block",
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
