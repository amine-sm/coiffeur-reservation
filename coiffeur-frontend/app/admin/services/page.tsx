"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { authService } from "@/lib/authService";
import { serviceService } from "@/lib/serviceService";
import type { Service } from "@/lib/types";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Scissors,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const goldText =
  "bg-gradient-to-b from-[#FDE68A] via-[#F59E0B] to-[#B45309] bg-clip-text text-transparent";

const goldBg = "bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#D97706]";

const inputClass =
  "w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all sm:text-sm " +
  "bg-white text-slate-900 placeholder-slate-400 border-slate-200 " +
  "focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 " +
  "dark:bg-[#111111] dark:text-white dark:placeholder-gray-500 dark:border-white/10";

const cardClass =
  "rounded-[26px] border p-4 shadow-xl sm:rounded-3xl sm:p-6 " +
  "bg-white border-slate-200 shadow-slate-200/50 " +
  "dark:bg-[#0D0D0D] dark:border-white/10 dark:shadow-black/30";

type AlertState = {
  type: "success" | "error" | "info" | "warning";
  message: string;
} | null;

const initialServiceForm = {
  id: "",
  nom: "",
  duree: "",
  prix: "",
  image: null as File | null,
  imagePreview: "",
  oldImageUrl: "",
  description: "",
  statut: "actif",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue.";
}

export default function AdminServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(initialServiceForm);
  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const checkAuth = useCallback(() => {
    if (!authService.isAuthenticated()) {
      router.push("/admin/login");
      return false;
    }

    return true;
  }, [router]);

  function setPrettyAlert(
    type: "success" | "error" | "info" | "warning",
    message: string,
  ) {
    setAlert({ type, message });

    setTimeout(() => {
      setAlert(null);
    }, 4500);
  }

  async function loadServices() {
    if (!checkAuth()) return;

    setLoading(true);

    try {
      const res = await serviceService.getAll();

      if (res.success && res.data) {
        setServices(res.data);
      } else {
        setPrettyAlert("error", res.message || "Erreur chargement services.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, [checkAuth]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setPrettyAlert(
        "warning",
        "Format image invalide. Utilisez JPG, PNG ou WEBP.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPrettyAlert("warning", "Image trop grande. Maximum 5 MB.");
      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  function resetForm() {
    if (form.imagePreview) {
      URL.revokeObjectURL(form.imagePreview);
    }

    setForm(initialServiceForm);
  }

  function editService(service: Service) {
    setForm({
      id: String(service.id),
      nom: service.nom || "",
      duree: String(service.duree || ""),
      prix: String(service.prix || ""),
      image: null,
      imagePreview: "",
      oldImageUrl: service.image_url || service.image || "",
      description: service.description || "",
      statut: service.statut || "actif",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submitService(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nom.trim()) {
      setPrettyAlert("warning", "Le nom du service est obligatoire.");
      return;
    }

    if (!form.duree || Number(form.duree) <= 0) {
      setPrettyAlert("warning", "La durée doit être supérieure à 0.");
      return;
    }

    if (!form.prix || Number(form.prix) < 0) {
      setPrettyAlert("warning", "Le prix est invalide.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      data.append("nom", form.nom.trim());
      data.append("duree", form.duree);
      data.append("prix", form.prix);
      data.append("description", form.description || "");
      data.append("statut", form.statut || "actif");

      if (form.image) {
        data.append("image", form.image);
      }

      const res = form.id
        ? await serviceService.update(Number(form.id), data)
        : await serviceService.create(data);

      if (res.success) {
        setPrettyAlert(
          "success",
          form.id
            ? "Service modifié avec succès."
            : "Service ajouté avec succès.",
        );

        resetForm();
        await loadServices();
      } else {
        setPrettyAlert("error", res.message || "Erreur opération service.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id: number) {
    const ok = window.confirm("Voulez-vous vraiment supprimer ce service ?");

    if (!ok) return;

    try {
      const res = await serviceService.delete(id);

      if (res.success) {
        setPrettyAlert("success", "Service supprimé avec succès.");
        await loadServices();
      } else {
        setPrettyAlert("error", res.message || "Erreur suppression service.");
      }
    } catch (error) {
      setPrettyAlert("error", getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050505] dark:text-white">
      <AdminHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              <Scissors size={15} />
              Gestion services
            </div>

            <h1 className={`mt-3 text-3xl font-serif font-black ${goldText}`}>
              Services du salon
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-gray-400">
              Ajoutez, modifiez et organisez les prestations du salon.
            </p>
          </div>

          <button
            type="button"
            onClick={loadServices}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-400 hover:text-black dark:text-amber-300"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
        </div>

        {alert && (
          <div
            className={`mb-6 rounded-3xl border p-4 text-sm font-bold ${
              alert.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600"
                : alert.type === "warning"
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-600"
                  : alert.type === "info"
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-600"
                    : "border-red-400/30 bg-red-500/10 text-red-600"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{alert.message}</span>

              <button type="button" onClick={() => setAlert(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <section className={cardClass}>
            <h2
              className={`flex items-center gap-2 text-xl font-serif font-bold ${goldText}`}
            >
              {form.id ? <Pencil size={20} /> : <Plus size={20} />}
              {form.id ? "Modifier le service" : "Ajouter un service"}
            </h2>

            <form onSubmit={submitService} className="mt-6 space-y-4">
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                placeholder="Nom du service"
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="duree"
                  type="number"
                  value={form.duree}
                  onChange={handleChange}
                  required
                  placeholder="Durée"
                  className={inputClass}
                />

                <input
                  name="prix"
                  type="number"
                  value={form.prix}
                  onChange={handleChange}
                  required
                  placeholder="Prix"
                  className={inputClass}
                />
              </div>

              <select
                name="statut"
                value={form.statut}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="actif">✅ Actif</option>
                <option value="inactif">❌ Inactif</option>
              </select>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Description du service"
                className={inputClass}
              />

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-white/15 dark:bg-white/[0.03]">
                {form.imagePreview || form.oldImageUrl ? (
                  <img
                    src={form.imagePreview || form.oldImageUrl}
                    alt="Aperçu service"
                    className="mb-4 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-[#111111]">
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus size={34} />
                      <span className="text-sm font-bold">Aucune photo</span>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-black file:text-black hover:file:bg-amber-300 dark:border-white/10 dark:bg-[#111111] dark:text-white"
                />

                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-gray-400">
                  JPG, PNG, WEBP. Maximum 5 MB.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full rounded-2xl px-5 py-3 font-black text-black transition hover:opacity-90 disabled:opacity-50 ${goldBg}`}
              >
                {saving
                  ? "Traitement..."
                  : form.id
                    ? "Modifier le service"
                    : "Ajouter le service"}
              </button>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Annuler la modification
                </button>
              )}
            </form>
          </section>

          <section className={cardClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className={`text-xl font-serif font-bold ${goldText}`}>
                  Liste des services
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-gray-400">
                  {services.length} service(s) enregistré(s)
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              </div>
            ) : services.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15">
                <Scissors className="mx-auto mb-3 text-slate-400" size={42} />
                <p className="font-bold text-slate-500">
                  Aucun service enregistré.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex h-full min-h-[430px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#111111]"
                  >
                    {service.image_url || service.image ? (
                      <img
                        src={service.image_url || service.image || ""}
                        alt={service.nom}
                        className="h-40 w-full shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-40 shrink-0 items-center justify-center bg-slate-100 text-slate-400 dark:bg-white/5">
                        <UploadCloud size={34} />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-white">
                            {service.nom}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-gray-400">
                            {service.duree} min · {Number(service.prix || 0).toLocaleString("fr-FR")} DZD
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${
                            service.statut === "inactif"
                              ? "border-red-400/30 bg-red-400/10 text-red-600"
                              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-600"
                          }`}
                        >
                          {service.statut === "inactif" ? "Inactif" : "Actif"}
                        </span>
                      </div>

                      <div className="mt-3 min-h-[72px]">
                        {service.description ? (
                          <p className="line-clamp-3 text-sm leading-6 text-slate-500 dark:text-gray-400">
                            {service.description}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold italic leading-6 text-slate-400 dark:text-gray-600">
                            Aucune description.
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-end gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => editService(service)}
                          title="Modifier"
                          aria-label="Modifier"
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 transition hover:bg-amber-400 hover:text-black dark:text-amber-300"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteService(service.id)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-red-600 transition hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}