import { useSiteContent, useSectionOrder, useCustomSections } from "@/hooks/useData";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedSection from "@/components/FeaturedSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import QuoteForm from "@/components/QuoteForm";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import CustomSection from "@/components/CustomSection";

const sectionComponents: Record<string, React.ComponentType> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featured: FeaturedSection,
  testimonials: TestimonialsSection,
  faqs: FAQSection,
  quote_form: QuoteForm,
};

const Index = () => {
  const { data: sectionOrder } = useSectionOrder();
  const { data: customSections } = useCustomSections();

  // Sort sections by sort_order and filter visible
  const orderedSections = (sectionOrder || [])
    .filter((s: any) => s.visible)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  return (
    <>
      <Navbar />
      {orderedSections.length > 0 ? (
        orderedSections.map((section: any) => {
          const Component = sectionComponents[section.section_key];
          if (!Component) return null;
          return <Component key={section.id} />;
        })
      ) : (
        <>
          <HeroSection />
          <CategoriesSection />
          <FeaturedSection />
          <QuoteForm />
          <FAQSection />
          <TestimonialsSection />
        </>
      )}
      {/* Custom sections */}
      {(customSections || []).map((s: any) => (
        <CustomSection key={s.id} section={s} />
      ))}
      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default Index;
