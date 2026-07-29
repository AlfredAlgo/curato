import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, Handshake, Calendar, Share2, ExternalLink, Check, Copy } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OpportunityType = Database["public"]["Enums"]["opportunity_type"];

const typeConfig: Record<OpportunityType, { label: string; icon: React.ReactNode; color: string }> = {
  sponsorship: { label: "Sponsored Opportunity", icon: <Briefcase className="w-4 h-4" />, color: "bg-blue-500/20 text-blue-400" },
  brand_partnership: { label: "Brand Partnership", icon: <Handshake className="w-4 h-4" />, color: "bg-purple-500/20 text-purple-400" },
  event: { label: "Event", icon: <Calendar className="w-4 h-4" />, color: "bg-green-500/20 text-green-400" },
  affiliate: { label: "Affiliate Program", icon: <Share2 className="w-4 h-4" />, color: "bg-orange-500/20 text-orange-400" },
};

const Opportunities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myInterests } = useQuery({
    queryKey: ["my-opportunity-interests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("opportunity_interests")
        .select("opportunity_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map((d) => d.opportunity_id) || [];
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-referral", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("referral_code").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const interestMutation = useMutation({
    mutationFn: async ({ opportunityId, interested }: { opportunityId: string; interested: boolean }) => {
      if (!user?.id) throw new Error("Must be logged in");
      if (interested) {
        await supabase.from("opportunity_interests").delete().eq("opportunity_id", opportunityId).eq("user_id", user.id);
      } else {
        await supabase.from("opportunity_interests").insert({ opportunity_id: opportunityId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-opportunity-interests"] });
      toast.success("Updated");
    },
  });

  const copyReferralLink = () => {
    if (!profile?.referral_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${profile.referral_code}`);
    toast.success("Referral link copied!");
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-20">
        <div className="studio-container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Opportunities</h1>
                <p className="text-muted-foreground text-sm">
                  Sponsorships, brand partnerships, events, and the referral program
                </p>
              </div>
            </div>
          </motion.div>

          {user && profile?.referral_code && (
            <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold mb-1">Your Referral Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn a 5% referral fee when a label you introduce signs an artist
                  </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={copyReferralLink}>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
            </div>
          ) : !opportunities?.length ? (
            <Card className="p-12 text-center text-muted-foreground">No opportunities posted yet</Card>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => {
                const config = typeConfig[opp.type];
                const isInterested = myInterests?.includes(opp.id);
                return (
                  <Card key={opp.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`gap-1 ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                          {opp.company_name && (
                            <span className="text-sm text-muted-foreground">{opp.company_name}</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold mb-1">{opp.title}</h3>
                        {opp.description && (
                          <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
                        )}
                        {opp.reward_details && (
                          <p className="text-sm font-medium text-foreground">{opp.reward_details}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {opp.link_url && (
                          <a href={opp.link_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-2 w-full">
                              <ExternalLink className="w-4 h-4" />
                              Learn More
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant={isInterested ? "outline" : "default"}
                          className="gap-2"
                          disabled={interestMutation.isPending}
                          onClick={() => {
                            if (!user) {
                              toast.error("Sign in to express interest");
                              return;
                            }
                            interestMutation.mutate({ opportunityId: opp.id, interested: !!isInterested });
                          }}
                        >
                          {isInterested && <Check className="w-4 h-4" />}
                          {isInterested ? "Interested" : "I'm Interested"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Opportunities;
