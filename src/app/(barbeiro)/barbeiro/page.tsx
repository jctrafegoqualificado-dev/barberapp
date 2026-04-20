"use client";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, UserX, User } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Appointment {
  id: string; startTime: string; endTime: string; status: string; price: number;
  client: { name: string; phone: string | null };
  service: { name: string; duration: number };
  subscription: { plan: { name: string } } | null;
}

export default function BarbeiroAgendaPage() {
  const { token, user } = useAuthStore();
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

  const done = appointments.filter((a) => a.status === "DONE");
  const earnings = done.reduce((s, a) => s + a.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Minha Agenda</h1>
          <p className="text-zinc-500 text-sm">Olá, {user?.name}!</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-4 text-center">
          <p className="text-3xl font-bold text-zinc-900">{appointments.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Agendamentos</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{done.length}</p>
          <p className="text-xs text-green-600 mt-1">Concluídos</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(earnings)}</p>
          <p className="text-xs text-amber-600 mt-1">Faturado hoje</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">{formatDate(new Date(date + "T12:00:00"))}</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-400">
            <Calendar className="w-12 h-12 mb-3" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {appointments.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                <div className="text-center w-14 shrink-0">
                  <p className="text-base font-bold text-zinc-900">{a.startTime}</p>
                  <p className="text-xs text-zinc-400">{a.service.duration}min</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-900">{a.client.name}</p>
                    <Badge status={a.status} />
                    {a.subscription ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Assinante
                      </span>
                    ) : (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                        Avulso
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{a.service.name}</p>
                  {a.client.phone && <p className="text-xs text-zinc-400">📱 {a.client.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-900">{formatCurrency(a.price)}</p>
                  {a.status === "CONFIRMED" && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => updateStatus(a.id, "DONE")} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md hover:bg-green-100">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-0.5" />Feito
                      </button>
                      <button onClick={() => updateStatus(a.id, "NO_SHOW")} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md hover:bg-yellow-100">
                        <UserX className="w-3.5 h-3.5 inline mr-0.5" />Faltou
                      </button>
                    </div>
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
