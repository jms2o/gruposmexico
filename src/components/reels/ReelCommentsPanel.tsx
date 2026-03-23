import { useState, useMemo } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReelCommentItem from "./ReelCommentItem";

interface Props {
  mediaId: string;
  onClose: () => void;
}

export default function ReelCommentsPanel({ mediaId, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const { data: comments = [] } = useQuery({
    queryKey: ["reel-comments", mediaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reel_comments")
        .select("*")
        .eq("media_id", mediaId)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  // Group: top-level comments + their replies
  const { topLevel, repliesMap } = useMemo(() => {
    const top: any[] = [];
    const replies: Record<string, any[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      } else {
        top.push(c);
      }
    }
    // Sort replies ascending
    for (const key of Object.keys(replies)) {
      replies[key].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return { topLevel: top, repliesMap: replies };
  }, [comments]);

  const handleComment = async () => {
    if (!user) { toast.error("Inicia sesión para comentar"); return; }
    if (!commentText.trim()) return;
    setSending(true);

    try {
      let displayName = "Usuario";
      const { data: cp } = await supabase.from("client_profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      if (cp?.full_name) displayName = cp.full_name;
      else {
        const { data: gp } = await supabase.from("group_profiles").select("group_name").eq("user_id", user.id).maybeSingle();
        if (gp?.group_name) displayName = gp.group_name;
      }

      const insertData: any = {
        media_id: mediaId,
        user_id: user.id,
        display_name: displayName,
        comment: commentText.trim(),
      };
      if (replyTo) insertData.parent_id = replyTo.id;

      const { error: insertError } = await supabase.from("reel_comments").insert(insertData);
      if (insertError) {
        toast.error("Error al comentar");
      } else {
        setCommentText("");
        setReplyTo(null);
        queryClient.invalidateQueries({ queryKey: ["reel-comments", mediaId] });
      }
    } catch {
      toast.error("Error al comentar");
    } finally {
      setSending(false);
    }
  };

  const totalComments = comments.length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div className="flex-1" />
      <div
        className="bg-[hsla(25,15%,8%,0.97)] backdrop-blur-xl rounded-t-3xl max-h-[65vh] flex flex-col border-t border-white/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-display font-bold text-base">
            Comentarios {totalComments > 0 && <span className="text-white/50 font-body text-sm ml-1">{totalComments}</span>}
          </h3>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white/50 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 min-h-[100px]">
          {topLevel.length === 0 ? (
            <p className="text-white/30 font-body text-sm text-center py-8">Sé el primero en comentar</p>
          ) : (
            topLevel.map((c: any) => (
              <ReelCommentItem
                key={c.id}
                comment={c}
                userId={user?.id}
                mediaId={mediaId}
                onReply={(parentId, name) => setReplyTo({ id: parentId, name })}
                replies={repliesMap[c.id] || []}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/50 text-xs font-body">Respondiendo a <span className="text-white/70 font-bold">{replyTo.name}</span></span>
            <button onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleComment(); }}
          className="px-4 pt-3 border-t border-white/10 flex items-center gap-3 flex-shrink-0"
          style={{ paddingBottom: "calc(80px + max(0.75rem, env(safe-area-inset-bottom)))" }}
        >
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? (replyTo ? `Responder a ${replyTo.name}...` : "Escribe un comentario...") : "Inicia sesión para comentar"}
            disabled={!user}
            autoFocus
            className="flex-1 bg-white/10 rounded-full px-4 py-2.5 text-white font-body text-base placeholder:text-white/30 outline-none focus:ring-1 focus:ring-gold/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!user || sending || !commentText.trim()}
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform flex-shrink-0"
          >
            <Send className="w-4 h-4 text-[hsl(25,15%,5%)]" />
          </button>
        </form>
      </div>
    </div>
  );
}
