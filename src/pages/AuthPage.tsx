import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Music, Mail, Lock, Eye, EyeOff, User, Users } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type UserType = "musician" | "client";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const [isLogin, setIsLogin] = useState(!typeParam);
  const [userType, setUserType] = useState<UserType>(typeParam === "artist" ? "musician" : typeParam === "client" ? "client" : "musician");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!user || redirecting) return;
    setRedirecting(true);

    const checkAndRedirect = async (retries = 3): Promise<void> => {
      const [groupRes, clientRes] = await Promise.all([
        supabase.from("group_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("client_profiles").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      if (clientRes.data) {
        navigate("/mi-cuenta");
      } else if (groupRes.data) {
        navigate("/mi-panel");
      } else if (retries > 0) {
        // Profile might not be created yet, wait and retry
        await new Promise(r => setTimeout(r, 800));
        return checkAndRedirect(retries - 1);
      } else {
        // No profile found after retries — send to register as musician
        navigate("/registrar-grupo");
      }
    };

    checkAndRedirect();
  }, [user, navigate, redirecting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
      } else {
        if (userType === "client" && !fullName.trim()) {
          toast.error("Ingresa tu nombre completo");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // If client, create client profile immediately
        if (userType === "client" && data.user) {
          const { error: profileError } = await supabase.from("client_profiles").insert({
            user_id: data.user.id,
            full_name: fullName.trim(),
          });
          if (profileError) console.error("Error creating client profile:", profileError);
        }

        toast.success("¡Cuenta creada! Redirigiendo...");
      }
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20 pb-24">
        <div className="w-full max-w-md">
          <div className="card-premium p-8 md:p-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Music className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-2xl font-display font-bold text-center text-foreground mb-1">
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-center text-muted-foreground font-body text-sm mb-6">
              {isLogin ? "Accede a tu cuenta" : "Elige el tipo de cuenta"}
            </p>

            {/* User type selector - only show on register */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setUserType("client")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                    userType === "client"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="font-body font-bold text-sm">Soy cliente</span>
                  <span className="font-body text-[10px] leading-tight text-center opacity-70">Quiero contratar música</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("musician")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                    userType === "musician"
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Users className="w-6 h-6" />
                  <span className="font-body font-bold text-sm">Soy músico</span>
                  <span className="font-body text-[10px] leading-tight text-center opacity-70">Quiero ofrecer mi grupo</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client name field */}
              {!isLogin && userType === "client" && (
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Procesando..." : isLogin ? "Entrar" : userType === "client" ? "Crear cuenta de cliente" : "Crear cuenta de músico"}
              </button>
            </form>

            <p className="text-center text-sm font-body text-muted-foreground mt-6">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
              <button onClick={() => setIsLogin(!isLogin)} className="text-gold font-semibold ml-1 hover:underline">
                {isLogin ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
