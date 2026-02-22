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
  Users, Plus, Trash2, Edit2, Search, Crown, Phone, Mail, Building,
  DollarSign, Calendar, CheckCircle, Clock, XCircle, ArrowRight, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type DealStage = "lead" | "contacted" | "proposal" | "negotiation" | "won" | "lost";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  contactId: string;
  value: number;
  stage: DealStage;
  expectedClose: string;
  notes: string;
  createdAt: string;
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  contactId: string;
  description: string;
  date: string;
}

const STORAGE_KEY = "techtrendi_crm_data";

const dealStages: { value: DealStage; label: string; color: string }[] = [
  { value: "lead", label: "Lead", color: "bg-gray-500" },
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "proposal", label: "Proposal", color: "bg-yellow-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-purple-500" },
  { value: "won", label: "Won", color: "bg-green-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" },
];

export default function SimpleCRM() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  const [dealForm, setDealForm] = useState({
    title: "",
    contactId: "",
    value: 0,
    stage: "lead" as DealStage,
    expectedClose: "",
    notes: "",
  });

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setContacts(data.contacts || []);
      setDeals(data.deals || []);
      setActivities(data.activities || []);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ contacts, deals, activities }));
  }, [contacts, deals, activities]);

  const resetContactForm = () => {
    setContactForm({ name: "", email: "", phone: "", company: "", notes: "" });
    setEditingContact(null);
    setShowContactForm(false);
  };

  const resetDealForm = () => {
    setDealForm({ title: "", contactId: "", value: 0, stage: "lead", expectedClose: "", notes: "" });
    setEditingDeal(null);
    setShowDealForm(false);
  };

  const saveContact = () => {
    if (!contactForm.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingContact.id ? { ...c, ...contactForm } : c))
      );
      toast.success("Contact updated!");
    } else {
      const newContact: Contact = {
        id: Date.now().toString(),
        ...contactForm,
        createdAt: new Date().toISOString(),
      };
      setContacts((prev) => [...prev, newContact]);
      toast.success("Contact added!");
    }
    resetContactForm();
  };

  const editContact = (contact: Contact) => {
    setContactForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      notes: contact.notes,
    });
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeals((prev) => prev.filter((d) => d.contactId !== id));
    setActivities((prev) => prev.filter((a) => a.contactId !== id));
    toast.success("Contact deleted");
  };

  const saveDeal = () => {
    if (!dealForm.title.trim()) {
      toast.error("Deal title is required");
      return;
    }
    if (!dealForm.contactId) {
      toast.error("Please select a contact");
      return;
    }

    if (editingDeal) {
      setDeals((prev) =>
        prev.map((d) => (d.id === editingDeal.id ? { ...d, ...dealForm } : d))
      );
      toast.success("Deal updated!");
    } else {
      const newDeal: Deal = {
        id: Date.now().toString(),
        ...dealForm,
        createdAt: new Date().toISOString(),
      };
      setDeals((prev) => [...prev, newDeal]);
      toast.success("Deal added!");
    }
    resetDealForm();
  };

  const editDeal = (deal: Deal) => {
    setDealForm({
      title: deal.title,
      contactId: deal.contactId,
      value: deal.value,
      stage: deal.stage,
      expectedClose: deal.expectedClose,
      notes: deal.notes,
    });
    setEditingDeal(deal);
    setShowDealForm(true);
  };

  const deleteDeal = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deal deleted");
  };

  const updateDealStage = (dealId: string, newStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
    toast.success("Deal stage updated");
  };

  const getContactName = (contactId: string) => {
    return contacts.find((c) => c.id === contactId)?.name || "Unknown";
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPipelineValue = deals
    .filter((d) => !["won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const wonDealsValue = deals
    .filter((d) => d.stage === "won")
    .reduce((sum, d) => sum + d.value, 0);

  if (!isPremium) {
    return (
      <Layout>
        <SEOHead
          title="Simple CRM - Track Customers & Deals | TechTrendi"
          description="Track customers, deals, and follow-ups in one simple dashboard. Perfect for freelancers and small businesses."
          canonicalUrl="https://techtrendi.com/tools/simple-crm"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Simple CRM</h1>
              <p className="text-muted-foreground mb-6">
                Track customers, deals, and follow-ups in one simple dashboard. Perfect for freelancers and small businesses.
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
        title="Simple CRM - Track Customers & Deals | TechTrendi"
        description="Track customers, deals, and follow-ups in one simple dashboard. Perfect for freelancers and small businesses."
        canonicalUrl="https://techtrendi.com/tools/simple-crm"
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
              Simple <span className="text-primary">CRM</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your contacts, deals, and pipeline in one place
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowContactForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
            <Button variant="outline" onClick={() => setShowDealForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Contacts</span>
              </div>
              <p className="text-3xl font-bold">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Pipeline Value</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalPipelineValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Won Deals</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(wonDealsValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Active Deals</span>
              </div>
              <p className="text-3xl font-bold">
                {deals.filter((d) => !["won", "lost"].includes(d.stage)).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>All Contacts</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No contacts yet. Add your first contact!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {contact.company}
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => editContact(contact)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContact(contact.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <CardTitle>All Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {deals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No deals yet. Create your first deal!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deals.map((deal) => {
                      const stage = dealStages.find((s) => s.value === deal.stage);
                      return (
                        <div
                          key={deal.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{deal.title}</p>
                              <Badge className={cn("text-white", stage?.color)}>
                                {stage?.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{getContactName(deal.contactId)}</span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(deal.value)}
                              </span>
                              {deal.expectedClose && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {deal.expectedClose}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={deal.stage}
                              onValueChange={(value) => updateDealStage(deal.id, value as DealStage)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {dealStages.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" onClick={() => editDeal(deal)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDeal(deal.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dealStages.map((stage) => {
                const stageDeals = deals.filter((d) => d.stage === stage.value);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                return (
                  <Card key={stage.value} className="min-h-[300px]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                        <CardTitle className="text-sm">{stage.label}</CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stageDeals.length} deals • {formatCurrency(stageValue)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-2 rounded border bg-muted/50 text-sm cursor-pointer hover:bg-muted"
                          onClick={() => editDeal(deal)}
                        >
                          <p className="font-medium truncate">{deal.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getContactName(deal.contactId)}
                          </p>
                          <p className="text-xs font-semibold text-primary">
                            {formatCurrency(deal.value)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingContact ? "Edit Contact" : "Add Contact"}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetContactForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetContactForm}>
                    Cancel
                  </Button>
                  <Button onClick={saveContact}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deal Form Modal */}
        {showDealForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingDeal ? "Edit Deal" : "Add Deal"}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetDealForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Deal Title *</Label>
                  <Input
                    value={dealForm.title}
                    onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                    placeholder="Website Redesign"
                  />
                </div>
                <div>
                  <Label>Contact *</Label>
                  <Select
                    value={dealForm.contactId}
                    onValueChange={(value) => setDealForm({ ...dealForm, contactId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company && `(${c.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Value ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={dealForm.value}
                      onChange={(e) =>
                        setDealForm({ ...dealForm, value: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Stage</Label>
                    <Select
                      value={dealForm.stage}
                      onValueChange={(value) => setDealForm({ ...dealForm, stage: value as DealStage })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dealStages.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Expected Close Date</Label>
                  <Input
                    type="date"
                    value={dealForm.expectedClose}
                    onChange={(e) => setDealForm({ ...dealForm, expectedClose: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={dealForm.notes}
                    onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                    placeholder="Deal notes..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetDealForm}>
                    Cancel
                  </Button>
                  <Button onClick={saveDeal}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Deal
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
