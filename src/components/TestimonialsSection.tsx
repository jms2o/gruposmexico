import { Star, Quote } from "lucide-react";
import { useVisibleTestimonials, useSiteContent } from "@/hooks/useData";

const TestimonialsSection = () => {
  const { data: testimonials } = useVisibleTestimonials();
  const { data: content } = useSiteContent("testimonials");

  const get = (key: string, fallback: string) => {
    const item = content?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  return (
    <section className="py-24 bg-background" id="testimonios">
      <div className="container px-4">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-3 text-foreground">
          {get("title", "Lo que dicen")} <span className="text-gradient-gold">{get("title_accent", "nuestros clientes")}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-lg mx-auto font-body">
          {get("subtitle", "Más de 500 eventos exitosos en todo México")}
        </p>
        <div className="section-divider mb-14" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(testimonials || []).map((t: any) => (
            <div key={t.id} className="rounded-2xl p-7 relative gold-border bg-card transition-all duration-300 hover:shadow-[0_0_30px_-8px_hsla(40,65%,50%,0.15)]">
              <Quote className="absolute top-5 right-5 w-8 h-8 text-gold/15" />
              <div className="flex items-center gap-1 mb-5">
                {[...Array(t.rating)].map((_: any, i: number) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-foreground font-body mb-6 leading-relaxed text-[15px]">
                "{t.text}"
              </p>
              <div className="border-t border-border pt-4 flex items-center gap-3">
                {t.photo_url && (
                  <img src={t.photo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-gold/20" />
                )}
                <div>
                  <p className="font-body font-bold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.event_type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
