import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(45 100% 50%)",
          elegant: "hsl(45 85% 53%)",
          light: "hsl(45 100% 60%)",
          dark: "hsl(45 85% 40%)",
        },
        neon: {
          gold: "hsl(45 100% 50%)",
          purple: "hsl(280 100% 44%)",
          pink: "hsl(320 100% 50%)",
          "dark-purple": "hsl(280 60% 15%)",
        },
        whatsapp: {
          DEFAULT: "hsl(var(--whatsapp))",
          hover: "hsl(var(--whatsapp-hover))",
        },
        warm: {
          bg: "hsl(3 8% 10%)",
          dark: "hsl(3 8% 6%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(45 100% 50% / 0.4)" },
          "50%": { boxShadow: "0 0 20px 8px hsl(45 100% 50% / 0.15)" },
        },
        "neon-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(45 100% 50% / 0.3), 0 0 20px hsl(45 100% 50% / 0.15)" },
          "50%": { boxShadow: "0 0 20px hsl(45 100% 50% / 0.6), 0 0 40px hsl(45 100% 50% / 0.3)" },
        },
        "neon-pulse-purple": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(280 100% 44% / 0.3), 0 0 20px hsl(280 100% 44% / 0.15)" },
          "50%": { boxShadow: "0 0 20px hsl(280 100% 44% / 0.6), 0 0 40px hsl(280 100% 44% / 0.3)" },
        },
        "neon-pulse-pink": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(320 100% 50% / 0.3), 0 0 20px hsl(320 100% 50% / 0.15)" },
          "50%": { boxShadow: "0 0 20px hsl(320 100% 50% / 0.6), 0 0 40px hsl(320 100% 50% / 0.3)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "neon-glow": "neon-glow 3s ease-in-out infinite",
        "neon-pulse-purple": "neon-pulse-purple 2s ease-in-out infinite",
        "neon-pulse-pink": "neon-pulse-pink 2s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
