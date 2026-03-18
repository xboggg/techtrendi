import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Image,
  Loader2,
  Star,
  Home,
} from "lucide-react";

const GUIDE_CATEGORIES = [
  "Phones", "Security", "AI Tech", "Productivity", "How-To", "Side Hustles",
  "Gaming", "Accessories", "Career in Tech", "Health Tech", "Remote Work", "Green Tech",
];

export default function AdminGuideEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<"markdown" | "richtext">("markdown");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "How-To",
    cover_image: "",
    is_published: false,
    read_time_minutes: 5,
    is_featured: false,
    homepage_featured: false,
  });

  // Fetch guide data
  const { data: guide, isLoading } = useQuery({
    queryKey: ["admin-guide", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when guide loads
  useEffect(() => {
    if (guide) {
      setFormData({
        title: guide.title || "",
        slug: guide.slug || "",
        excerpt: guide.excerpt || "",
        content: guide.content || "",
        category: guide.category || "How-To",
        cover_image: guide.cover_image || "",
        is_published: guide.is_published || false,
        read_time_minutes: guide.read_time_minutes || 5,
        is_featured: guide.is_featured || false,
        homepage_featured: guide.homepage_featured || false,
      });
    }
  }, [guide]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("articles")
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || null,
          content: data.content,
          category: data.category,
          cover_image: data.cover_image || null,
          is_published: data.is_published,
          read_time_minutes: data.read_time_minutes,
          is_featured: data.is_featured,
          homepage_featured: data.homepage_featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["admin-guide", id] });
      toast({ title: "Guide updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating guide", description: String(error), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { optimizeImage } = await import("@/lib/image-optimize");
      const { blob, fileName } = await optimizeImage(file);
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, blob, { contentType: blob.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, cover_image: data.publicUrl }));
      toast({ title: "Image uploaded & optimized!" });
    } catch (error) {
      toast({ title: "Error uploading image", description: String(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
      read_time_minutes: calculateReadTime(content),
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/guides")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guides
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Edit Guide</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/blog/${formData.slug}`, "_blank")}
              disabled={!formData.slug}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Slug */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter guide title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="guide-url-slug"
                required
              />
            </div>
          </div>

          {/* Category & Read Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {GUIDE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="read_time">Read Time (minutes)</Label>
              <Input
                id="read_time"
                type="number"
                min="1"
                value={formData.read_time_minutes}
                onChange={(e) => setFormData((prev) => ({ ...prev, read_time_minutes: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={formData.cover_image}
                onChange={(e) => setFormData((prev) => ({ ...prev, cover_image: e.target.value }))}
                placeholder="Image URL or upload"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                    <span className="ml-2">Upload</span>
                  </span>
                </Button>
              </label>
            </div>
            {formData.cover_image && (
              <img
                src={formData.cover_image}
                alt="Cover preview"
                className="h-32 w-auto rounded-lg object-cover mt-2"
              />
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary of the guide (shown in listings)"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content *</Label>
              <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as "markdown" | "richtext")}>
                <TabsList className="h-8">
                  <TabsTrigger value="markdown" className="text-xs px-3 h-7">Markdown</TabsTrigger>
                  <TabsTrigger value="richtext" className="text-xs px-3 h-7">Rich Text</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {editorMode === "markdown" ? (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your guide content here... Markdown is supported."
                rows={20}
                className="font-mono text-sm"
                required
              />
            ) : (
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Write your guide content here..."
              />
            )}
            <p className="text-xs text-muted-foreground">
              Estimated read time: {formData.read_time_minutes} min
            </p>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_published" className="cursor-pointer flex items-center gap-1">
                {formData.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4" />}
                Published
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_featured" className="cursor-pointer flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                Featured
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="homepage_featured"
                checked={formData.homepage_featured}
                onChange={(e) => setFormData((prev) => ({ ...prev, homepage_featured: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="homepage_featured" className="cursor-pointer flex items-center gap-1">
                <Home className="w-4 h-4 text-blue-500" />
                Homepage Featured
              </Label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/guides")}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
