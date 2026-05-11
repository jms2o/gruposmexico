import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Clapperboard, MapPin, Star, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ── Load YouTube IFrame API once ── */
declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: (() => void) | undefined; }
}
const ytApiReady = new Promise<void>((resolve) => {
  if (window.YT?.Player) { resolve(); return; }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
});
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReelCommentsPanel from "@/components/reels/ReelCommentsPanel";
import { stripEmojis } from "@/lib/text";

/* ── Types ── */
interface ReelData {
  id: string;
  url: string;
  type: "video" | "youtube";
  title: string | null;
  groupName: string;
  city: string | null;
  groupType: string;
  pricePerHour: number | null;
  minHours: number | null;
  groupProfileId: string;
  musicalGroupId: string | null;
  clipStart: number | null;
  clipEnd: number | null;
}

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

/* ── Fetch reels ── */
const fetchReels = async (): Promise<ReelData[]> => {
  const { data: media, error } = await supabase
    .from("group_media")
    .select("id, url, title, group_profile_id, created_at, type, clip_start, clip_end")
    .in("type", ["video", "youtube"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !media || media.length === 0) return [];

  const profileIds = [...new Set(media.map((m) => m.group_profile_id))];

  const [{ data: profiles }, { data: musicalGroups }] = await Promise.all([
    supabase.from("group_profiles").select("id, group_name, city, group_type, price_per_hour, min_hours").in("id", profileIds),
    supabase.from("musical_groups").select("id, group_profile_id").in("group_profile_id", profileIds),
  ]);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const mgMap = new Map(musicalGroups?.map((g) => [g.group_profile_id, g.id]) || []);

  return media
    .map((m: any) => {
      const profile = profileMap.get(m.group_profile_id);
      if (!profile) return null;
      return {
        id: m.id, url: m.url, type: m.type as "video" | "youtube", title: m.title,
        groupName: stripEmojis(profile.group_name || ""),
        city: stripEmojis(profile.city || ""),
        groupType: stripEmojis(profile.group_type || ""),
        pricePerHour: profile.price_per_hour, minHours: profile.min_hours,
        groupProfileId: m.group_profile_id, musicalGroupId: mgMap.get(m.group_profile_id) || null,
        clipStart: m.clip_start, clipEnd: m.clip_end,
      };
    })
    .filter(Boolean) as ReelData[];
};

/* ── Single Reel Card ── */
function ReelCard({ reel, isActive, globalMuted, onUnmute }: {
  reel: ReelData; isActive: boolean; globalMuted: boolean; onUnmute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isYoutube = reel.type === "youtube";
  const ytId = isYoutube ? extractYtId(reel.url) : "";
  const [paused, setPaused] = useState(true);
  const [error, setError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef<number>(0);
  const isTouchRef = useRef(false);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytReadyRef = useRef(false);
  const [ytLoaded, setYtLoaded] = useState(false);

  // Comment count
  const { data: commentCount = 0 } = useQuery({
    queryKey: ["reel-comment-count", reel.id],
    queryFn: async () => {
      const { count } = await supabase.from("reel_comments").select("*", { count: "exact", head: true }).eq("media_id", reel.id);
      return count || 0;
    },
  });

  // Likes
  const { data: likeData } = useQuery({
    queryKey: ["reel-likes", reel.id],
    queryFn: async () => {
      const [{ count }, userLike] = await Promise.all([
        supabase.from("reel_likes").select("*", { count: "exact", head: true }).eq("media_id", reel.id),
        user?.id
          ? supabase.from("reel_likes").select("id").eq("media_id", reel.id).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { count: count || 0, liked: !!userLike?.data };
    },
  });

  const liked = likeData?.liked || false;
  const likeCount = likeData?.count || 0;

  // Only init YouTube player when active (lazy load)
  useEffect(() => {
    if (!isYoutube || !ytId || !isActive) {
      // Destroy player when not active
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
        ytReadyRef.current = false;
        setYtLoaded(false);
      }
      return;
    }

    let player: any = null;
    let destroyed = false;

    const initPlayer = async () => {
      await ytApiReady;
      if (destroyed || !ytContainerRef.current) return;
      const div = document.createElement("div");
      div.id = `yt-player-${reel.id}`;
      ytContainerRef.current.innerHTML = "";
      ytContainerRef.current.appendChild(div);

      player = new window.YT.Player(div.id, {
        videoId: ytId,
        playerVars: {
          autoplay: 1, mute: 1,
          controls: 0, loop: 1, playlist: ytId,
          playsinline: 1, modestbranding: 1, rel: 0, showinfo: 0,
          start: reel.clipStart || undefined,
          end: reel.clipEnd || undefined,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            ytPlayerRef.current = event.target;
            ytReadyRef.current = true;
            setYtLoaded(true);
            event.target.playVideo();
            if (!globalMuted) event.target.unMute();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.seekTo(reel.clipStart || 0);
              event.target.playVideo();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      destroyed = true;
      if (player?.destroy) player.destroy();
      ytPlayerRef.current = null;
      ytReadyRef.current = false;
      setYtLoaded(false);
    };
  }, [isYoutube, ytId, reel.id, isActive]);

  // Control YouTube player mute
  useEffect(() => {
    if (!isYoutube || !ytReadyRef.current || !ytPlayerRef.current) return;
    try {
      if (globalMuted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } catch {}
  }, [globalMuted, isYoutube]);

  // Native video play/pause logic
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isYoutube) return;
    if (isActive) {
      vid.currentTime = 0;
      vid.muted = globalMuted;
      vid.play().then(() => setPaused(false)).catch(() => {
        vid.muted = true;
        vid.play().then(() => setPaused(false)).catch(() => setPaused(true));
      });
    } else {
      vid.pause();
      setPaused(true);
    }
  }, [isActive, globalMuted]);

  // Sync muted state to video element
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = globalMuted;
  }, [globalMuted]);

  // Visibility change
  useEffect(() => {
    const handleVisibility = () => {
      const vid = videoRef.current;
      if (!vid) return;
      if (document.hidden) { vid.pause(); setPaused(true); }
      else if (isActive) { vid.play().then(() => setPaused(false)).catch(() => {}); }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play().then(() => setPaused(false)).catch(() => {});
    else { vid.pause(); setPaused(true); }
  }, []);

  const handleLike = useCallback(async () => {
    if (!user) { toast.error("Inicia sesión para dar like"); return; }
    if (liked) await supabase.from("reel_likes").delete().eq("media_id", reel.id).eq("user_id", user.id);
    else await supabase.from("reel_likes").insert({ media_id: reel.id, user_id: user.id });
    queryClient.invalidateQueries({ queryKey: ["reel-likes", reel.id] });
  }, [user, liked, reel.id, queryClient]);

  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ("touches" in e) isTouchRef.current = true;
    else if (isTouchRef.current) { isTouchRef.current = false; return; }

    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.changedTouches[0].clientY : e.clientY;
      setFloatingHearts((prev) => [...prev, { id: now, x: clientX - rect.left, y: clientY - rect.top }]);
      setTimeout(() => setFloatingHearts((prev) => prev.filter((h) => h.id !== now)), 900);
      if (!liked) handleLike();
    } else {
      setTimeout(() => { if (Date.now() - lastTapRef.current >= 350) togglePlay(); }, 360);
    }
    lastTapRef.current = now;
  }, [liked, handleLike, togglePlay]);

  const estimatedPrice = reel.pricePerHour && reel.minHours ? reel.pricePerHour * reel.minHours : null;

  if (error) {
    return (
      <div className="relative w-full h-[100dvh] bg-black snap-start snap-always flex-shrink-0 flex items-center justify-center">
        <div className="text-center px-6">
          <Clapperboard className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Este video no se pudo cargar</p>
        </div>
      </div>
    );
  }


  return (
    <div className="relative w-full h-[100dvh] bg-black snap-start snap-always flex-shrink-0 select-none touch-manipulation">
      {isYoutube && ytId ? (
        <>
          {/* Thumbnail shown while player loads or when inactive */}
          {!ytLoaded && (
            <div className="absolute inset-0 z-0">
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt={reel.groupName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
          )}
          <div className={`absolute inset-0 z-0 ${!ytLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            <div ref={ytContainerRef} className="w-full h-full [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full" />
          </div>
          <div
            className="absolute inset-0 z-10"
            onTouchEnd={handleDoubleTap}
            onClick={handleDoubleTap}
            style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
          />
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            src={reel.url}
            className="absolute inset-0 w-full h-full object-cover select-none"
            loop muted={globalMuted} playsInline preload="auto"
            onTouchEnd={handleDoubleTap}
            onClick={handleDoubleTap}
            onError={() => setError(true)}
            style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
          />
          {paused && isActive && (
            <button onClick={togglePlay} className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          )}
        </>
      )}

      {/* Floating hearts */}
      {floatingHearts.map((heart) => (
        <div key={heart.id} className="absolute pointer-events-none z-30" style={{ left: heart.x - 24, top: heart.y - 24 }}>
          <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-floating-heart" style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.6))" }} />
        </div>
      ))}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Right-side actions */}
      <div className="absolute right-3 bottom-56 flex flex-col items-center gap-5 z-20">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${liked ? "bg-red-500/20" : "bg-white/10 backdrop-blur-sm"}`}>
            <Heart className={`w-6 h-6 ${liked ? "text-red-500 fill-red-500" : "text-white"}`} />
          </div>
          <span className="text-white text-[10px] font-body font-semibold">{likeCount > 0 ? likeCount : ""}</span>
        </button>

        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-body font-semibold">{commentCount > 0 ? commentCount : ""}</span>
        </button>

        <button
          onClick={async () => {
            const shareUrl = `${window.location.origin}/reels`;
            const shareData = { title: `${reel.groupName} en GruposMéxico`, text: `Mira a ${reel.groupName} en GruposMéxico`, url: shareUrl };
            if (navigator.share) { try { await navigator.share(shareData); } catch {} }
            else { await navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`); toast.success("Enlace copiado"); }
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>

        <button onClick={onUnmute} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            {globalMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-24 left-0 right-0 px-4 z-20">
        <h3 className="text-white font-display font-bold text-xl mb-1">{reel.groupName}</h3>
        <div className="flex items-center gap-3 text-white/70 text-xs font-body mb-1">
          {reel.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {reel.city}</span>}
          <span className="flex items-center gap-1"><Music className="w-3 h-3" /> {reel.groupType}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 text-gold fill-gold" />)}
          </div>
          {estimatedPrice && (
            <span className="text-white/80 text-xs font-body">Desde ${estimatedPrice.toLocaleString()} MXN /evento</span>
          )}
        </div>
        {reel.musicalGroupId && (
          <button
            onClick={() => navigate(`/grupo/${reel.musicalGroupId}`)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-[hsl(25,15%,5%)] font-display font-bold text-sm tracking-wide active:scale-[0.98] transition-transform"
          >
            Cotizar grupo
          </button>
        )}
      </div>

      {showComments && <ReelCommentsPanel mediaId={reel.id} onClose={() => setShowComments(false)} />}
    </div>
  );
}

/* ── Page ── */
export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [globalMuted, setGlobalMuted] = useState(true); // Start muted for autoplay
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ["reels-feed"],
    queryFn: fetchReels,
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    setActiveIndex(idx);
  }, []);

  const handleUnmute = useCallback(() => {
    setGlobalMuted((prev) => !prev);
    setShowUnmuteHint(false);
  }, []);

  // Auto-hide unmute hint after 4 seconds
  useEffect(() => {
    if (showUnmuteHint) {
      const t = setTimeout(() => setShowUnmuteHint(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showUnmuteHint]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/50 font-body">Cargando reels...</div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <div className="text-center px-6">
          <Clapperboard className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/50 font-body">No hay videos todavía</p>
          <p className="text-white/30 font-body text-xs mt-1">Los grupos pueden subir videos desde "Publicar"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black min-h-[100dvh]">
      {/* Unmute hint overlay */}
      {showUnmuteHint && globalMuted && reels.length > 0 && (
        <button
          onClick={handleUnmute}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-body font-semibold">Toca para activar sonido</span>
        </button>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {reels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} isActive={i === activeIndex} globalMuted={globalMuted} onUnmute={handleUnmute} />
        ))}
      </div>
    </div>
  );
}
