"use client";
import { useEffect, useState } from "react";
import { DollarSign, Percent, Hash, Edit2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, getInitials } from "@/lib/utils";

interface BarberComissao {
  id: string; name: string; email: string;
  commissionType: string; commission: number;
  productCommissionType: string; productCommission: number;
  avulso: { atendimentos: number; faturado: number; comissao: number };
  assinatura: { servicos: number };
  produtos: { vendas: number; faturado: number; comissao: number };
  totalComissao: number;
}

type CommType = "PERCENTAGE" | "FIXED";

function TypeToggle({ value, onChange }: { value: CommType; onChange: (v: CommType) => void }) {
  return (
    <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange("PERCENTAGE")}
        className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${value === "PERCENTAGE" ? "bg-amber-500 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
      >
        <Percent className="w-3 h-3" /> %
      </button>
      <button
        type="button"
        onClick={() => onChange("FIXED")}
        className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${value === "FIXED" ? "bg-amber-500 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
      >
        <Hash className="w-3 h-3" /> R$
      </button>
    </div>
  );
}

interface ComissaoUpdate {
  commissionType: CommType;
  commission: string;
  productCommissionType: CommType;
  productCommission: string;
}

function BarberCard({ barber, onSave }: {
  barber: BarberComissao;
  onSave: (id: string, data: ComissaoUpdate) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    commissionType: barber.commissionType as CommType,
    commission: String(barber.commission),
    productCommissionType: barber.productCommissionType as CommType,
    productCommission: String(barber.productCommission),
  });

  async function handleSave() {
    setSaving(true);
    await onSave(barber.id, form);
    setSaving(false);
    setEditing(false);
  }

  function cancelEdit() {
    setForm({
      commissionType: barber.commissionType as CommType,
      commission: String(barber.commission),
      productCommissionType: barber.productCommissionType as CommType,
      productCommission: String(barber.productCommission),
    });
    setEditing(false);
  }

  const commLabel = barber.commissionType === "PERCENTAGE"
    ? `${barber.commission}% dos serviços avulsos`
    : `R$${barber.commission} fixo por serviço avulso`;

  const prodLabel = barber.productCommissionType === "PERCENTAGE"
    ? `${barber.productCommission}% dos produtos`
    : `R$${barber.productCommission} fixo por produto vendido`;

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-amber-700 font-bold">{getInitials(barber.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900">{barber.name}</p>
            <p className="text-xs text-zinc-400 truncate">{barber.email}</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={cancelEdit}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors">
                <Edit2 className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>
        </div>

        {/* Configuração de comissões */}
        <div className="space-y-3">
          {/* Serviços avulsos */}
          <div className={`rounded-xl p-4 ${editing ? "bg-zinc-50 border border-zinc-200" : "bg-zinc-50"}`}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">✂️ Serviços Avulsos</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <TypeToggle value={form.commissionType} onChange={(v) => setForm((f) => ({ ...f, commissionType: v }))} />
                <input
                  type="number" min="0" step={form.commissionType === "PERCENTAGE" ? "1" : "0.01"}
                  max={form.commissionType === "PERCENTAGE" ? "100" : undefined}
                  value={form.commission}
                  onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
                  className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-500">
                  {form.commissionType === "PERCENTAGE" ? "%" : "R$ por serviço"}
                </span>
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-800">{commLabel}</p>
            )}
          </div>

          {/* Produtos */}
          <div className={`rounded-xl p-4 ${editing ? "bg-zinc-50 border border-zinc-200" : "bg-zinc-50"}`}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">📦 Produtos</p>
            {editing ? (
              <div className="flex items-center gap-2">
                <TypeToggle value={form.productCommissionType} onChange={(v) => setForm((f) => ({ ...f, productCommissionType: v }))} />
                <input
                  type="number" min="0" step={form.productCommissionType === "PERCENTAGE" ? "1" : "0.01"}
                  max={form.productCommissionType === "PERCENTAGE" ? "100" : undefined}
                  value={form.productCommission}
                  onChange={(e) => setForm((f) => ({ ...f, productCommission: e.target.value }))}
                  className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-500">
                  {form.productCommissionType === "PERCENTAGE" ? "%" : "R$ por venda"}
                </span>
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-800">{prodLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* Total comissão do mês */}
      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
        <span className="text-sm text-amber-700 font-medium">💰 Comissão total este mês</span>
        <span className="text-lg font-black text-amber-600">{formatCurrency(barber.totalComissao)}</span>
      </div>

      {/* Breakdown expandível */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-3 flex items-center justify-between text-sm text-zinc-500 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
      >
        <span>Ver detalhamento</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-zinc-100">
          {/* Avulso */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-zinc-700">✂️ Serviços avulsos</p>
              <p className="text-xs text-zinc-400">{barber.avulso.atendimentos} atend. · faturou {formatCurrency(barber.avulso.faturado)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-900">{formatCurrency(barber.avulso.comissao)}</p>
              <p className="text-xs text-zinc-400">
                {barber.commissionType === "PERCENTAGE"
                  ? `${barber.commission}% do faturado`
                  : `R$${barber.commission} × ${barber.avulso.atendimentos}`}
              </p>
            </div>
          </div>

          {/* Assinatura */}
          <div className="flex items-center justify-between py-2 border-t border-zinc-50">
            <div>
              <p className="text-sm font-medium text-zinc-700">💳 Assinaturas (POE)</p>
              <p className="text-xs text-zinc-400">{barber.assinatura.servicos} serviços realizados</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Ver em Financeiro</p>
              <p className="text-xs text-zinc-300">calculado pelo POE</p>
            </div>
          </div>

          {/* Produtos */}
          <div className="flex items-center justify-between py-2 border-t border-zinc-50">
            <div>
              <p className="text-sm font-medium text-zinc-700">📦 Produtos</p>
              <p className="text-xs text-zinc-400">{barber.produtos.vendas} vendas · faturou {formatCurrency(barber.produtos.faturado)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-900">{formatCurrency(barber.produtos.comissao)}</p>
              <p className="text-xs text-zinc-400">
                {barber.productCommissionType === "PERCENTAGE"
                  ? `${barber.productCommission}% das vendas`
                  : `R$${barber.productCommission} × ${barber.produtos.vendas}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComissoesPage() {
  const { token } = useAuthStore();
  const [barbers, setBarbers] = useState<BarberComissao[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/barbershop/comissoes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    setBarbers(d.barbers || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(barberId: string, data: ComissaoUpdate) {
    await fetch("/api/barbershop/comissoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ barberId, ...data }),
    });
    load();
  }

  const totalComissoes = barbers.reduce((s, b) => s + b.totalComissao, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Comissões</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure e acompanhe as comissões de cada barbeiro</p>
        </div>
        {!loading && barbers.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-amber-600 font-medium">Total a pagar este mês</p>
            <p className="text-xl font-black text-amber-600">{formatCurrency(totalComissoes)}</p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Como funciona</p>
        <ul className="space-y-0.5 text-xs text-blue-600">
          <li>• <strong>%</strong> — comissão proporcional ao valor do serviço/produto (ex: 50% de R$45 = R$22,50)</li>
          <li>• <strong>R$ fixo</strong> — valor fixo por serviço ou venda realizada, independente do preço (ex: R$15 por corte)</li>
          <li>• <strong>Assinatura</strong> — calculada pelo modelo POE na tela Financeiro</li>
        </ul>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : barbers.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-100 p-16 text-center text-zinc-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3" />
          <p className="font-medium">Nenhum barbeiro cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <BarberCard key={b.id} barber={b} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
