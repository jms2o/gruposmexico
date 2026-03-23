import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check, Users, Volume2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

const SoundPackagesPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { data: packages } = useQuery({
    queryKey: ["sound-packages-public"],
    queryFn: async () => {
      const { data } = await supabase.from("sound_packages").select("*").eq("visible", true).order("sort_order");
      return data || [];
    },
  });

  const { data: allPhotos } = useQuery({
    queryKey: ["all-package-photos"],
    queryFn: async () => {
      const { data } = await supabase.from("package_photos").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: allVideos } = useQuery({
    queryKey: ["all-package-videos"],
    queryFn: async () => {
      const { data } = await supabase.from("package_videos").select("*").order("sort_order");
      return data || [];
    },
  });

  const getPhotos = (pkgId: string) => (allPhotos || []).filter((p: any) => p.package_id === pkgId);
  const getVideos = (pkgId: string) => (allVideos || []).filter((v: any) => v.package_id === pkgId);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(30,15%,5%)]">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[hsla(40,65%,50%,0.06)] blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        <div className="relative z-10 pt-28 pb-12 px-4 text-center">
          <nav className="flex items-center justify-center gap-1.5 text-sm font-body text-white/50 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gold-light font-semibold">Paquetes de Sonido</span>
          </nav>

          <Volume2 className="w-12 h-12 text-gold mx-auto mb-5" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white mb-4">
            Paquetes de <span className="text-gradient-gold">Sonido</span>
          </h1>
          <p className="text-white/60 font-body max-w-2xl mx-auto text-lg">
            Equipos de sonido profesional para cualquier tipo de evento. Elige el paquete ideal y combínalo con tu grupo musical favorito.
          </p>
          <div className="section-divider mt-6" />
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-background min-h-[40vh]">
        <div className="container px-4">
          {!packages?.length ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-lg">No hay paquetes disponibles todavía.</p>
              <Link to="/" className="inline-flex mt-4 btn-gold px-6 py-3 text-sm">Volver al inicio</Link>
            </div>
          ) : (
            <div className="space-y-24">
              {packages.map((pkg: any, idx: number) => {
                const features = Array.isArray(pkg.features) ? pkg.features : [];
                const photos = getPhotos(pkg.id);
                const videos = getVideos(pkg.id);
                const hasMedia = photos.length > 0 || videos.length > 0;

                return (
                  <div key={pkg.id} className="space-y-8">
                    {/* Package Banner */}
                    <div className="relative rounded-3xl overflow-hidden min-h-[280px] md:min-h-[360px] group gold-border">
                      {pkg.image_url ? (
                        <>
                          <img src={pkg.image_url} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,5%,0.9)] via-[hsl(30,15%,5%,0.4)] to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-card via-muted to-card" />
                      )}
                      <div className="relative z-[1] p-8 md:p-12 flex flex-col justify-end h-full min-h-[280px] md:min-h-[360px]">
                        {pkg.badge && (
                          <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-gradient-gold text-[hsl(30,15%,5%)] text-xs font-body font-bold mb-4 shadow-lg">
                            {pkg.badge}
                          </span>
                        )}
                        <h2 className={`text-3xl md:text-5xl font-display font-bold mb-2 ${pkg.image_url ? "text-white" : "text-foreground"}`}>
                          {pkg.name}
                        </h2>
                        {pkg.capacity && (
                          <p className={`flex items-center gap-2 font-body text-sm mb-3 ${pkg.image_url ? "text-white/80" : "text-muted-foreground"}`}>
                            <Users className="w-4 h-4" /> {pkg.capacity}
                          </p>
                        )}
                        {pkg.description && (
                          <p className={`font-body max-w-xl text-base ${pkg.image_url ? "text-white/80" : "text-muted-foreground"}`}>
                            {pkg.description}
                          </p>
                        )}
                        <p className="font-display font-bold text-3xl mt-4 text-gradient-gold inline-block">
                          {Number(pkg.price) === 0 ? "Incluido" : `$${Number(pkg.price).toLocaleString()} MXN`}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="rounded-2xl gold-border bg-card p-6 md:p-8">
                        <h3 className="font-display font-bold text-foreground text-xl mb-5">Lo que incluye</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {features.map((f: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-body text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
                              <Check className="w-4 h-4 text-gold flex-shrink-0" /> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Media */}
                    {hasMedia && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {photos.length > 0 && (
                          <div>
                            <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">📷 Galería</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {photos.map((p: any, pi: number) => (
                                <div key={p.id} className={`rounded-2xl overflow-hidden gold-border group ${pi === 0 ? "col-span-2" : ""}`}>
                                  <img src={p.image_url} alt="" className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${pi === 0 ? "aspect-[16/9]" : "aspect-square"}`} loading="lazy" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {videos.length > 0 && (
                          <div>
                            <h3 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">🎬 Videos</h3>
                            <div className="space-y-4">
                              {videos.map((v: any) => {
                                const ytId = v.youtube_url ? extractYtId(v.youtube_url) : null;
                                return (
                                  <div key={v.id} className="rounded-2xl overflow-hidden gold-border">
                                    <div className="aspect-video">
                                      {v.video_url ? (
                                        <video src={v.video_url} controls className="w-full h-full object-cover" />
                                      ) : ytId ? (
                                        <iframe src={`https://www.youtube.com/embed/${ytId}`} title={v.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                      ) : null}
                                    </div>
                                    {v.title && (
                                      <div className="p-3 bg-card">
                                        <p className="font-body text-sm text-foreground font-semibold">{v.title}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {idx < packages.length - 1 && <div className="section-divider" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Back CTA */}
      <section className="py-12 bg-muted text-center">
        <Link to="/" className="btn-gold px-8 py-4 text-base inline-flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Volver al inicio
        </Link>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default SoundPackagesPage;
