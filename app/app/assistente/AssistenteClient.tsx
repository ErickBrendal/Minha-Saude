"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { C } from "@/lib/design";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistenteClient({
  firstName,
  medNames,
}: {
  firstName: string;
  medNames: string[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sugestões iniciais, personalizadas com a medicação do usuário
  const suggestions = [
    medNames.length ? `Como aplico a ${medNames[0]}?` : "Como aplicar insulina corretamente?",
    "O que posso comer no almoço pela minha dieta?",
    "Quais são meus horários de medicação?",
    "Dicas para evitar hipoglicemia",
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
      setMessages((m) => m.slice(0, -1)); // remove a pergunta que falhou
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 90px)" }}>
      {/* Cabeçalho */}
      <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/app" style={{ color: C.text2, display: "flex" }}><ArrowLeft size={22} /></Link>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#5856D6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>Assistente</div>
          <div style={{ fontSize: 12, color: C.text2 }}>Tira dúvidas sobre seu tratamento</div>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {messages.length === 0 && (
          <div>
            <div style={{ background: "#F5F3FF", border: "1px solid #E4DEFF", borderRadius: 16, padding: 16, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Olá{firstName ? `, ${firstName}` : ""}! 👋
              </div>
              <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>
                Posso te ajudar com dúvidas sobre suas medicações, sua dieta, suas consultas e
                convivência com o tratamento — tudo com base no que está registrado no seu app.
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text2, letterSpacing: 0.3, marginBottom: 10 }}>
              SUGESTÕES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="press"
                  style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: 12,
                    border: `1.5px solid ${C.divider}`, background: C.surface, cursor: "pointer",
                    fontSize: 14, fontWeight: 600, color: C.text,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? C.brand : C.surface,
                color: m.role === "user" ? "#fff" : C.text,
                border: m.role === "user" ? "none" : `1px solid ${C.divider}`,
                borderRadius: 16,
                borderBottomRightRadius: m.role === "user" ? 4 : 16,
                borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                padding: "11px 14px",
                fontSize: 14.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                animation: "riseIn 0.3s ease-out",
              }}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, color: C.text2, fontSize: 13.5, padding: "4px 2px" }}>
              <Loader2 size={16} style={{ animation: "spin 800ms linear infinite" }} /> pensando…
            </div>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 13, color: C.critHigh, marginTop: 12, padding: "10px 12px", background: "#FFF1F0", borderRadius: 10 }}>
            {error}
          </div>
        )}
      </div>

      {/* Aviso + entrada */}
      <div style={{ borderTop: `1px solid ${C.divider}`, padding: "10px 14px calc(12px + env(safe-area-inset-bottom))", background: C.surface }}>
        <div style={{ fontSize: 10.5, color: C.text2, textAlign: "center", marginBottom: 8, lineHeight: 1.4 }}>
          Orientações educativas, não substituem seu médico. O assistente não calcula doses.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Escreva sua pergunta…"
            rows={1}
            style={{
              flex: 1, resize: "none", maxHeight: 120, fontSize: 15,
              padding: "11px 14px", borderRadius: 18, border: `1.5px solid ${C.divider}`,
              outline: "none", background: C.bg, fontFamily: "inherit", lineHeight: 1.4,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="press"
            style={{
              width: 44, height: 44, borderRadius: 999, border: "none", flexShrink: 0,
              background: !input.trim() || loading ? "#C9D6D6" : C.brand,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: !input.trim() || loading ? "default" : "pointer",
            }}
          >
            <Send size={19} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
