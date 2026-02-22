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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Plus, Trash2, Edit2, Crown, Clock, User, Mail, Phone,
  Copy, Check, ExternalLink, Settings, X, Save, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface ServiceType {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface Booking {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface BookingSettings {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  timezone: string;
  bookingLink: string;
  bufferTime: number;
  maxAdvanceBooking: number;
  schedule: Record<string, DaySchedule>;
}

const STORAGE_KEY = "techtrendi_booking_data";

const defaultSchedule: Record<string, DaySchedule> = {
  monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

const defaultSettings: BookingSettings = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  timezone: "America/New_York",
  bookingLink: "",
  bufferTime: 15,
  maxAdvanceBooking: 30,
  schedule: defaultSchedule,
};

export default function AppointmentBooking() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [settings, setSettings] = useState<BookingSettings>(defaultSettings);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [serviceForm, setServiceForm] = useState({
    name: "",
    duration: 30,
    price: 0,
    description: "",
  });

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setSettings(data.settings || defaultSettings);
      setServices(data.services || []);
      setBookings(data.bookings || []);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, services, bookings }));
  }, [settings, services, bookings]);

  const resetServiceForm = () => {
    setServiceForm({ name: "", duration: 30, price: 0, description: "" });
    setEditingService(null);
    setShowServiceForm(false);
  };

  const saveService = () => {
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? { ...s, ...serviceForm } : s))
      );
      toast.success("Service updated!");
    } else {
      const newService: ServiceType = {
        id: Date.now().toString(),
        ...serviceForm,
      };
      setServices((prev) => [...prev, newService]);
      toast.success("Service added!");
    }
    resetServiceForm();
  };

  const editService = (service: ServiceType) => {
    setServiceForm({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description,
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success("Service deleted");
  };

  const updateBookingStatus = (id: string, status: Booking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    toast.success(`Booking ${status}`);
  };

  const toggleDayEnabled = (day: string) => {
    setSettings((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          enabled: !prev.schedule[day].enabled,
        },
      },
    }));
  };

  const updateDaySlot = (day: string, index: number, field: "start" | "end", value: string) => {
    setSettings((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          slots: prev.schedule[day].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
  };

  const copyBookingLink = () => {
    const link = `https://techtrendi.com/book/${settings.bookingLink || "your-link"}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getServiceName = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.name || "Unknown Service";
  };

  // Calendar helpers
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const getBookingsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.date === dateStr);
  };

  const upcomingBookings = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (!isPremium) {
    return (
      <Layout>
        <SEOHead
          title="Appointment Booking - Let Clients Book Online | TechTrendi"
          description="Let clients book appointments online. Set your availability, create services, and manage bookings in one place."
          canonicalUrl="https://techtrendi.com/tools/appointment-booking"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Appointment Booking</h1>
              <p className="text-muted-foreground mb-6">
                Let clients book appointments online with customizable availability, services, and automatic confirmations.
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
        title="Appointment Booking - Let Clients Book Online | TechTrendi"
        description="Let clients book appointments online. Set your availability, create services, and manage bookings in one place."
        canonicalUrl="https://techtrendi.com/tools/appointment-booking"
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
              Appointment <span className="text-primary">Booking</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Let clients book appointments online
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Your link:</span>
              <code className="text-sm font-mono">
                techtrendi.com/book/{settings.bookingLink || "your-link"}
              </code>
              <Button variant="ghost" size="sm" onClick={copyBookingLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Total Bookings</span>
              </div>
              <p className="text-3xl font-bold">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Upcoming</span>
              </div>
              <p className="text-3xl font-bold">
                {bookings.filter((b) => b.status !== "cancelled" && new Date(b.date) >= new Date()).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Confirmed</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {bookings.filter((b) => b.status === "confirmed").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Services</span>
              </div>
              <p className="text-3xl font-bold">{services.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Manage your upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-2xl font-bold">{new Date(booking.date).getDate()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.date).toLocaleString("default", { month: "short" })}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{booking.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {getServiceName(booking.serviceId)} at {booking.time}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Mail className="w-3 h-3" />
                              {booking.clientEmail}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              booking.status === "confirmed" && "bg-green-500",
                              booking.status === "pending" && "bg-yellow-500",
                              booking.status === "cancelled" && "bg-red-500"
                            )}
                          >
                            {booking.status}
                          </Badge>
                          {booking.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{monthName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayBookings = getBookingsForDate(day);
                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentMonth.getMonth() &&
                      new Date().getFullYear() === currentMonth.getFullYear();
                    return (
                      <div
                        key={day}
                        className={cn(
                          "p-2 min-h-[80px] border rounded-lg",
                          isToday && "bg-primary/10 border-primary"
                        )}
                      >
                        <p className={cn("text-sm font-medium", isToday && "text-primary")}>
                          {day}
                        </p>
                        {dayBookings.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className={cn(
                              "text-xs p-1 rounded mt-1 truncate",
                              b.status === "confirmed" && "bg-green-100 text-green-700",
                              b.status === "pending" && "bg-yellow-100 text-yellow-700",
                              b.status === "cancelled" && "bg-red-100 text-red-700"
                            )}
                          >
                            {b.time} {b.clientName.split(" ")[0]}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{dayBookings.length - 2} more
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>Define the services clients can book</CardDescription>
                  </div>
                  <Button onClick={() => setShowServiceForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No services yet. Add your first service!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="flex items-center gap-1 text-sm">
                                <Clock className="w-4 h-4" />
                                {service.duration} min
                              </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(service.price)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => editService(service)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteService(service.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>Set your working hours for each day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.schedule).map(([day, schedule]) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className="w-28">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={() => toggleDayEnabled(day)}
                        />
                        <span className="capitalize font-medium">{day}</span>
                      </div>
                    </div>
                    {schedule.enabled && schedule.slots[0] && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule.slots[0].start}
                          onChange={(e) => updateDaySlot(day, 0, "start", e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={schedule.slots[0].end}
                          onChange={(e) => updateDaySlot(day, 0, "end", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                    {!schedule.enabled && (
                      <span className="text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Settings</CardTitle>
                <CardDescription>Configure your booking page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      value={settings.ownerName}
                      onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <Label>Booking Link Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">techtrendi.com/book/</span>
                    <Input
                      value={settings.bookingLink}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bookingLink: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                      placeholder="your-name"
                      className="max-w-[200px]"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Buffer Time Between Appointments (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.bufferTime}
                      onChange={(e) =>
                        setSettings({ ...settings, bufferTime: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Advance Booking (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.maxAdvanceBooking}
                      onChange={(e) =>
                        setSettings({ ...settings, maxAdvanceBooking: parseInt(e.target.value) || 30 })
                      }
                    />
                  </div>
                </div>
                <Button onClick={() => toast.success("Settings saved!")}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Form Modal */}
        {showServiceForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{editingService ? "Edit Service" : "Add Service"}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetServiceForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Service Name *</Label>
                  <Input
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="Consultation Call"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={serviceForm.duration}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 30 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Describe the service..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetServiceForm}>
                    Cancel
                  </Button>
                  <Button onClick={saveService}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Service
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
