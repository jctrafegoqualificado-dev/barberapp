"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Scissors, Check, ChevronLeft, Clock, BadgeCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

interface Service { id: string; name: string; price: number; duration: number; description: string | null }
interface Barber { id: string; nickname: string | null; user: { name: string } }
interface Shop { id: string; name: string; slug: string; description: string | null; services: Service[]; barbers: Barber[] }

type Step = "service" | "barber" | "datetime" | "dados" | "confirmado";

export default function AgendarPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [step, setStep] = useState<Step>("service");
  const [selected, setSelected] = useState({ service: "", barber: "", date: "", slot: "" });
  const [slots, setSlots] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState<{ startTime: string } | null>(null);
  const [subscriber, setSubscriber] = useState<{ subscriptionId: string; planName: string; usesThisCycle: number; maxUses: number | null } | null>(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/booking/${slug}`)
      .then((r) => r.json())
      .then((d) => setShop(d.shop));
  }, [slug]);

  useEffect(() => {
    if (selected.barber && selected.service && selected.date) {
      fetch(`/api/booking/${slug}/slots?barberId=${selected.barber}&serviceId=${selected.service}&date=${selected.date}`)
        .then((r) => r.json())
        .then((d) => setSlots(d.slots || []));
    }
  }, [selected.barber, selected.service, selected.date, slug]);

  function sel(key: string, val: string) { setSelected((s) => ({ ...s, [key]: val })); }

  function handleEmailChange(email: string) {
    setForm((f) => ({ ...f, email }));
    setSubscriber(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!email.includes("@")) return;
    setCheckingSub(true);
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/booking/${slug}/subscriber?email=${encodeURIComponent(email)}`);
      const d = await r.json();
      setSubscriber(d.subscriptionId ? d : null);
      setCheckingSub(false);
    }, 600);
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(`/api/booking/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: form.name, clientEmail: form.email, clientPhone: form.phone,
        barberId: selected.barber, serviceId: selected.service,
        date: selected.date, startTime: selected.slot,
        subscriptionId: subscriber?.subscriptionId ?? null,
      }),
    });
    const d = await r.json();
    if (r.ok) { setBooked(d.appointment); setStep("confirmado"); }
    setLoading(false);
  }

  const selectedService = shop?.services.find((s) => s.id === selected.service);
  const selectedBarber = shop?.barbers.find((b) => b.id === selected.barber);

  if (!shop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-3">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          {shop.description && <p className="text-zinc-400 text-sm mt-1">{shop.description}</p>}
        </div>

        {step !== "confirmado" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {(["service", "barber", "datetime", "dados"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-amber-500 text-white" : ["service","barber","datetime","dados"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                  {["service","barber","datetime","dados"].indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < 3 && <div className="w-8 h-0.5 bg-zinc-800" />}
              </div>
            ))}
          </div>
        )}

        {step === "service" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-4">Escolha o serviço</h2>
            {shop.services.map((s) => (
              <button key={s.id} onClick={() => { sel("service", s.id); setStep("barber"); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${selected.service === s.id ? "border-amber-500 bg-amber-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {s.description && <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}min</span>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold text-lg">{formatCurrency(s.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "barber" && (
          <div className="space-y-3">
            <button onClick={() => setStep("service")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-4">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4">Escolha o barbeiro</h2>
            {shop.barbers.map((b) => (
              <button key={b.id} onClick={() => { sel("barber", b.id); setStep("datetime"); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${selected.barber === b.id ? "border-amber-500 bg-amber-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
                <p className="font-semibold">{b.user.name}</p>
                {b.nickname && <p className="text-xs text-zinc-400">{b.nickname}</p>}
              </button>
            ))}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-4">
            <button onClick={() => setStep("barber")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold">Escolha data e horário</h2>
            <input type="date" value={selected.date} onChange={(e) => sel("date", e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
            {selected.date && (
              <div>
                <p className="text-sm text-zinc-400 mb-2">Horários disponíveis:</p>
                {slots.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhum horário disponível</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button key={slot} onClick={() => { sel("slot", slot); setStep("dados"); }}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${selected.slot === slot ? "bg-amber-500 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === "dados" && (
          <div className="space-y-4">
            <button onClick={() => setStep("datetime")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-lg font-semibold">Seus dados</h2>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-1 text-sm">
              <p className="text-zinc-400">Serviço: <span className="text-white font-medium">{selectedService?.name}</span></p>
              <p className="text-zinc-400">Barbeiro: <span className="text-white font-medium">{selectedBarber?.user.name}</span></p>
              <p className="text-zinc-400">Data: <span className="text-white font-medium">{selected.date} às {selected.slot}</span></p>
              {subscriber ? (
                <p className="text-zinc-400">Valor: <span className="text-green-400 font-bold">Coberto pela assinatura</span></p>
              ) : (
                <p className="text-zinc-400">Valor: <span className="text-amber-400 font-bold">{formatCurrency(selectedService?.price || 0)}</span></p>
              )}
            </div>
            <form onSubmit={handleBook} className="space-y-3">
              <Input label="Seu nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="João Silva" className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500" />
              <div>
                <Input label="E-mail" type="email" value={form.email} onChange={(e) => handleEmailChange(e.target.value)} required placeholder="seu@email.com" className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500" />
                {checkingSub && (
                  <p className="mt-1.5 text-xs text-zinc-500 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    Verificando assinatura...
                  </p>
                )}
                {subscriber && (
                  <div className="mt-2 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                    <BadgeCheck className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-400">Assinante ativo — {subscriber.planName}</p>
                      <p className="text-xs text-green-600">
                        {subscriber.maxUses
                          ? `${subscriber.usesThisCycle}/${subscriber.maxUses} usos neste ciclo`
                          : "Usos ilimitados neste ciclo"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Input label="WhatsApp" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(41) 99999-9999" className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500" />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {subscriber ? "Confirmar (Assinatura)" : "Confirmar Agendamento"}
              </Button>
            </form>
          </div>
        )}

        {step === "confirmado" && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Agendado!</h2>
            <p className="text-zinc-400 mb-6">Seu horário foi confirmado.</p>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-left space-y-2 text-sm mb-6">
              <p className="text-zinc-400">Serviço: <span className="text-white">{selectedService?.name}</span></p>
              <p className="text-zinc-400">Barbeiro: <span className="text-white">{selectedBarber?.user.name}</span></p>
              <p className="text-zinc-400">Data: <span className="text-white">{selected.date} às {booked?.startTime}</span></p>
            </div>
            <Button onClick={() => { setStep("service"); setSelected({ service: "", barber: "", date: "", slot: "" }); }} variant="secondary">
              Fazer novo agendamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
