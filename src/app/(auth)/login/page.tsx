"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuth(data.user, data.token);
      if (data.user.role === "PLATFORM_ADMIN") router.push("/admin");
      else if (data.user.role === "BARBER") router.push("/barbeiro");
      else router.push("/painel");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-4">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BarberApp</h1>
          <p className="text-zinc-400 text-sm mt-1">Acesse sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900 rounded-2xl p-6 space-y-4 border border-zinc-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Entrar
          </Button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-amber-500 hover:text-amber-400 font-medium">
            Cadastre sua barbearia
          </Link>
        </p>
      </div>
    </div>
  );
}
