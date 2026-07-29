import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SaveButtonProps {
  trackId: string;
}

export const SaveButton = ({ trackId }: SaveButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isSaved } = useQuery({
    queryKey: ["is-saved", user?.id, trackId],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("track_saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", trackId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");
      if (isSaved) {
        await supabase.from("track_saves").delete().eq("user_id", user.id).eq("track_id", trackId);
      } else {
        await supabase.from("track_saves").insert({ user_id: user.id, track_id: trackId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-saved", user?.id, trackId] });
      queryClient.invalidateQueries({ queryKey: ["saved-tracks", user?.id] });
      toast.success(isSaved ? "Removed from saved" : "Saved");
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-2 ${isSaved ? "text-primary" : "text-muted-foreground"}`}
      disabled={mutation.isPending}
      onClick={() => {
        if (!user) {
          toast.error("Sign in to save tracks");
          return;
        }
        mutation.mutate();
      }}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
    </Button>
  );
};
