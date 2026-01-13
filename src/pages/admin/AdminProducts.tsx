import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Upload,
  Star,
  Crown,
  Download,
  Eye,
  EyeOff,
  DollarSign,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  type: string;
  file_url: string | null;
  is_featured: boolean;
  is_premium_only: boolean;
  is_published: boolean;
  download_count: number;
  created_at: string;
}

const categories = [
  "Marketing",
  "Business",
  "Finance",
  "Security",
  "AI & Tech",
  "Productivity",
  "Design",
  "Development",
];

const productTypes = [
  { value: "ebook", label: "eBook / PDF" },
  { value: "template", label: "Template" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "excel", label: "Excel Spreadsheet" },
  { value: "course", label: "Course / Tutorial" },
  { value: "software", label: "Software / Tool" },
];

const emptyProduct: Omit<Product, "id" | "created_at" | "download_count"> = {
  name: "",
  description: "",
  price: 0,
  original_price: null,
  image_url: "",
  category: "Business",
  type: "ebook",
  file_url: "",
  is_featured: false,
  is_premium_only: false,
  is_published: true,
};

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(data)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editingProduct ? "Product updated!" : "Product created!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error saving product",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted!" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting product",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Toggle published status
  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Image uploaded!" });
    } catch (error) {
      toast({
        title: "Error uploading image",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, file_url: publicUrl }));
      toast({ title: "File uploaded!" });
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url || "",
      category: product.category,
      type: product.type,
      file_url: product.file_url || "",
      is_featured: product.is_featured,
      is_premium_only: product.is_premium_only,
      is_published: product.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.type.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.is_published).length;
  const freeProducts = products.filter((p) => p.price === 0).length;
  const totalDownloads = products.reduce((sum, p) => sum + p.download_count, 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your DigiStore products</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm">Total Products</span>
            </div>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Published</span>
            </div>
            <p className="text-2xl font-bold">{publishedProducts}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Free Products</span>
            </div>
            <p className="text-2xl font-bold">{freeProducts}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Download className="w-4 h-4" />
              <span className="text-sm">Total Downloads</span>
            </div>
            <p className="text-2xl font-bold">{totalDownloads.toLocaleString()}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
              <Button variant="link" onClick={handleOpenCreate}>
                Create your first product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {product.is_featured && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                            {product.is_premium_only && (
                              <Crown className="w-3 h-3 text-purple-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {product.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.price === 0 ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600">
                          Free
                        </Badge>
                      ) : (
                        <span className="font-medium">${product.price}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_published}
                          onCheckedChange={(checked) =>
                            togglePublished.mutate({
                              id: product.id,
                              is_published: checked,
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {product.is_published ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.download_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this product?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Create Product"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Social Media Marketing Guide"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe your product..."
                  rows={3}
                />
              </div>

              {/* Category and Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00 for free"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to 0 for free products
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price ($)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.original_price || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        original_price: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Optional - for showing discount"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 800x600px, JPG or PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Product File (Download)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {formData.file_url && (
                    <p className="text-xs text-emerald-600">
                      File uploaded: {formData.file_url.split("/").pop()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload the downloadable file (PDF, PPTX, XLSX, ZIP, etc.)
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Product</Label>
                    <p className="text-xs text-muted-foreground">
                      Show in featured section
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_featured: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Premium Only</Label>
                    <p className="text-xs text-muted-foreground">
                      Only available to premium members
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_premium_only}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_premium_only: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-xs text-muted-foreground">
                      Make visible in the store
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_published: checked }))
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || uploading}>
                  {saveMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
