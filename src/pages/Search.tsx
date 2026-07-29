import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { FollowButton } from "@/components/FollowButton";
import { SaveButton } from "@/components/SaveButton";
import { SearchIcon, Music, Users } from "lucide-react";

const SearchPage = () => {
  const [query, setQuery] = useState("");

  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["search-tracks", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data, error } = await supabase
        .from("tracks")
        .select("id, title, artist_name, file_url, external_link, genre, status, user_id")
        .in("status", ["pending", "in_review", "community_review", "shortlisted", "approved"])
        .or(`title.ilike.%${query}%,artist_name.ilike.%${query}%,genre.ilike.%${query}%`)
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: query.trim().length > 1,
  });

  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["search-people", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, stage_name, bio, location")
        .or(`display_name.ilike.%${query}%,stage_name.ilike.%${query}%`)
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: query.trim().length > 1,
  });

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-20">
        <div className="studio-container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <SearchIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Search</h1>
                <p className="text-muted-foreground text-sm">Find tracks, artists, producers, and curators</p>
              </div>
            </div>
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by track, artist, genre..."
              className="h-12 text-base"
            />
          </motion.div>

          {query.trim().length > 1 && (
            <Tabs defaultValue="tracks" className="space-y-6">
              <TabsList>
                <TabsTrigger value="tracks" className="gap-2">
                  <Music className="w-4 h-4" />
                  Tracks {tracks && `(${tracks.length})`}
                </TabsTrigger>
                <TabsTrigger value="people" className="gap-2">
                  <Users className="w-4 h-4" />
                  People {people && `(${people.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tracks">
                {tracksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                  </div>
                ) : !tracks?.length ? (
                  <Card className="p-12 text-center text-muted-foreground">No tracks found</Card>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <Card key={track.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <TrackPlayButton
                            trackId={track.id}
                            fileUrl={track.file_url}
                            externalLink={track.external_link}
                            trackTitle={track.title}
                            artistName={track.artist_name}
                            variant="minimal"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{track.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                          </div>
                          {track.genre && <Badge variant="outline">{track.genre}</Badge>}
                          <SaveButton trackId={track.id} />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="people">
                {peopleLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                  </div>
                ) : !people?.length ? (
                  <Card className="p-12 text-center text-muted-foreground">No people found</Card>
                ) : (
                  <div className="space-y-3">
                    {people.map((person) => (
                      <Card key={person.user_id} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {person.stage_name || person.display_name || "Anonymous"}
                            </h3>
                            {person.location && (
                              <p className="text-sm text-muted-foreground truncate">{person.location}</p>
                            )}
                          </div>
                          <FollowButton userId={person.user_id} />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default SearchPage;
