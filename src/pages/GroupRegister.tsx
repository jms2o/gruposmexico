import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Music, ChevronLeft, ChevronDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

import { ESTADOS_CIUDADES, ESTADOS } from "@/lib/locationData";

const groupTypes = ["Mariachi", "DJ", "Versátil", "Sierreño", "Banda Sinaloense", "Norteño", "Otro"];

const GroupRegister = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    group_name: "",
    group_type: "Versátil",
    phone: "",
    whatsapp: "",
    state: "Sinaloa",
    city: "Mazatlán",
    instagram: "",
    facebook: "",
    tiktok: "",
    description: "",
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Reset city when state changes
  useEffect(() => {
    const cities = ESTADOS_CIUDADES[form.state];
    if (cities && cities.length > 0 && !cities.includes(form.city)) {
      setForm(prev => ({ ...prev, city: cities[0] }));
    }
  }, [form.state]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("group_profiles").insert({
        user_id: user.id,
        group_name: form.group_name,
        group_type: form.group_type,
        phone: form.phone,
        whatsapp: form.whatsapp,
        state: form.state,
        city: form.city,
        social_media: { instagram: form.instagram, facebook: form.facebook, tiktok: form.tiktok },
        description: form.description,
      });
      if (error) throw error;
      toast.success("¡Grupo registrado! Selecciona tu membresía.");
      navigate("/membresias");
    } catch (err: any) {
      toast.error(err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  const ciudades = ESTADOS_CIUDADES[form.state] || [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-16">
        <div className="container px-4 max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Music className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-display font-bold text-foreground">Registrar mi grupo</h1>
          </div>
          <p className="text-muted-foreground font-body mb-8">Completa tu perfil para aparecer en la plataforma</p>

          <form onSubmit={handleSubmit} className="card-premium p-7 md:p-10 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Nombre del grupo *</label>
                <input required type="text" maxLength={100} value={form.group_name} onChange={update("group_name")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="Ej. Los Auténticos" />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Tipo de grupo *</label>
                <select required value={form.group_type} onChange={update("group_type")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none">
                  {groupTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Teléfono</label>
                <input type="tel" maxLength={15} value={form.phone} onChange={update("phone")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="669 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">WhatsApp</label>
                <input type="tel" maxLength={15} value={form.whatsapp} onChange={update("whatsapp")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="5216691234567" />
              </div>
            </div>

            {/* State and City selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Estado *</label>
                <select required value={form.state} onChange={update("state")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none">
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Ciudad *</label>
                <select required value={form.city} onChange={update("city")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none">
                  {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Instagram</label>
                <input type="text" maxLength={100} value={form.instagram} onChange={update("instagram")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="@tugrupo" />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Facebook</label>
                <input type="text" maxLength={200} value={form.facebook} onChange={update("facebook")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="facebook.com/tugrupo" />
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">TikTok</label>
                <input type="text" maxLength={100} value={form.tiktok} onChange={update("tiktok")}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                  placeholder="@tugrupo" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Descripción del grupo</label>
              <textarea rows={4} maxLength={1000} value={form.description} onChange={update("description")}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none resize-none"
                placeholder="Cuéntanos sobre tu grupo, experiencia, tipo de eventos..." />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-foreground text-background font-body font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Registrando..." : "Registrar grupo"}
            </button>
            <p className="text-center text-xs text-muted-foreground font-body">
              Tu perfil quedará en estado <span className="text-gold font-semibold">🟡 Pendiente de aprobación</span> hasta que el administrador lo revise.
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default GroupRegister;
