interface Props {
  section: {
    id: string;
    title: string;
    subtitle?: string;
    content?: string;
    image_url?: string;
    video_url?: string;
  };
}

const CustomSection = ({ section }: Props) => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-3 text-foreground">
          {section.title}
        </h2>
        {section.subtitle && (
          <p className="text-center text-muted-foreground mb-4 max-w-lg mx-auto font-body">
            {section.subtitle}
          </p>
        )}
        <div className="section-divider mb-12" />

        <div className={`grid ${section.image_url || section.video_url ? "md:grid-cols-2 gap-8 items-center" : ""}`}>
          {section.content && (
            <div className="card-premium p-8">
              <p className="font-body text-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          )}
          {section.image_url && (
            <div className="card-premium overflow-hidden rounded-2xl">
              <img src={section.image_url} alt={section.title} className="w-full aspect-video object-cover" loading="lazy" />
            </div>
          )}
          {section.video_url && (
            <div className="card-premium overflow-hidden rounded-2xl">
              <video src={section.video_url} controls className="w-full aspect-video object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomSection;
