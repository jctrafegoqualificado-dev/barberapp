"use client";
import { useEffect, useState, useCallback } from "react";
import { Calendar, CheckCircle, XCircle, UserX, Clock, DollarSign, TrendingUp, User, Phone, ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface Appointment {
  id: string; startTime: string; endTime: string; status: string; price: number;
  client: { name: string; phone: string | null };
  service: { name: string; duration: number };
  subscription: { plan: { name: string } } | null;
}

interface DashData {
  barberName: string;
  hoje: { total: number; done: number; pending: number; noShow: number; faturado: number };
  mes: { atendimentos: number; faturado: number; comissao: number; avulso: number; assinatura: number };
  agenda: Appointment[];
  proximoAgendamento: Appointment | null;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function StatusActions({ appt, onUpdate }: { appt: Appointment; onUpdate: (id: string, status: string) => void }) {
  if (appt.status === "DONE") return <span className="text-xs text-green-600 font-semibold">✓ Concluído</span>;
  if (appt.status === "NO_SHOW") return <span className="text-xs text-yellow-600 font-semibold">Faltou</span>;
  if (appt.status === "CANCELLED") return <span className="text-xs text-red-500 font-semibold">Cancelado</span>;
  return (
    <div className="flex gap-1 mt-1">
      <button onClick={() => onUpdate(appt.id, "DONE")}
        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md hover:bg-green-100 font-medium transition-colors">
        <CheckCircle className="w-3 h-3" /> Feito
      </button>
      <button onClick={() => onUpdate(appt.id, "NO_SHOW")}
        className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md hover:bg-yellow-100 font-medium transition-colors">
        <UserX className="w-3 h-3" /> Faltou
      </button>
      <button onClick={() => onUpdate(appt.id, "CANCELLED")}
        className="flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-1 rounded-md hover:bg-red-100 font-medium transition-colors">
        <XCircle className="w-3 h-3" /> Cancelar
      </button>
    </div>
  );
}

export default function BarbeiroAgendaPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    const r = await fetch("/api/barber/dashboard", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setData(d);
    setLoading(false);
  }, [token]);

  // Agenda para a data selecionada (separada do dashboard que é sempre "hoje")
  const [agendaAppts, setAgendaAppts] = useState<Appointment[]>([]);

  const loadAgenda = useCallback(async (d: string) => {
    const r = await fetch(`/api/barbershop/appointments?date=${d}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await r.json();
    setAgendaAppts(res.appointments || []);
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAgenda(agendaDate); }, [agendaDate, loadAgenda]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/barbershop/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    load();
    loadAgenda(agendaDate);
  }

  function prevDay() {
    const d = new Date(agendaDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setAgendaDate(d.toISOString().slice(0, 10));
  }
  function nextDay() {
    const d = new Date(agendaDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setAgendaDate(d.toISOString().slice(0, 10));
  }

  const isToday = agendaDate === new Date().toISOString().slice(0, 10);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  const d = data!;
  const pendingAppts = agendaAppts.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING");
  const doneAppts = agendaAppts.filter((a) => a.status === "DONE");
  const agendaFaturado = doneAppts.reduce((s, a) => s + a.price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Olá, {d.barberName.split(" ")[0]}!</h1>
        <p className="text-zinc-500 text-sm mt-0.5">{formatDate(new Date())} — Aqui está o resumo do seu dia</p>
      </div>

      {/* KPIs de hoje */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-zinc-100 p-4 text-center">
          <Calendar className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-zinc-900">{d.hoje.total}</p>
          <p className="text-xs text-zinc-400">hoje</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">{d.hoje.done}</p>
          <p className="text-xs text-green-600">concluídos</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">{d.hoje.pending}</p>
          <p className="text-xs text-amber-600">pendentes</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-4 text-center">
          <DollarSign className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-zinc-900">{formatCurrency(d.hoje.faturado)}</p>
          <p className="text-xs text-zinc-400">faturado hoje</p>
        </div>
      </div>

      {/* Próximo agendamento */}
      {d.proximoAgendamento && (
        <div className="bg-amber-500 rounded-xl p-4 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center shrink-0 text-white font-bold">
            {getInitials(d.proximoAgendamento.client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs opacity-80 font-medium mb-0.5">PRÓXIMO CLIENTE</p>
            <p className="font-bold truncate">{d.proximoAgendamento.client.name}</p>
            <p className="text-sm opacity-90">{d.proximoAgendamento.service.name} · {d.proximoAgendamento.startTime}</p>
          </div>
          {d.proximoAgendamento.client.phone && (
            <a href={`tel:${d.proximoAgendamento.client.phone}`}
              className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Phone className="w-3.5 h-3.5" /> Ligar
            </a>
          )}
        </div>
      )}

      {/* Resumo do mês */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" /> Minha produção este mês
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-zinc-900">{d.mes.atendimentos}</p>
            <p className="text-xs text-zinc-400">atendimentos</p>
            <p className="text-xs text-zinc-400 mt-0.5">{d.mes.avulso} avulsos · {d.mes.assinatura} assinaturas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(d.mes.faturado)}</p>
            <p className="text-xs text-zinc-400">faturado</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(d.mes.comissao)}</p>
            <p className="text-xs text-zinc-400">sua comissão</p>
          </div>
        </div>
      </div>

      {/* Agenda do dia com navegação */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-zinc-900">Agenda</h2>
            {isToday && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Hoje</span>}
          </div>

          <div className="flex items-center gap-2">
            {/* Stats da data selecionada */}
            <div className="hidden sm:flex items-center gap-3 mr-3 text-xs text-zinc-400">
              <span className="font-semibold text-green-600">{doneAppts.length} feitos</span>
              <span className="font-semibold text-amber-600">{pendingAppts.length} pendentes</span>
              {agendaFaturado > 0 && <span className="font-semibold text-zinc-700">{formatCurrency(agendaFaturado)}</span>}
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-1 bg-zinc-50 rounded-lg border border-zinc-200 px-2 py-1">
              <button onClick={prevDay} className="p-1 rounded hover:bg-zinc-200 transition-colors">
                <ChevronLeft className="w-4 h-4 text-zinc-500" />
              </button>
              <input
                type="date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="text-xs text-zinc-700 bg-transparent border-none outline-none w-32 text-center"
              />
              <button onClick={nextDay} className="p-1 rounded hover:bg-zinc-200 transition-colors">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>

        {agendaAppts.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-zinc-400">
            <Calendar className="w-10 h-10 mb-3" />
            <p className="text-sm">Nenhum agendamento neste dia</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {agendaAppts.map((a) => (
              <div key={a.id} className={`px-5 py-4 flex items-start gap-4 ${a.status === "DONE" ? "opacity-70" : a.status === "CANCELLED" ? "opacity-40" : ""}`}>
                {/* Horário */}
                <div className="text-center w-14 shrink-0 pt-0.5">
                  <p className="text-base font-bold text-zinc-900">{a.startTime}</p>
                  <p className="text-xs text-zinc-400">{a.service.duration}min</p>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 font-bold text-amber-700 text-sm">
                  {getInitials(a.client.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-zinc-900">{a.client.name}</p>
                    <Badge status={a.status} />
                    {a.subscription ? (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {a.subscription.plan.name}
                      </span>
                    ) : (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Avulso</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{a.service.name}</p>
                  {a.client.phone && (
                    <a href={`tel:${a.client.phone}`} className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {a.client.phone}
                    </a>
                  )}
                  <StatusActions appt={a} onUpdate={updateStatus} />
                </div>

                {/* Valor */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-900">{formatCurrency(a.price)}</p>
                  {a.status === "DONE" && (
                    <p className="text-xs text-green-600">✓</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
