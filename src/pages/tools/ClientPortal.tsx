import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building, Plus, Trash2, Edit2, Crown, Upload, FileText, MessageSquare,
  DollarSign, User, Mail, Phone, Copy, Check, X, Save, Download, Send, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  portalLink: string;
  createdAt: string;
}

interface SharedFile {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface Message {
  id: string;
  clientId: string;
  content: string;
  sender: "you" | "client";
  timestamp: string;
}

interface Invoice {
  id: string;
  clientId: string;
  number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

const STORAGE_KEY = "techtrendi_portal_data";

export default function ClientPortal() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setClients(data.clients || []);
      setFiles(data.files || []);
      setMessages(data.messages || []);
      setInvoices(data.invoices || []);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, files, messages, invoices }));
  }, [clients, files, messages, invoices]);

  const resetClientForm = () => {
    setClientForm({ name: "", email: "", phone: "", company: "" });
    setEditingClient(null);
    setShowClientForm(false);
  };

  const generatePortalLink = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 8);
  };

  const saveClient = () => {
    if (!clientForm.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (editingClient) {
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? { ...c, ...clientForm } : c))
      );
      toast.success("Client updated!");
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        ...clientForm,
        portalLink: generatePortalLink(clientForm.name),
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [...prev, newClient]);
      toast.success("Client added!");
    }
    resetClientForm();
  };

  const editClient = (client: Client) => {
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
    });
    setEditingClient(client);
    setShowClientForm(true);
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setFiles((prev) => prev.filter((f) => f.clientId !== id));
    setMessages((prev) => prev.filter((m) => m.clientId !== id));
    setInvoices((prev) => prev.filter((i) => i.clientId !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    toast.success("Client deleted");
  };

  const copyPortalLink = (link: string) => {
    navigator.clipboard.writeText(`https://techtrendi.com/portal/${link}`);
    setCopied(true);
    toast.success("Portal link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedClient) return;

    const message: Message = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      content: newMessage,
      sender: "you",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    toast.success("Message sent!");
  };

  const simulateFileUpload = () => {
    if (!selectedClient) return;

    const file: SharedFile = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      name: `Document_${Date.now()}.pdf`,
      type: "PDF",
      size: "1.2 MB",
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => [...prev, file]);
    toast.success("File uploaded!");
  };

  const createInvoice = () => {
    if (!selectedClient) return;

    const invoice: Invoice = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      number: `INV-${String(invoices.length + 1).padStart(4, "0")}`,
      amount: 0,
      status: "draft",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [...prev, invoice]);
    toast.success("Invoice created!");
  };

  const updateInvoiceStatus = (id: string, status: Invoice["status"]) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    toast.success("Invoice status updated");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const clientFiles = files.filter((f) => f.clientId === selectedClient?.id);
  const clientMessages = messages.filter((m) => m.clientId === selectedClient?.id);
  const clientInvoices = invoices.filter((i) => i.clientId === selectedClient?.id);

  if (!isPremium) {
    return (
      <Layout>
        <SEOHead
          title="Client Portal - Share Files & Invoices | TechTrendi"
          description="Create branded client portals to share files, invoices, and messages with clients in one secure place."
          canonicalUrl="https://techtrendi.com/tools/client-portal"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Client Portal</h1>
              <p className="text-muted-foreground mb-6">
                Share files, invoices, and messages with clients in one branded portal. Perfect for freelancers and agencies.
              </p>
              <Button asChild size="lg">
                <a href="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium - $4.99/month
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Client Portal - Share Files & Invoices | TechTrendi"
        description="Create branded client portals to share files, invoices, and messages with clients in one secure place."
        canonicalUrl="https://techtrendi.com/tools/client-portal"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Crown className="w-3 h-3 mr-1" />
              Premium Tool
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Client <span className="text-primary">Portal</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Share files, invoices, and messages with clients
            </p>
          </div>
          <Button onClick={() => setShowClientForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Clients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No clients yet
                  </p>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedClient?.id === client.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-3">
            {!selectedClient ? (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Building className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Select a Client</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a client from the list or add a new one
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedClient.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editClient(selectedClient)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>{selectedClient.company}</CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {selectedClient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedClient.email}
                          </span>
                        )}
                        {selectedClient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedClient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPortalLink(selectedClient.portalLink)}
                      >
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        Copy Portal Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteClient(selectedClient.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="files">
                    <TabsList className="mb-4">
                      <TabsTrigger value="files">
                        <FileText className="w-4 h-4 mr-1" />
                        Files ({clientFiles.length})
                      </TabsTrigger>
                      <TabsTrigger value="messages">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Messages ({clientMessages.length})
                      </TabsTrigger>
                      <TabsTrigger value="invoices">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Invoices ({clientInvoices.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Files Tab */}
                    <TabsContent value="files">
                      <div className="space-y-4">
                        <Button onClick={simulateFileUpload}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </Button>
                        {clientFiles.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No files shared yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {clientFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-8 h-8 text-primary" />
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.type} • {file.size}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setFiles((prev) => prev.filter((f) => f.id !== file.id));
                                      toast.success("File deleted");
                                    }}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Messages Tab */}
                    <TabsContent value="messages">
                      <div className="space-y-4">
                        <div className="h-[300px] overflow-y-auto border rounded-lg p-4 space-y-3">
                          {clientMessages.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No messages yet</p>
                            </div>
                          ) : (
                            clientMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={cn(
                                  "max-w-[80%] p-3 rounded-lg",
                                  msg.sender === "you"
                                    ? "ml-auto bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          />
                          <Button onClick={sendMessage}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices">
                      <div className="space-y-4">
                        <Button onClick={createInvoice}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Invoice
                        </Button>
                        {clientInvoices.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No invoices yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {clientInvoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                              >
                                <div>
                                  <p className="font-medium">{invoice.number}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Due: {invoice.dueDate}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">
                                    {formatCurrency(invoice.amount)}
                                  </span>
                                  <Select
                                    value={invoice.status}
                                    onValueChange={(value) =>
                                      updateInvoiceStatus(invoice.id, value as Invoice["status"])
                                    }
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">Draft</SelectItem>
                                      <SelectItem value="sent">Sent</SelectItem>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="overdue">Overdue</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Client Form Modal */}
        {showClientForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingClient ? "Edit Client" : "Add Client"}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetClientForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetClientForm}>
                    Cancel
                  </Button>
                  <Button onClick={saveClient}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
