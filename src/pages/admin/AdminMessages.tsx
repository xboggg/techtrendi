import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Mail,
  Trash2,
  Search,
  Loader2,
  Eye,
  Calendar,
  User,
  MessageSquare,
  Tag,
} from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  created_at: string;
  is_read?: boolean;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast({ title: "Message deleted successfully!" });
      setSelectedMessage(null);
    },
    onError: (error) => {
      toast({ title: "Error deleting message", description: String(error), variant: "destructive" });
    },
  });

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      msg.name.toLowerCase().includes(searchLower) ||
      msg.email.toLowerCase().includes(searchLower) ||
      msg.subject.toLowerCase().includes(searchLower) ||
      msg.message.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-500/10 text-blue-600",
      support: "bg-green-500/10 text-green-600",
      partnership: "bg-purple-500/10 text-purple-600",
      feedback: "bg-orange-500/10 text-orange-600",
      other: "bg-gray-500/10 text-gray-600",
    };
    return colors[category] || colors.other;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">View contact form submissions</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Total Messages</span>
            </div>
            <p className="text-2xl font-bold">{messages.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Support</span>
            </div>
            <p className="text-2xl font-bold">
              {messages.filter((m) => m.category === "support").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Partnership</span>
            </div>
            <p className="text-2xl font-bold">
              {messages.filter((m) => m.category === "partnership").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Feedback</span>
            </div>
            <p className="text-2xl font-bold">
              {messages.filter((m) => m.category === "feedback").length}
            </p>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((msg) => (
                  <TableRow key={msg.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => setSelectedMessage(msg)}>
                      <div>
                        <p className="font-medium text-foreground">{msg.name}</p>
                        <p className="text-xs text-muted-foreground">{msg.email}</p>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => setSelectedMessage(msg)}>
                      <p className="line-clamp-1">{msg.subject}</p>
                    </TableCell>
                    <TableCell onClick={() => setSelectedMessage(msg)}>
                      <Badge className={getCategoryColor(msg.category)}>
                        {msg.category}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={() => setSelectedMessage(msg)}>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(msg.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMessage(msg)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this message?")) {
                              deleteMutation.mutate(msg.id);
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

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>

            {selectedMessage && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      From
                    </div>
                    <p className="font-medium">{selectedMessage.name}</p>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Received
                    </div>
                    <p>{formatDate(selectedMessage.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    Category
                  </div>
                  <Badge className={getCategoryColor(selectedMessage.category)}>
                    {selectedMessage.category}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Subject
                  </div>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Message
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this message?")) {
                        deleteMutation.mutate(selectedMessage.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button asChild>
                    <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Reply via Email
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
