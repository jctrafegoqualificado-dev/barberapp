"use client";
import { useEffect, useState } from "react";
import { CreditCard, Plus, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

interface Subscription {
  id: string; status: string; startDate: string; nextBillingDate: string; usesThisCycle: number;
  client: { id: string; name: string; email: string; phone: string | null };
  plan: { id: string; name: string; price: number; maxUses: number | null };
  payments: { status: string; amount: number }[];
}
interface Plan { id: string; name: string; price: number }

export default function AssinaturasPage() {
  const { token } = useAuthStore();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientPhone: "", planId: "" });

  function setField(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function load() {
    const [sr, pr] = await Promise.all([
      fetch("/api/barbershop/subscriptions", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/barbershop/plans", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [sd, pd] = await Promise.all([sr.json(), pr.json()]);
    setSubs(sd.subscriptions || []);
    setPlans(pd.plans || []);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planId) { alert("Selecione um plano"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/barbershop/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          planId: form.planId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao criar assinatura"); return; }
      setOpen(false);
      setForm({ clientName: "", clientEmail: "", clientPhone: "", planId: "" });
      load();
    } finally {
      setLoading(false);
    }
  }

  const filtered = subs.filter((s) =>
    s.client.name.toLowerCase().includes(search.toLowerCase()) ||
    s.client.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Assinantes</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Assinante
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-400">
            <CreditCard className="w-12 h-12 mb-3" />
            <p className="font-medium">Nenhum assinante encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {filtered.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-xs">{getInitials(s.client.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{s.client.name}</p>
                  <p className="text-xs text-zinc-400">{s.client.email}</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-xs text-zinc-400">Plano</p>
                  <p className="text-sm font-medium text-zinc-700">{s.plan.name}</p>
                </div>
                <div className="text-center hidden md:block">
                  <p className="text-xs text-zinc-400">Valor</p>
                  <p className="text-sm font-bold text-zinc-900">{formatCurrency(s.plan.price)}/mês</p>
                </div>
                <div className="text-center hidden md:block">
                  <p className="text-xs text-zinc-400">Usos</p>
                  <p className="text-sm font-medium text-zinc-700">{s.usesThisCycle}{s.plan.maxUses ? `/${s.plan.maxUses}` : ""}</p>
                </div>
                <div className="text-center hidden lg:block">
                  <p className="text-xs text-zinc-400">Próx. cobrança</p>
                  <p className="text-xs text-zinc-600">{formatDate(s.nextBillingDate)}</p>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Assinante">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input label="Nome do cliente" value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} required />
          <Input label="E-mail" type="email" value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)} required />
          <Input label="WhatsApp" type="tel" value={form.clientPhone} onChange={(e) => setField("clientPhone", e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Plano</label>
            <select value={form.planId} onChange={(e) => setField("planId", e.target.value)} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">Selecione um plano...</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/mês</option>)}
            </select>
          </div>
          <Button type="submit" loading={loading} className="w-full mt-2">Registrar Assinante</Button>
        </form>
      </Modal>
    </div>
  );
}
