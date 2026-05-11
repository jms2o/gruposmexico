import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Menu, X, Search, Mic, Home, FileText, MessageSquare, Calendar, CreditCard, FileCheck, Heart, User, LogIn, UserPlus, LogOut, Bell, ChevronRight } from "lucide-react";
import { useWhatsappNumber, useVisibleCategories } from "@/hooks/useData";
import { useAuth, useGroupProfile, useClientProfile } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import SmartSearch from "@/components/SmartSearch";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: categories } = useVisibleCategories();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile: groupProfile } = useGroupProfile(user?.id);
  const { profile: clientProfile } = useClientProfile(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const num = whatsappNumber || "5216691234567";
  const waUrl = `https://wa.me/${num}?text=${encodeURIComponent("Hola, quiero información sobre grupos musicales.")}`;
  const cleanMenuLabel = (label: string) =>
    label
      .replace(/(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\u200D|\uFE0F)/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const isMusician = !!groupProfile;
  const isClient = !!clientProfile;
  const isLoggedIn = !!user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const staticLinksTop = [{ label: "Inicio", href: "/", isRoute: true }];
  const categoryLinks = (categories || []).map((c: any) => ({
    label: cleanMenuLabel(c.title) || "Categoría", href: `/categoria/${c.id}`, isRoute: true,
  }));
  const staticLinksBottom = [
    { label: "Todos los Grupos", href: "/todos-los-grupos", isRoute: true },
    { label: "Paquetes de Sonido", href: "/paquetes", isRoute: true },
    { label: "Testimonios", href: "/#testimonios", isRoute: false },
    { label: "Contacto", href: "/#cotizar", isRoute: false },
  ];
  const desktopLinks = [...staticLinksTop, ...categoryLinks, ...staticLinksBottom];

  const handleNavClick = (href: string, isRoute: boolean) => {
    setMobileOpen(false);
    if (isRoute) {
      if (href === "/") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (location.pathname === "/") {
      const anchor = href.replace("/#", "#");
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = href;
    }
  };

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  // Sidebar menu items for logged-in users
  const clientMenuItems = [
    { label: "Inicio", icon: Home, path: "/" },
    { label: "Mis solicitudes", icon: FileText, path: "/mis-solicitudes" },
    { label: "Chats con grupos", icon: MessageSquare, path: "/mis-solicitudes", badge: null },
    { label: "Mis eventos", icon: Calendar, path: "/mi-cuenta" },
    { label: "Pagos", icon: CreditCard, path: "/mi-cuenta" },
    { label: "Contratos", icon: FileCheck, path: "/mi-cuenta" },
    { label: "Favoritos", icon: Heart, path: "/mi-cuenta" },
    { label: "Perfil", icon: User, path: "/mi-cuenta" },
  ];

  const musicianMenuItems = [
    { label: "Inicio", icon: Home, path: "/" },
    { label: "Mi panel", icon: User, path: "/mi-panel" },
    { label: "Bandeja", icon: MessageSquare, path: "/bandeja" },
    { label: "Publicar", icon: FileText, path: "/publicar" },
    { label: "Membresía", icon: CreditCard, path: "/membresias" },
  ];

  const sidebarItems = isMusician ? musicianMenuItems : isClient ? clientMenuItems : [];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav shadow-md border-b border-border/50" : "bg-transparent"
        }`}
      >
        <nav className="container px-4 flex items-center justify-between h-16 md:h-[72px]">
          {/* Left: hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 rounded-lg lg:hidden ${scrolled ? "text-foreground" : "text-white"}`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <Mic className={`w-5 h-5 ${scrolled ? "text-gold" : "text-gold-light"}`} />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-0.5">
            {desktopLinks.map((l) => (
              <li key={l.href}>
                {l.isRoute ? (
                  <Link to={l.href}
                    className={`px-3 py-2 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-colors ${
                      scrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}>{l.label}</Link>
                ) : (
                  <a href={l.href}
                    onClick={(e) => { if (location.pathname === "/") { e.preventDefault(); handleNavClick(l.href, false); } }}
                    className={`px-3 py-2 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-colors ${
                      scrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}>{l.label}</a>
                )}
              </li>
            ))}
          </ul>

          {/* Right: search + theme */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-lg transition-colors ${scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
              aria-label="Buscar">
              <Search className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle scrolled={scrolled} />
              {!isLoggedIn && (
                <>
                  <Link
                    to="/auth"
                    className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs xl:text-sm font-body font-semibold transition-colors ${
                      scrolled
                        ? "border border-border text-foreground hover:bg-muted"
                        : "border border-white/25 text-white hover:bg-white/10"
                    }`}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/auth"
                    className="btn-gold shrink-0 whitespace-nowrap px-4 xl:px-5 py-2.5 text-xs xl:text-sm leading-none"
                  >
                    Registrar Grupo
                  </Link>
                </>
              )}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-whatsapp flex items-center justify-center text-white hover:bg-whatsapp-hover transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
            <div className="lg:hidden">
              <ThemeToggle scrolled={scrolled} />
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Sidebar */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-card border-r border-border/50 flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-border/30">
              <Mic className="w-5 h-5 text-gold" />
              <span className="text-base font-display font-bold tracking-wider uppercase text-foreground">
                GRUPOSMÉXICO.COM
              </span>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {isLoggedIn ? (
                <>
                  {sidebarItems.length > 0 ? (
                    sidebarItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium transition-all ${
                            isActive
                              ? "bg-gold/15 text-gold border border-gold/20"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-gold" : "text-muted-foreground"}`} />
                          <span className="flex-1">{item.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4 text-gold/60" />}
                        </Link>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3.5 text-muted-foreground font-body text-sm">
                      Cargando...
                    </div>
                  )}
                </>
              ) : (
                /* Not logged in */
                <>
                  <Link to="/" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium text-foreground hover:bg-muted">
                    <Home className="w-5 h-5 text-muted-foreground" />
                    <span>Inicio</span>
                  </Link>
                  <Link to="/todos-los-grupos" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium text-foreground hover:bg-muted">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span>Explorar grupos</span>
                  </Link>
                  <Link to="/paquetes" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium text-foreground hover:bg-muted">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span>Paquetes de Sonido</span>
                  </Link>

                  <div className="my-4 border-t border-border/30" />

                  <Link to="/auth" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-semibold text-gold hover:bg-gold/10">
                    <LogIn className="w-5 h-5 text-gold" />
                    <span>Iniciar sesión</span>
                  </Link>
                  <Link to="/auth?type=client" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium text-foreground hover:bg-muted">
                    <UserPlus className="w-5 h-5 text-muted-foreground" />
                    <span>Crear cuenta de cliente</span>
                  </Link>
                  <Link to="/auth?type=artist" className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-0.5 font-body text-sm font-medium text-foreground hover:bg-muted">
                    <Mic className="w-5 h-5 text-muted-foreground" />
                    <span>Crear cuenta de artista</span>
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/30 px-3 py-3">
              {isLoggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-body text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-body text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <MessageCircle className="w-5 h-5 text-whatsapp" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <SmartSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
