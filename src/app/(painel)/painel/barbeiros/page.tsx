"use client";
import { useEffect, useState } from "react";
import { Users, Plus, Percent } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getInitials } from "@/lib/utils";

interface Barber {
  id: string; commission: number; nickname: string | null; active: boolean;
  user: { id: string; name: string; email: string; phone: string | null };
}

export default function BarbeirosPage() {
  const { token } = useAuthStore();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", commission: "50", nickname: "" });

  function setField(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function load() {
    const r = await fetch("/api/barbershop/barbers", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setBarbers(d.barbers || []);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/barbershop/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: "", email: "", phone: "", password: "", commission: "50", nickname: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Barbeiros</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Barbeiro
        </Button>
      </div>

      {barbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-white rounded-xl border border-zinc-100">
          <Users className="w-12 h-12 mb-3" />
          <p className="font-medium">Nenhum barbeiro cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-700 font-bold text-sm">{getInitials(b.user.name)}</span>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{b.user.name}</p>
                  {b.nickname && <p className="text-xs text-zinc-400">{b.nickname}</p>}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-zinc-500">📧 {b.user.email}</p>
                {b.user.phone && <p className="text-zinc-500">📱 {b.user.phone}</p>}
                <div className="flex items-center gap-1 mt-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-amber-700">{b.commission}% de comissão</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Barbeiro">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input label="Nome completo" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          <Input label="Apelido (opcional)" value={form.nickname} onChange={(e) => setField("nickname", e.target.value)} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
          <Input label="WhatsApp" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          <Input label="Senha de acesso" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder="barber123" />
          <Input label="Comissão (%)" type="number" min="0" max="100" value={form.commission} onChange={(e) => setField("commission", e.target.value)} />
          <Button type="submit" loading={loading} className="w-full mt-2">Cadastrar Barbeiro</Button>
        </form>
      </Modal>
    </div>
  );
}
