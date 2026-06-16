import LoginForm from "./LoginForm";

// Impede a pré-renderização estática no build — a página depende de
// variáveis de ambiente (Supabase) que só existem em runtime.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
