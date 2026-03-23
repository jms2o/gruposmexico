import { useState, useEffect } from "react";
import { Save } from "lucide-react";

interface Props {
  profile: any;
  onSubmitContent: (type: string, content: any) => Promise<void>;
}

const AboutSection = ({ profile, onSubmitContent }: Props) => {
  const [desc, setDesc] = useState(profile.description || "");

  useEffect(() => {
    if (profile?.description) setDesc(profile.description);
  }, [profile]);

  const handleSave = async () => {
    await onSubmitContent("description", {
      description: desc,
      previous_description: profile?.description || "",
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">Sobre el Grupo</h2>
        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-body text-xs">Texto Editable</span>
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={5}
        maxLength={1000}
        placeholder="Describe tu grupo, tu estilo, experiencia y lo que te hace especial..."
        className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none mb-4"
      />
      <button onClick={handleSave} className="btn-whatsapp px-6 py-3 text-sm flex items-center gap-2">
        <Save className="w-4 h-4" /> Guardar cambios
      </button>
    </div>
  );
};

export default AboutSection;
