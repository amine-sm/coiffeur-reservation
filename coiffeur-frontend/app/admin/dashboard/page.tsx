"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/authService";
import { dashboardService } from "@/lib/dashboardService";
import { serviceService } from "@/lib/serviceService";
import { rendezvousService } from "@/lib/rendezvousService";
import { creneauService } from "@/lib/creneauService";
import type {
  Creneau,
  DashboardStats,
  Rendezvous,
  RendezvousStatut,
  Service,
} from "@/lib/types";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  LogOut,
  Plus,
  RefreshCcw,
  Scissors,
  Trash2,
} from "lucide-react";

function formatDateOnly(value: string | Date | null | undefined) {
  if (!value) return "-";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return text;
}

function formatTimeOnly(value: string | null | undefined) {
  if (!value) return "-";

  return String(value).slice(0, 5);
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [serviceForm, setServiceForm] = useState({
    id: "",
    nom: "",
    duree: "",
    prix: "",
    image: "",
    description: "",
    statut: "actif",
  });

  const [creneauForm, setCreneauForm] = useState({
    service_id: "",
    date_creneau: "",
    heure: "",
    minute: "30",
  });

  const [rdvFilter, setRdvFilter] = useState({
    statut: "",
    date: "",
  });

  function checkAuth() {
    const isAuth = authService.isAuthenticated();

    if (!isAuth) {
      router.push("/admin/login");
      return false;
    }

    return true;
  }

  async function loadData() {
    if (!checkAuth()) return;

    setLoading(true);

    try {
      const statsRes = await dashboardService.getStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const servicesRes = await serviceService.getAll();
      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      }

      const rdvRes = await rendezvousService.getAll({
        statut: rdvFilter.statut || undefined,
        date: rdvFilter.date || undefined,
      });

      if (rdvRes.success && rdvRes.data) {
        setRendezvous(rdvRes.data);
      }

      const creneauxRes = await creneauService.getAllAdmin();

      if (creneauxRes.success && creneauxRes.data) {
        setCreneaux(creneauxRes.data);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur chargement dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function logout() {
    authService.logout();
    router.push("/admin/login");
  }

  function handleServiceChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setServiceForm({
      ...serviceForm,
      [e.target.name]: e.target.value,
    });
  }

  function editService(service: Service) {
    setServiceForm({
      id: String(service.id),
      nom: service.nom || "",
      duree: String(service.duree || ""),
      prix: String(service.prix || ""),
      image: service.image || "",
      description: service.description || "",
      statut: service.statut || "actif",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetServiceForm() {
    setServiceForm({
      id: "",
      nom: "",
      duree: "",
      prix: "",
      image: "",
      description: "",
      statut: "actif",
    });
  }

  async function saveService(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const duree = Number(serviceForm.duree);
    const prix = Number(serviceForm.prix);

    if (!serviceForm.nom.trim()) {
      setMessage("❌ Le nom du service est obligatoire");
      return;
    }

    if (!duree || duree <= 0) {
      setMessage("❌ Durée invalide");
      return;
    }

    if (prix < 0) {
      setMessage("❌ Prix invalide");
      return;
    }

    const body = {
      nom: serviceForm.nom.trim(),
      duree,
      prix,
      image: serviceForm.image.trim(),
      description: serviceForm.description.trim(),
      statut: serviceForm.statut,
    };

    const res = serviceForm.id
      ? await serviceService.update(serviceForm.id, body)
      : await serviceService.create(body);

    if (res.success) {
      setMessage("✅ Service enregistré avec succès");
      resetServiceForm();
      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur service"));
    }
  }

  async function deleteService(id: number) {
    if (!confirm("Supprimer ce service ?")) return;

    const res = await serviceService.delete(id);

    if (res.success) {
      setMessage("✅ Service supprimé");
      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur suppression service"));
    }
  }

  function handleCreneauChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setCreneauForm({
      ...creneauForm,
      [e.target.name]: e.target.value,
    });
  }

  function normalizeHourInput(value: string) {
    const clean = value.trim();

    if (!clean) return "";

    if (/^\d{1,2}$/.test(clean)) {
      const h = Number(clean);

      if (h < 0 || h > 23) return "";

      return String(h).padStart(2, "0");
    }

    return "";
  }

  async function saveCreneaux(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!creneauForm.service_id) {
      setMessage("❌ Choisissez un service");
      return;
    }

    if (!creneauForm.date_creneau) {
      setMessage("❌ Choisissez une date");
      return;
    }

    const heure = normalizeHourInput(creneauForm.heure);

    if (!heure) {
      setMessage("❌ Heure invalide. Tapez seulement l’heure, exemple : 09 ou 14");
      return;
    }

    const heureFinale = `${heure}:${creneauForm.minute}`;

    const res = await creneauService.create({
      service_id: creneauForm.service_id,
      date_creneau: creneauForm.date_creneau,
      heure_creneau: heureFinale,
      statut: "disponible",
    });

    if (res.success) {
      setMessage(`✅ Créneau ${heureFinale} ajouté avec succès`);

      setCreneauForm({
        service_id: "",
        date_creneau: "",
        heure: "",
        minute: "30",
      });

      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur ajout créneau"));
    }
  }

  async function deleteCreneau(id: number) {
    if (!confirm("Supprimer ce créneau ?")) return;

    const res = await creneauService.delete(id);

    if (res.success) {
      setMessage("✅ Créneau supprimé");
      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur suppression créneau"));
    }
  }

  async function updateRdvStatut(id: number, statut: RendezvousStatut) {
    const res = await rendezvousService.updateStatut(id, { statut });

    if (res.success) {
      setMessage("✅ Statut rendez-vous modifié");
      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur statut"));
    }
  }

  async function deleteRdv(id: number) {
    if (!confirm("Supprimer ce rendez-vous ?")) return;

    const res = await rendezvousService.delete(id);

    if (res.success) {
      setMessage("✅ Rendez-vous supprimé");
      loadData();
    } else {
      setMessage("❌ " + (res.message || "Erreur suppression RDV"));
    }
  }

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setRdvFilter({
      ...rdvFilter,
      [e.target.name]: e.target.value,
    });
  }

  async function applyFilters() {
    await loadData();
  }

  async function resetFilters() {
    setRdvFilter({
      statut: "",
      date: "",
    });

    setTimeout(() => {
      loadData();
    }, 100);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B4F59] text-white">
              <Scissors />
            </div>

            <div>
              <h1 className="text-xl font-black text-[#1B4F59]">
                Dashboard Admin
              </h1>
              <p className="text-xs text-slate-500">
                Services, rendez-vous et créneaux
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && (
          <div className="mb-6 rounded-2xl bg-white p-4 text-sm font-black text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-2xl bg-white p-4 text-sm font-black text-slate-500 shadow-sm">
            Chargement dashboard...
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total RDV"
            value={stats?.total_rendezvous || 0}
            icon={<CalendarDays />}
          />

          <StatCard
            title="En attente"
            value={stats?.rendezvous_en_attente || 0}
            icon={<Clock />}
          />

          <StatCard
            title="Confirmés"
            value={stats?.rendezvous_confirmes || 0}
            icon={<CheckCircle />}
          />

          <StatCard
            title="Disponibles"
            value={stats?.creneaux_disponibles || 0}
            icon={<CheckCircle />}
          />

          <StatCard
            title="Recette"
            value={`${stats?.recette_totale || 0} DZD`}
            icon={<DollarSign />}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#1B4F59]">
              <Plus size={20} />
              {serviceForm.id ? "Modifier service" : "Ajouter service"}
            </h2>

            <form onSubmit={saveService} className="mt-6 space-y-4">
              <input
                name="nom"
                value={serviceForm.nom}
                onChange={handleServiceChange}
                required
                placeholder="Nom service"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="duree"
                  type="number"
                  value={serviceForm.duree}
                  onChange={handleServiceChange}
                  required
                  placeholder="Durée min"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
                />

                <input
                  name="prix"
                  type="number"
                  value={serviceForm.prix}
                  onChange={handleServiceChange}
                  required
                  placeholder="Prix DZD"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
                />
              </div>

              <input
                name="image"
                value={serviceForm.image}
                onChange={handleServiceChange}
                placeholder="URL image"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              />

              <textarea
                name="description"
                value={serviceForm.description}
                onChange={handleServiceChange}
                rows={4}
                placeholder="Description"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              />

              <select
                name="statut"
                value={serviceForm.statut}
                onChange={handleServiceChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>

              <button className="w-full rounded-2xl bg-[#FE5737] px-5 py-3 font-black text-white hover:opacity-90">
                {serviceForm.id ? "Modifier" : "Ajouter"}
              </button>

              {serviceForm.id && (
                <button
                  type="button"
                  onClick={resetServiceForm}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 hover:bg-slate-200"
                >
                  Annuler modification
                </button>
              )}
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#1B4F59]">
              Liste des services
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Nom</th>
                    <th className="py-3">Durée</th>
                    <th className="py-3">Prix</th>
                    <th className="py-3">Statut</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b last:border-0">
                      <td className="py-3 font-black text-slate-800">
                        {service.nom}
                      </td>

                      <td className="py-3">{service.duree} min</td>

                      <td className="py-3">{service.prix} DZD</td>

                      <td className="py-3">
                        <span
                          className={
                            service.statut === "inactif"
                              ? "rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                              : "rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700"
                          }
                        >
                          {service.statut || "actif"}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => editService(service)}
                          className="mr-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => deleteService(service.id)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {services.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  Aucun service pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#1B4F59]">
              Publier un créneau
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Tapez seulement l’heure, puis choisissez les minutes.
            </p>

            <form onSubmit={saveCreneaux} className="mt-6 space-y-4">
              <select
                name="service_id"
                value={creneauForm.service_id}
                onChange={handleCreneauChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              >
                <option value="">Choisir service</option>

                {services
                  .filter((service) => service.statut !== "inactif")
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nom}
                    </option>
                  ))}
              </select>

              <input
                type="date"
                name="date_creneau"
                value={creneauForm.date_creneau}
                onChange={handleCreneauChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
              />

              <div className="grid grid-cols-[1fr_120px] gap-3">
                <input
                  name="heure"
                  value={creneauForm.heure}
                  onChange={handleCreneauChange}
                  required
                  maxLength={2}
                  placeholder="09"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
                />

                <select
                  name="minute"
                  value={creneauForm.minute}
                  onChange={handleCreneauChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#FE5737]"
                >
                  <option value="00">:00</option>
                  <option value="15">:15</option>
                  <option value="30">:30</option>
                  <option value="45">:45</option>
                </select>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                Exemple : tapez <span className="text-[#1B4F59]">09</span> et
                choisissez <span className="text-[#FE5737]">:30</span> pour créer{" "}
                <span className="text-[#1B4F59]">09:30</span>.
              </div>

              <button className="w-full rounded-2xl bg-[#1B4F59] px-5 py-3 font-black text-white hover:opacity-90">
                Ajouter ce créneau
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#1B4F59]">
              Créneaux publiés
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Service</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Heure</th>
                    <th className="py-3">Statut</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {creneaux.map((creneau) => (
                    <tr key={creneau.id} className="border-b last:border-0">
                      <td className="py-3 font-black text-slate-800">
                        {creneau.service_nom || "-"}
                      </td>

                      <td className="py-3">
                        {formatDateOnly(creneau.date_creneau)}
                      </td>

                      <td className="py-3">
                        {formatTimeOnly(creneau.heure_creneau)}
                      </td>

                      <td className="py-3">
                        <CreneauBadge statut={creneau.statut} />
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteCreneau(creneau.id)}
                          disabled={creneau.statut === "reserve"}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {creneaux.length === 0 && (
                <p className="py-8 text-center text-slate-500">
                  Aucun créneau publié.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1B4F59]">
                Rendez-vous clients
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Confirmer, terminer, annuler ou supprimer un rendez-vous.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <select
                name="statut"
                value={rdvFilter.statut}
                onChange={handleFilterChange}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#FE5737]"
              >
                <option value="">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmé</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>

              <input
                type="date"
                name="date"
                value={rdvFilter.date}
                onChange={handleFilterChange}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#FE5737]"
              />

              <button
                onClick={applyFilters}
                className="rounded-2xl bg-[#1B4F59] px-4 py-2 text-sm font-black text-white"
              >
                Filtrer
              </button>

              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"
              >
                <RefreshCcw size={15} />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3">Client</th>
                  <th className="py-3">Téléphone</th>
                  <th className="py-3">Service</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Heure</th>
                  <th className="py-3">Statut</th>
                  <th className="py-3">Prix</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rendezvous.map((rdv) => (
                  <tr key={rdv.id} className="border-b last:border-0">
                    <td className="py-3 font-black text-slate-800">
                      {rdv.nom_client} {rdv.prenom_client}
                    </td>

                    <td className="py-3">{rdv.telephone}</td>

                    <td className="py-3">{rdv.service_nom || "-"}</td>

                    <td className="py-3">
                      {formatDateOnly(rdv.date_rdv)}
                    </td>

                    <td className="py-3">
                      {formatTimeOnly(rdv.heure_rdv)}
                    </td>

                    <td className="py-3">
                      <RdvBadge statut={rdv.statut} />
                    </td>

                    <td className="py-3">{rdv.prix} DZD</td>

                    <td className="py-3 text-right">
                      <select
                        value={rdv.statut}
                        onChange={(e) =>
                          updateRdvStatut(
                            rdv.id,
                            e.target.value as RendezvousStatut
                          )
                        }
                        className="mr-2 rounded-xl border border-slate-300 px-2 py-2 text-xs font-black"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirme">Confirmé</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                      </select>

                      <button
                        onClick={() => deleteRdv(rdv.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rendezvous.length === 0 && (
              <p className="py-8 text-center text-slate-500">
                Aucun rendez-vous pour le moment.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-[#1B4F59]">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#FE5737]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CreneauBadge({ statut }: { statut: string }) {
  if (statut === "disponible") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        Disponible
      </span>
    );
  }

  if (statut === "reserve") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        Réservé
      </span>
    );
  }

  return (
    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
      Bloqué
    </span>
  );
}

function RdvBadge({ statut }: { statut: RendezvousStatut }) {
  if (statut === "confirme") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        Confirmé
      </span>
    );
  }

  if (statut === "termine") {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
        Terminé
      </span>
    );
  }

  if (statut === "annule") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        Annulé
      </span>
    );
  }

  return (
    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
      En attente
    </span>
  );
}