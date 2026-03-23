import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeToggle = ({ scrolled }: { scrolled: boolean }) => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-lg transition-colors ${
        scrolled
          ? "text-muted-foreground hover:text-foreground hover:bg-muted"
          : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
      }`}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
