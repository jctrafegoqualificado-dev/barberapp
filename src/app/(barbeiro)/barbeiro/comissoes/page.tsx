"use client";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Appointment {
  id: string; date: string; startTime: string; status: string; price: number;
  client: { name: string };
  service: { name: string };
}

export default function ComissoesPage() {
  const { token } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [commission, setCommission] = useState(50);

  useEffect(() => {
    fetch("/api/barbershop/appointments", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setAppointments((d.appointments || []).filter((a: Appointment) => a.status === "DONE"));
      });
  }, [token]);

  const totalRevenue = appointments.reduce((s, a) => s + a.price, 0);
  const totalCommission = totalRevenue * (commission / 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Minhas Comissões</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total faturado</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Minha comissão ({commission}%)</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-5 text-center">
          <p className="text-sm text-zinc-500 mb-2">Atendimentos</p>
          <p className="text-3xl font-bold text-zinc-900">{appointments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Histórico de Atendimentos</h2>
        </div>
        <div className="divide-y divide-zinc-50">
          {appointments.map((a) => (
            <div key={a.id} className="px-6 py-3 flex items-center gap-4">
              <div className="text-center w-20">
                <p className="text-xs text-zinc-500">{formatDate(a.date)}</p>
                <p className="text-sm font-medium text-zinc-700">{a.startTime}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">{a.client.name}</p>
                <p className="text-xs text-zinc-400">{a.service.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-900">{formatCurrency(a.price)}</p>
                <p className="text-xs text-amber-600 font-medium">+{formatCurrency(a.price * commission / 100)}</p>
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="py-12 text-center text-zinc-400">
              <p>Nenhum atendimento registrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
