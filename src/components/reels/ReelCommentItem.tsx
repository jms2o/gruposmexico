import { useState, useCallback } from "react";
import { Heart, CornerDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  comment: any;
  userId: string | undefined;
  mediaId: string;
  onReply: (parentId: string, displayName: string) => void;
  replies?: any[];
}

export default function ReelCommentItem({ comment, userId, mediaId, onReply, replies = [] }: Props) {
  const queryClient = useQueryClient();

  const { data: likeData } = useQuery({
    queryKey: ["comment-like", comment.id, userId],
    queryFn: async () => {
      const [{ count }, userLike] = await Promise.all([
        supabase.from("reel_comment_likes").select("*", { count: "exact", head: true }).eq("comment_id", comment.id),
        userId
          ? supabase.from("reel_comment_likes").select("id").eq("comment_id", comment.id).eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { count: count || 0, liked: !!userLike?.data };
    },
  });

  const liked = likeData?.liked || false;
  const likeCount = likeData?.count || 0;

  const toggleLike = useCallback(async () => {
    if (!userId) { toast.error("Inicia sesión para dar like"); return; }
    if (liked) {
      await supabase.from("reel_comment_likes").delete().eq("comment_id", comment.id).eq("user_id", userId);
    } else {
      await supabase.from("reel_comment_likes").insert({ comment_id: comment.id, user_id: userId });
    }
    queryClient.invalidateQueries({ queryKey: ["comment-like", comment.id, userId] });
  }, [userId, liked, comment.id, queryClient]);

  const renderComment = (c: any, isReply = false) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-white/70 text-xs font-bold">{(c.display_name || "U")[0].toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-body font-bold text-xs">{c.display_name || "Usuario"}</span>
          <span className="text-white/30 text-[10px] font-body">
            {new Date(c.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
          </span>
        </div>
        <p className="text-white/80 font-body text-sm mt-0.5">{c.comment}</p>
        <div className="flex items-center gap-4 mt-1.5">
          {!isReply && (
            <button
              onClick={() => onReply(c.id, c.display_name || "Usuario")}
              className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <CornerDownRight className="w-3 h-3" />
              <span className="text-[10px] font-body">Responder</span>
            </button>
          )}
          <button
            onClick={!isReply ? toggleLike : undefined}
            className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
          >
            <Heart className={`w-3 h-3 ${!isReply && liked ? "text-red-500 fill-red-500" : ""}`} />
            {!isReply && likeCount > 0 && <span className="text-[10px] font-body">{likeCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {renderComment(comment)}
      {replies.map((r) => renderComment(r, true))}
    </div>
  );
}
