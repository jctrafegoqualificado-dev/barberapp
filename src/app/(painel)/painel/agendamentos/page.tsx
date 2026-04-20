"use client";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, UserX, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Appointment {
  id: string; startTime: string; endTime: string; status: string; price: number; date: string;
  client: { name: string; phone: string };
  service: { name: string };
  barber: { user: { name: string } };
  subscription: { plan: { name: string } } | null;
}

const STATUS_ACTIONS: Record<string, { next: string; label: string; color: string }[]> = {
  CONFIRMED: [
    { next: "DONE", label: "Concluir", color: "green" },
    { next: "NO_SHOW", label: "Faltou", color: "yellow" },
    { next: "CANCELLED", label: "Cancelar", color: "red" },
  ],
  PENDING: [
    { next: "CONFIRMED", label: "Confirmar", color: "blue" },
    { next: "CANCELLED", label: "Cancelar", color: "red" },
  ],
};

export default function AgendamentosPage() {
  const { token } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  async function load() {
    const r = await fetch(`/api/barbershop/appointments?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    setAppointments(d.appointments || []);
  }

  useEffect(() => { load(); }, [date]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/barbershop/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  const assinantes = appointments.filter((a) => a.subscription);
  const avulsos = appointments.filter((a) => !a.subscription);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Agendamentos</h1>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900">{appointments.length}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total do dia</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-2xl font-bold text-blue-700">{assinantes.length}</p>
          </div>
          <p className="text-xs text-blue-600">Assinantes</p>
        </div>
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-700">{avulsos.length}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Avulsos</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Calendar className="w-12 h-12 mb-3" />
            <p className="font-medium">Nenhum agendamento nesta data</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {appointments.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="text-center w-14 shrink-0">
                    <p className="text-base font-bold text-zinc-900">{a.startTime}</p>
                    <p className="text-xs text-zinc-400">{a.endTime}</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-zinc-900">{a.client.name}</p>
                      <Badge status={a.status} />
                      {a.subscription ? (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          <CreditCard className="w-3 h-3" />
                          {a.subscription.plan.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-zinc-100 text-zinc-500 text-xs font-medium px-2 py-0.5 rounded-full">
                          Avulso
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">{a.service.name} · {a.barber.user.name}</p>
                    {a.client.phone && <p className="text-xs text-zinc-400 mt-0.5">📱 {a.client.phone}</p>}
                  </div>

                  <div className="text-right shrink-0">
                    {a.subscription ? (
                      <p className="text-sm font-bold text-blue-600">Plano</p>
                    ) : (
                      <p className="text-sm font-bold text-zinc-900">{formatCurrency(a.price)}</p>
                    )}
                    <div className="flex gap-1 mt-2 justify-end">
                      {(STATUS_ACTIONS[a.status] || []).map((action) => (
                        <button
                          key={action.next}
                          onClick={() => updateStatus(a.id, action.next)}
                          className={`text-xs px-2 py-1 rounded-md font-medium bg-${action.color}-50 text-${action.color}-700 hover:bg-${action.color}-100 transition-colors`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
