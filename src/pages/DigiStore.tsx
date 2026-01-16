import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Star,
  Eye,
  Crown,
  FileText,
  Presentation,
  Table,
  BookOpen,
  Loader2,
  Check,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  category: string;
  type: string; // ebook, template, powerpoint, excel, etc.
  file_url?: string;
  is_featured: boolean;
  is_premium_only: boolean;
  download_count: number;
  created_at: string;
}


const categories = ["All", "Marketing", "Business", "Finance", "Security", "AI & Tech", "Productivity", "Spreadsheets"];
const types = ["All Types", "ebook", "template", "powerpoint", "excel", "course", "software"];
const priceFilters = ["All Prices", "Free", "Under $5", "Under $10", "Under $20", "$20+"];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "ebook":
      return BookOpen;
    case "powerpoint":
      return Presentation;
    case "excel":
      return Table;
    default:
      return FileText;
  }
};

export default function DigiStore() {
  const { subscription } = useAuth();
  const { addToCart, totalItems, setIsOpen } = useCart();
  const { toast } = useToast();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedPrice, setSelectedPrice] = useState("All Prices");

  // Fetch products from Supabase
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Filter products based on search and filters
  useEffect(() => {
    let result = products;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== "All Types") {
      result = result.filter((p) => p.type === selectedType);
    }

    // Price filter
    if (selectedPrice === "Free") {
      result = result.filter((p) => p.price === 0);
    } else if (selectedPrice === "Under $5") {
      result = result.filter((p) => p.price > 0 && p.price < 5);
    } else if (selectedPrice === "Under $10") {
      result = result.filter((p) => p.price > 0 && p.price < 10);
    } else if (selectedPrice === "Under $20") {
      result = result.filter((p) => p.price > 0 && p.price < 20);
    } else if (selectedPrice === "$20+") {
      result = result.filter((p) => p.price >= 20);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, selectedType, selectedPrice]);

  const handleAddToCart = (product: Product) => {
    if (product.price === 0) {
      // Free product - direct download
      toast({
        title: "Download Started!",
        description: `${product.name} is being downloaded.`,
      });
      return;
    }

    // Premium members get paid products for free
    if (subscription.subscribed) {
      toast({
        title: "Premium Perk!",
        description: `As a premium member, you get ${product.name} for free!`,
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      type: product.type,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const featuredProducts = filteredProducts.filter((p) => p.is_featured);
  const regularProducts = filteredProducts.filter((p) => !p.is_featured);

  return (
    <Layout>
      <Helmet>
        <title>DigiStore - Digital Products | TechTrendi</title>
        <meta
          name="description"
          content="Download premium digital products including ebooks, templates, spreadsheets, and more. Free and paid resources for tech enthusiasts."
        />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

          {/* Breathing orbs */}
          <div className="absolute top-10 right-[20%] w-64 h-64 rounded-full blur-[80px] animate-breathe opacity-40 bg-primary/30" />
          <div className="absolute bottom-10 left-[10%] w-48 h-48 rounded-full blur-[60px] animate-breathe-slow opacity-30 bg-secondary/30" style={{ animationDelay: "-3s" }} />

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-primary/10 text-primary">
                <Tag className="w-3 h-3 mr-1" />
                Digital Downloads
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Digi<span className="text-gradient">Store</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Premium digital products to boost your productivity, skills, and business.
                Free resources and paid downloads for every need.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm"
                />
              </div>

              {/* Premium Badge */}
              {subscription.subscribed && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Premium Member - All paid products are FREE for you!
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b border-border sticky top-16 z-30 bg-background/80 backdrop-blur-md">
          <div className="container">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filters:</span>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "All Types" ? type : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  {priceFilters.map((price) => (
                    <SelectItem key={price} value={price}>
                      {price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} products
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                  onClick={() => setIsOpen(true)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-12">
            <div className="container">
              <div className="flex items-center gap-2 mb-8">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    isPremium={subscription.subscribed}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold text-foreground mb-8">All Products</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(regularProducts.length > 0 ? regularProducts : filteredProducts).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    isPremium={subscription.subscribed}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!subscription.subscribed && (
          <section className="py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-90" />
            <div className="container relative text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-white" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Get Premium Access
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-6">
                Unlock all paid products for free, plus ad-free browsing and exclusive content.
              </p>
              <Button
                size="lg"
                className="bg-white text-foreground hover:bg-white/90"
                asChild
              >
                <a href="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium - $4.99/mo
                </a>
              </Button>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

// Product Card Component
function ProductCard({
  product,
  onAddToCart,
  isPremium,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  isPremium: boolean;
}) {
  const TypeIcon = getTypeIcon(product.type);
  const isFree = product.price === 0;
  const effectivelyFree = isFree || isPremium;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <Badge className="bg-amber-500 text-white">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
          {product.is_premium_only && (
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <TypeIcon className="w-3 h-3 mr-1" />
            {product.type}
          </Badge>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3">
          {product.original_price && (
            <span className="text-xs text-white/70 line-through mr-2">
              ${product.original_price}
            </span>
          )}
          <Badge
            className={cn(
              "text-base font-bold",
              effectivelyFree
                ? "bg-emerald-500 text-white"
                : "bg-primary text-white"
            )}
          >
            {effectivelyFree ? "FREE" : `$${product.price}`}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-xs text-primary font-medium mb-1">{product.category}</div>
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {product.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {product.download_count.toLocaleString()} downloads
          </span>
        </div>

        {/* Action Button */}
        <Button
          className={cn(
            "w-full",
            effectivelyFree
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => onAddToCart(product)}
        >
          {effectivelyFree ? (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Free
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Premium notice */}
        {!isFree && isPremium && (
          <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-2 flex items-center justify-center gap-1">
            <Check className="w-3 h-3" />
            Free with Premium
          </p>
        )}
      </div>
    </div>
  );
}
