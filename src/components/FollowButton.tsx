import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  size?: "sm" | "default";
}

export const FollowButton = ({ userId, size = "sm" }: FollowButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFollowing } = useQuery({
    queryKey: ["is-following", user?.id, userId],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("followed_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && user.id !== userId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("followed_id", userId);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, followed_id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
    },
  });

  if (!user || user.id === userId) return null;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "default"}
      className="gap-2"
      disabled={mutation.isPending}
      onClick={() => {
        if (!user) {
          toast.error("Sign in to follow");
          return;
        }
        mutation.mutate();
      }}
    >
      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};
