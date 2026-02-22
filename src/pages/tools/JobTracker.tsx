import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Briefcase, Plus, Trash2, Edit2, Calendar, Building2, MapPin,
  DollarSign, ExternalLink, Clock, CheckCircle2, XCircle, Send,
  MessageSquare, Filter, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type JobStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";

interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  salary?: string;
  url?: string;
  status: JobStatus;
  appliedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<JobStatus, { label: string; color: string; icon: React.ReactNode }> = {
  saved: { label: "Saved", color: "bg-gray-500", icon: <Briefcase className="w-4 h-4" /> },
  applied: { label: "Applied", color: "bg-blue-500", icon: <Send className="w-4 h-4" /> },
  interviewing: { label: "Interviewing", color: "bg-purple-500", icon: <MessageSquare className="w-4 h-4" /> },
  offer: { label: "Offer", color: "bg-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500", icon: <XCircle className="w-4 h-4" /> },
  withdrawn: { label: "Withdrawn", color: "bg-orange-500", icon: <XCircle className="w-4 h-4" /> },
};

export default function JobTracker() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    location: "",
    salary: "",
    url: "",
    status: "saved" as JobStatus,
    appliedDate: "",
    notes: "",
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_jobs");
    if (saved) {
      setJobs(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("techtrendi_jobs", JSON.stringify(jobs));
  }, [jobs]);

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      location: "",
      salary: "",
      url: "",
      status: "saved",
      appliedDate: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.company || !formData.position) {
      toast.error("Company and position are required");
      return;
    }

    const now = new Date().toISOString();

    if (editingJob) {
      setJobs(jobs.map((j) =>
        j.id === editingJob.id
          ? { ...j, ...formData, updatedAt: now }
          : j
      ));
      toast.success("Job updated!");
      setEditingJob(null);
    } else {
      const newJob: JobApplication = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      setJobs([newJob, ...jobs]);
      toast.success("Job added!");
    }

    resetForm();
    setIsAddingNew(false);
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
    toast.success("Job removed");
  };

  const updateStatus = (id: string, status: JobStatus) => {
    setJobs(jobs.map((j) =>
      j.id === id
        ? { ...j, status, updatedAt: new Date().toISOString() }
        : j
    ));
    toast.success(`Status updated to ${statusConfig[status].label}`);
  };

  const startEditing = (job: JobApplication) => {
    setFormData({
      company: job.company,
      position: job.position,
      location: job.location,
      salary: job.salary || "",
      url: job.url || "",
      status: job.status,
      appliedDate: job.appliedDate || "",
      notes: job.notes || "",
    });
    setEditingJob(job);
    setIsAddingNew(true);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filterStatus === "all" || job.status === filterStatus;
    const matchesSearch =
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: jobs.length,
    saved: jobs.filter((j) => j.status === "saved").length,
    applied: jobs.filter((j) => j.status === "applied").length,
    interviewing: jobs.filter((j) => j.status === "interviewing").length,
    offer: jobs.filter((j) => j.status === "offer").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
    withdrawn: jobs.filter((j) => j.status === "withdrawn").length,
  };

  return (
    <Layout>
      <SEOHead
        title="Job Application Tracker - Track Your Job Search | TechTrendi"
        description="Track your job applications, interviews, and offers in one place. Never lose track of where you applied or forget to follow up."
        canonicalUrl="https://techtrendi.com/tools/job-tracker"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Job Application <span className="text-primary">Tracker</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Keep track of every application, interview, and offer. Never lose an opportunity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {(["all", "applied", "interviewing", "offer"] as const).map((status) => (
            <Card
              key={status}
              className={cn(
                "cursor-pointer transition-all",
                filterStatus === status && "ring-2 ring-primary"
              )}
              onClick={() => setFilterStatus(status)}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{statusCounts[status]}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {status === "all" ? "Total" : status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company or position..."
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: JobStatus | "all") => setFilterStatus(v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setEditingJob(null); setIsAddingNew(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddingNew} onOpenChange={(open) => { setIsAddingNew(open); if (!open) { resetForm(); setEditingJob(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
              <DialogDescription>
                {editingJob ? "Update the job details below" : "Enter the job details to start tracking"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company *</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Google"
                  />
                </div>
                <div>
                  <Label>Position *</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Remote, NYC"
                  />
                </div>
                <div>
                  <Label>Salary Range</Label>
                  <Input
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g., $120k-$150k"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: JobStatus) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", config.color)} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Applied Date</Label>
                  <Input
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Job URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Interview notes, contacts, requirements..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsAddingNew(false); resetForm(); setEditingJob(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingJob ? "Update Job" : "Add Job"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {jobs.length === 0 ? "No jobs tracked yet" : "No jobs match your filters"}
              </p>
              <p className="text-sm text-muted-foreground">
                {jobs.length === 0 ? "Add your first job application above to get started!" : "Try adjusting your search or filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Company Logo Placeholder */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
                      statusConfig[job.status].color
                    )}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{job.position}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                        </div>
                        <Badge className={cn("text-white flex-shrink-0", statusConfig[job.status].color)}>
                          {statusConfig[job.status].label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </span>
                        )}
                        {job.appliedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Applied: {new Date(job.appliedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {job.notes && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {job.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select
                        value={job.status}
                        onValueChange={(v: JobStatus) => updateStatus(job.id, v)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {job.url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      <Button variant="outline" size="icon" onClick={() => startEditing(job)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteJob(job.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!user && jobs.length > 0 && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-sm">
                <strong>Sign in</strong> to save your job applications and access them from any device!
              </p>
              <Button className="mt-4" asChild>
                <a href="/auth">Sign In Free</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
