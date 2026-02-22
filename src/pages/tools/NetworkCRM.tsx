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
import {
  Users, Plus, Trash2, Edit2, Search, User, Mail, Phone, Building,
  Calendar, MessageSquare, X, Save, Clock, Star, Linkedin, Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  linkedin: string;
  twitter: string;
  notes: string;
  relationship: "strong" | "medium" | "weak";
  lastContact: string;
  nextFollowUp: string;
  tags: string[];
  createdAt: string;
}

interface Interaction {
  id: string;
  contactId: string;
  type: "call" | "email" | "meeting" | "message" | "other";
  notes: string;
  date: string;
}

const STORAGE_KEY = "techtrendi_network_data";

export default function NetworkCRM() {
  const { user } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRelationship, setFilterRelationship] = useState<string>("all");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newTag, setNewTag] = useState("");

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    linkedin: "",
    twitter: "",
    notes: "",
    relationship: "medium" as Contact["relationship"],
    nextFollowUp: "",
    tags: [] as string[],
  });

  const [interactionForm, setInteractionForm] = useState({
    type: "message" as Interaction["type"],
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Load data
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        setContacts(data.contacts || []);
        setInteractions(data.interactions || []);
      }
    }
  }, [user]);

  // Save data
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({ contacts, interactions }));
    }
  }, [contacts, interactions, user]);

  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      linkedin: "",
      twitter: "",
      notes: "",
      relationship: "medium",
      nextFollowUp: "",
      tags: [],
    });
    setEditingContact(null);
    setShowContactForm(false);
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      type: "message",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowInteractionForm(false);
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
        lastContact: new Date().toISOString().split("T")[0],
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
      role: contact.role,
      linkedin: contact.linkedin,
      twitter: contact.twitter,
      notes: contact.notes,
      relationship: contact.relationship,
      nextFollowUp: contact.nextFollowUp,
      tags: contact.tags,
    });
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setInteractions((prev) => prev.filter((i) => i.contactId !== id));
    if (selectedContact?.id === id) setSelectedContact(null);
    toast.success("Contact deleted");
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (contactForm.tags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setContactForm((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setContactForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const saveInteraction = () => {
    if (!selectedContact) return;
    if (!interactionForm.notes.trim()) {
      toast.error("Please add some notes");
      return;
    }

    const newInteraction: Interaction = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      ...interactionForm,
    };
    setInteractions((prev) => [...prev, newInteraction]);

    // Update last contact date
    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id
          ? { ...c, lastContact: interactionForm.date }
          : c
      )
    );

    toast.success("Interaction logged!");
    resetInteractionForm();
  };

  const getRelationshipColor = (relationship: Contact["relationship"]) => {
    switch (relationship) {
      case "strong":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
        return "bg-red-500";
    }
  };

  const getInteractionIcon = (type: Interaction["type"]) => {
    switch (type) {
      case "call":
        return Phone;
      case "email":
        return Mail;
      case "meeting":
        return Users;
      case "message":
        return MessageSquare;
      default:
        return Clock;
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRelationship =
      filterRelationship === "all" || c.relationship === filterRelationship;
    return matchesSearch && matchesRelationship;
  });

  const contactInteractions = interactions
    .filter((i) => i.contactId === selectedContact?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const needsFollowUp = contacts.filter((c) => {
    if (!c.nextFollowUp) return false;
    return new Date(c.nextFollowUp) <= new Date();
  });

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Network CRM - Manage Professional Contacts | TechTrendi"
          description="Keep track of your professional network. Never forget to follow up with contacts again."
          canonicalUrl="https://techtrendi.com/tools/network-crm"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Users className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Network CRM</h1>
              <p className="text-muted-foreground mb-6">
                Keep track of your professional network and never forget to follow up. Sign in to get started.
              </p>
              <Button asChild size="lg">
                <a href="/auth">Sign In to Continue</a>
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
        title="Network CRM - Manage Professional Contacts | TechTrendi"
        description="Keep track of your professional network. Never forget to follow up with contacts again."
        canonicalUrl="https://techtrendi.com/tools/network-crm"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Free + Account
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Network <span className="text-primary">CRM</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Nurture your professional relationships
            </p>
          </div>
          <Button onClick={() => setShowContactForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total Contacts</span>
              </div>
              <p className="text-3xl font-bold">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="w-4 h-4 text-green-500" />
                <span className="text-sm">Strong</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {contacts.filter((c) => c.relationship === "strong").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-sm">Needs Follow-up</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{needsFollowUp.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Interactions</span>
              </div>
              <p className="text-3xl font-bold">{interactions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Reminder */}
        {needsFollowUp.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-700 dark:text-red-400">
                Follow-up Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {needsFollowUp.map((contact) => (
                  <Badge
                    key={contact.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => setSelectedContact(contact)}
                  >
                    {contact.name} - Due {contact.nextFollowUp}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterRelationship} onValueChange={setFilterRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Relationships</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="weak">Weak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No contacts found
                  </p>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedContact?.id === contact.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
                              getRelationshipColor(contact.relationship)
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.role} at {contact.company}
                          </p>
                        </div>
                      </div>
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-2">
            {!selectedContact ? (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Select a Contact</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a contact to view details and log interactions
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {selectedContact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900",
                            getRelationshipColor(selectedContact.relationship)
                          )}
                        />
                      </div>
                      <div>
                        <CardTitle>{selectedContact.name}</CardTitle>
                        <CardDescription>
                          {selectedContact.role} at {selectedContact.company}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedContact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editContact(selectedContact)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContact(selectedContact.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.phone}</span>
                      </div>
                    )}
                    {selectedContact.linkedin && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.linkedin}</span>
                      </div>
                    )}
                    {selectedContact.twitter && (
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.twitter}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedContact.notes && (
                    <div>
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
                    </div>
                  )}

                  {/* Follow-up Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground">Last Contact</span>
                      <p className="font-medium">{selectedContact.lastContact || "Never"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Next Follow-up</span>
                      <p className="font-medium">{selectedContact.nextFollowUp || "Not set"}</p>
                    </div>
                  </div>

                  {/* Interactions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Interaction History</h4>
                      <Button size="sm" onClick={() => setShowInteractionForm(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Log Interaction
                      </Button>
                    </div>
                    {contactInteractions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No interactions logged yet
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {contactInteractions.map((interaction) => {
                          const Icon = getInteractionIcon(interaction.type);
                          return (
                            <div
                              key={interaction.id}
                              className="flex items-start gap-3 p-3 border rounded-lg"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium capitalize text-sm">
                                    {interaction.type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {interaction.date}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {interaction.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg my-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingContact ? "Edit Contact" : "Add Contact"}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetContactForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={contactForm.relationship}
                      onValueChange={(value) =>
                        setContactForm({ ...contactForm, relationship: value as Contact["relationship"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="weak">Weak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value={contactForm.role}
                      onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                      placeholder="CEO"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={contactForm.linkedin}
                      onChange={(e) => setContactForm({ ...contactForm, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/johnsmith"
                    />
                  </div>
                  <div>
                    <Label>Twitter</Label>
                    <Input
                      value={contactForm.twitter}
                      onChange={(e) => setContactForm({ ...contactForm, twitter: e.target.value })}
                      placeholder="@johnsmith"
                    />
                  </div>
                </div>
                <div>
                  <Label>Next Follow-up</Label>
                  <Input
                    type="date"
                    value={contactForm.nextFollowUp}
                    onChange={(e) => setContactForm({ ...contactForm, nextFollowUp: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contactForm.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="How do you know this person? Any important details..."
                    className="min-h-[80px]"
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

        {/* Interaction Form Modal */}
        {showInteractionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Log Interaction</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetInteractionForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={interactionForm.type}
                    onValueChange={(value) =>
                      setInteractionForm({ ...interactionForm, type: value as Interaction["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={interactionForm.date}
                    onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={interactionForm.notes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                    placeholder="What did you discuss?"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetInteractionForm}>
                    Cancel
                  </Button>
                  <Button onClick={saveInteraction}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
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
