"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ServiceCard from "@/components/ServiceCard";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";
import { Sparkles, Scissors, Clock, Search } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadServices() {
    setLoading(true);
    const res = await serviceService.getAll();
    if (res.success && res.data) setServices(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Header de la page */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-indigo-50/50 blur-[120px] rounded-full" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Catalogue complet
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
              Nos Services <span className="text-indigo-600">Premium</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Découvrez notre sélection de soins et coupes. Des prestations sur-mesure pour un style impeccable.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {loading ? (
          /* SKELETON LOADING ANIMATION */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 w-full animate-pulse rounded-[32px] bg-white border border-slate-100" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-[40px] bg-white border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <Search size={32} />
            </div>
            <p className="text-xl font-bold text-slate-900">Aucun service trouvé</p>
            <p className="text-slate-500">Revenez un peu plus tard !</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}