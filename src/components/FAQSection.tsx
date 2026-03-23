import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useVisibleFaqs, useSiteContent } from "@/hooks/useData";
import { HelpCircle } from "lucide-react";

const FAQSection = () => {
  const { data: faqs } = useVisibleFaqs();
  const { data: content } = useSiteContent("faqs");

  const get = (key: string, fallback: string) => {
    const item = content?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  return (
    <section className="py-24 bg-muted" id="faq">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-3">
          <HelpCircle className="w-6 h-6 text-gold" />
          <h2 className="text-3xl md:text-5xl font-display font-bold text-center text-foreground">
            {get("title", "Preguntas")} <span className="text-gradient-gold">{get("title_accent", "frecuentes")}</span>
          </h2>
        </div>
        <p className="text-center text-muted-foreground mb-4 font-body">
          {get("subtitle", "Todo lo que necesitas saber antes de contratar")}
        </p>
        <div className="section-divider mb-14" />

        <Accordion type="single" collapsible className="space-y-4">
          {(faqs || []).map((faq: any, i: number) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${i}`}
              className="bg-card gold-border rounded-2xl px-6 shadow-sm data-[state=open]:shadow-md data-[state=open]:border-gold/30 transition-all"
            >
              <AccordionTrigger className="font-body font-semibold text-foreground text-left hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-body leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
