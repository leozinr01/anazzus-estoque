import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Brand } from "@/components/ui/Brand";

export function Login() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const msg = await signIn(email.trim(), password);
    setLoading(false);
    if (msg) {
      setError(msg === "Invalid login credentials" ? "E-mail ou senha incorretos." : msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Brand className="text-neutral-900 dark:text-white text-4xl text-center" />
          <div className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wide uppercase mt-3">Sistema Interno</div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">E-mail</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              placeholder="voce@anazzus.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-4">
          Esqueceu a senha ou precisa de um acesso novo? Fale com a administradora da loja.
        </p>
      </div>
    </div>
  );
}
