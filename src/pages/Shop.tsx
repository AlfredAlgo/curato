import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Zap, Volume2, Clock, Waves, Loader2, Music, Headphones, Package, Star, ShoppingBag, Plus } from "lucide-react";
import xlr8Plugin from "@/assets/xlr8-plugin.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ShopProduct = Database["public"]["Tables"]["shop_products"]["Row"];

const xlr8Features = [
  { icon: Volume2, title: "Compressor", description: "Smooth, transparent dynamics control with adjustable threshold, ratio, attack, release, and makeup gain." },
  { icon: Waves, title: "Plate Reverb", description: "Classic studio plate sound with decay, size, pre-delay, damping, and modulation controls." },
  { icon: Clock, title: "Stereo Delay", description: "Flexible delay with time, feedback, wet/dry mix, and ping-pong mode for rhythmic movement." },
];

const categoryIcon: Record<string, React.ElementType> = {
  sound_pack: Music,
  plugin: Zap,
  merch: ShoppingBag,
  producer_item: Package,
};

const ProductCard = ({ product, onBuy, isBuying }: { product: ShopProduct; onBuy: (id: string) => void; isBuying: boolean }) => {
  const Icon = categoryIcon[product.category] || Package;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-all flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-foreground" />
        </div>
        {product.is_curator_pick && (
          <Badge className="gap-1 bg-yellow-500/20 text-yellow-500">
            <Star className="w-3 h-3" />
            Curator Pick
          </Badge>
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow">{product.description}</p>
      {product.seller_type === "producer" && (
        <Badge variant="outline" className="text-xs w-fit mb-4">Producer Listing</Badge>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-2xl font-bold">${(product.price_cents / 100).toFixed(2)}</span>
        <Button onClick={() => onBuy(product.id)} disabled={isBuying} className="gap-2">
          {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isBuying ? "Processing..." : "Buy Now"}
        </Button>
      </div>
    </motion.div>
  );
};

const Shop = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [isDownloadingDemo, setIsDownloadingDemo] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [newListing, setNewListing] = useState({ title: "", description: "", price: "" });

  const isProducer = role === "producer";

  const { data: products } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const soundPacks = products?.filter((p) => p.category === "sound_pack") || [];
  const merch = products?.filter((p) => p.category === "merch") || [];
  const producerItems = products?.filter((p) => p.seller_type === "producer") || [];
  const curatorPicks = products?.filter((p) => p.is_curator_pick) || [];
  const myListings = products?.filter((p) => p.seller_id === user?.id) || [];

  const createListingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");
      const priceCents = Math.round(parseFloat(newListing.price) * 100);
      if (!newListing.title.trim() || isNaN(priceCents) || priceCents < 0) {
        throw new Error("Please enter a valid title and price");
      }
      const { error } = await supabase.from("shop_products").insert({
        seller_id: user.id,
        seller_type: "producer",
        category: "producer_item",
        title: newListing.title.trim(),
        description: newListing.description.trim() || null,
        price_cents: priceCents,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing published to the Producer Marketplace!");
      setListDialogOpen(false);
      setNewListing({ title: "", description: "", price: "" });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleBuyProduct = async (productId: string) => {
    setBuyingId(productId);
    try {
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: { productId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setBuyingId(null);
    }
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-xlr8-checkout", {
        body: { product_type: "full" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoDownload = () => {
    setIsDownloadingDemo(true);
    toast.success("Starting XLR8 Demo download...");
    setTimeout(() => {
      toast.info("Demo download will be available soon. Check back later!");
      setIsDownloadingDemo(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Curato × FL Studio</Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">Shop</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sound packs, merch, and producer-made gear. Your gateway into the Curato ecosystem.
            </p>
          </motion.div>

          {/* Sound Packs */}
          {soundPacks.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-6">Sound Packs</h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {soundPacks.map((p) => (
                  <ProductCard key={p.id} product={p} onBuy={handleBuyProduct} isBuying={buyingId === p.id} />
                ))}
              </div>
            </div>
          )}

          {/* Curator Picks */}
          {curatorPicks.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Curator Picks
              </h2>
              <p className="text-muted-foreground text-sm mb-6">Hand-selected by Curato's curators</p>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {curatorPicks.map((p) => (
                  <ProductCard key={p.id} product={p} onBuy={handleBuyProduct} isBuying={buyingId === p.id} />
                ))}
              </div>
            </div>
          )}

          {/* Producer Marketplace */}
          <div className="mb-20">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Producer Marketplace
                </h2>
                <p className="text-muted-foreground text-sm">Digital products listed directly by Curato producers</p>
              </div>
              {isProducer && (
                <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Sell on Curato
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>List a New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={newListing.title}
                          onChange={(e) => setNewListing((f) => ({ ...f, title: e.target.value }))}
                          placeholder="e.g. Afrobeats Drum Kit Vol. 2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newListing.description}
                          onChange={(e) => setNewListing((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newListing.price}
                          onChange={(e) => setNewListing((f) => ({ ...f, price: e.target.value }))}
                          placeholder="19.00"
                        />
                      </div>
                      <Button
                        className="w-full"
                        disabled={createListingMutation.isPending}
                        onClick={() => createListingMutation.mutate()}
                      >
                        {createListingMutation.isPending ? "Publishing..." : "Publish Listing"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {producerItems.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No producer listings yet. {isProducer ? "Be the first to sell here!" : ""}
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {producerItems.map((p) => (
                  <ProductCard key={p.id} product={p} onBuy={handleBuyProduct} isBuying={buyingId === p.id} />
                ))}
              </div>
            )}
            {isProducer && myListings.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4">You have {myListings.length} active listing(s).</p>
            )}
          </div>

          {/* Merch */}
          {merch.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                Merch
              </h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {merch.map((p) => (
                  <ProductCard key={p.id} product={p} onBuy={handleBuyProduct} isBuying={buyingId === p.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* XLR8 Plugin Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Signature Plugin</Badge>
            <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                XLR8
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Compress. Plate. Delay. <span className="text-foreground">Accelerated.</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border/50">
              <img src={xlr8Plugin} alt="XLR8 Plugin Interface" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-lg text-muted-foreground max-w-3xl mx-auto mb-12"
          >
            Transform your sound with the ultimate vocal and instrument FX chain. XLR8 combines
            a precision compressor, lush plate reverb, and versatile stereo delay into a single,
            rack-inspired plugin designed for producers, engineers, and musicians.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {xlr8Features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="gap-2 text-lg px-8 py-6" onClick={handlePurchase} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isLoading ? "Processing..." : "Buy XLR8 — $99"}
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6" onClick={handleDemoDownload} disabled={isDownloadingDemo}>
              {isDownloadingDemo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isDownloadingDemo ? "Preparing..." : "Try Free Demo"}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
