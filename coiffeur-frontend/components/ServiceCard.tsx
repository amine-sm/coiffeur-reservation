import Link from "next/link";
import { ArrowRight, Clock, Tag, Scissors } from "lucide-react";
import type { Service } from "@/lib/types";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-[32px] border border-slate-100 bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-indigo-100">
      
      {/* Conteneur Image/Icone */}
      <div className="relative h-48 w-full overflow-hidden rounded-[26px] bg-slate-50 flex items-center justify-center">
        {/* Background gradient subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icône centrale stylisée */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[22px] bg-white text-indigo-600 shadow-xl shadow-indigo-100/50 transition-transform duration-500 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
          <Scissors size={32} />
        </div>

        {/* Badge Prix flottant */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm">
           <span className="text-lg font-black text-slate-950">{service.price} DA</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                <Tag size={10} />
                Signature
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Clock size={10} />
                {service.duration || "45"} min
            </span>
        </div>

        <h3 className="text-xl font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
          {service.name}
        </h3>
        
        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
          {service.description || "Une expérience de soin complète réalisée par nos meilleurs experts pour un résultat parfait."}
        </p>

        {/* Bouton Action */}
        <div className="mt-6 pt-4 border-t border-slate-50">
            <Link
              href={`/reservation?service=${service.id}`}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] shadow-lg shadow-slate-100 hover:shadow-indigo-100"
            >
              Réserver ce service
              <ArrowRight size={16} />
            </Link>
        </div>
      </div>
    </div>
  );
}