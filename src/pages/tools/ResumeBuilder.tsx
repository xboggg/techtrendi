import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Plus, Trash2, Download, Eye, User, Mail, Phone, MapPin,
  Briefcase, GraduationCap, Award, Code, Globe, Linkedin, Github, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
}

const STORAGE_KEY = "techtrendi_resume_data";

const defaultResume: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
};

export default function ResumeBuilder() {
  const { user } = useAuth();

  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  // Load data
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setResume(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save data
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(resume));
    }
  }, [resume, user]);

  const updatePersonalInfo = (field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    setResume((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const updateExperience = (id: string, field: string, value: string | boolean) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: "",
      school: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (resume.skills.includes(newSkill.trim())) {
      toast.error("Skill already added");
      return;
    }
    setResume((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()],
    }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addCertification = () => {
    if (!newCertification.trim()) return;
    setResume((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCertification.trim()],
    }));
    setNewCertification("");
  };

  const removeCertification = (cert: string) => {
    setResume((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  };

  const downloadAsText = () => {
    const { personalInfo, experience, education, skills, certifications } = resume;

    let text = `${personalInfo.fullName}\n`;
    text += `${[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}\n`;
    if (personalInfo.linkedin || personalInfo.github || personalInfo.website) {
      text += `${[personalInfo.linkedin, personalInfo.github, personalInfo.website].filter(Boolean).join(" | ")}\n`;
    }
    text += "\n";

    if (personalInfo.summary) {
      text += `PROFESSIONAL SUMMARY\n${"=".repeat(50)}\n${personalInfo.summary}\n\n`;
    }

    if (experience.length > 0) {
      text += `EXPERIENCE\n${"=".repeat(50)}\n`;
      experience.forEach((exp) => {
        text += `${exp.title} at ${exp.company}\n`;
        text += `${exp.location} | ${exp.startDate} - ${exp.current ? "Present" : exp.endDate}\n`;
        if (exp.description) text += `${exp.description}\n`;
        text += "\n";
      });
    }

    if (education.length > 0) {
      text += `EDUCATION\n${"=".repeat(50)}\n`;
      education.forEach((edu) => {
        text += `${edu.degree} - ${edu.school}\n`;
        text += `${edu.location} | ${edu.startDate} - ${edu.endDate}\n`;
        if (edu.description) text += `${edu.description}\n`;
        text += "\n";
      });
    }

    if (skills.length > 0) {
      text += `SKILLS\n${"=".repeat(50)}\n${skills.join(", ")}\n\n`;
    }

    if (certifications.length > 0) {
      text += `CERTIFICATIONS\n${"=".repeat(50)}\n${certifications.join("\n")}\n`;
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personalInfo.fullName || "resume"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resume downloaded!");
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="Resume Builder - Create Professional Resumes | TechTrendi"
          description="Build a professional resume with our free resume builder. Beautiful templates, easy editing, and PDF export."
          canonicalUrl="https://techtrendi.com/tools/resume-builder"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Resume Builder</h1>
              <p className="text-muted-foreground mb-6">
                Create a professional resume and save your progress. Sign in to get started.
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
        title="Resume Builder - Create Professional Resumes | TechTrendi"
        description="Build a professional resume with our free resume builder. Beautiful templates, easy editing, and PDF export."
        canonicalUrl="https://techtrendi.com/tools/resume-builder"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Free + Account
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Resume <span className="text-primary">Builder</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a professional resume that stands out
            </p>
          </div>
          <Button onClick={downloadAsText}>
            <Download className="w-4 h-4 mr-2" />
            Download Resume
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full mb-6">
                <TabsTrigger value="personal">
                  <User className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="experience">
                  <Briefcase className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="education">
                  <GraduationCap className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="skills">
                  <Code className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="certifications">
                  <Award className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              {/* Personal Info */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={resume.personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={resume.personalInfo.email}
                          onChange={(e) => updatePersonalInfo("email", e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={resume.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={resume.personalInfo.location}
                        onChange={(e) => updatePersonalInfo("location", e.target.value)}
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>LinkedIn URL</Label>
                        <Input
                          value={resume.personalInfo.linkedin}
                          onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                          placeholder="linkedin.com/in/johnsmith"
                        />
                      </div>
                      <div>
                        <Label>GitHub URL</Label>
                        <Input
                          value={resume.personalInfo.github}
                          onChange={(e) => updatePersonalInfo("github", e.target.value)}
                          placeholder="github.com/johnsmith"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={resume.personalInfo.website}
                        onChange={(e) => updatePersonalInfo("website", e.target.value)}
                        placeholder="johnsmith.com"
                      />
                    </div>
                    <div>
                      <Label>Professional Summary</Label>
                      <Textarea
                        value={resume.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                        placeholder="Write a brief professional summary..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience */}
              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Work Experience</CardTitle>
                      <Button size="sm" onClick={addExperience}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {resume.experience.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No experience added yet
                      </p>
                    ) : (
                      resume.experience.map((exp) => (
                        <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <Label>Job Title</Label>
                                <Input
                                  value={exp.title}
                                  onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                                  placeholder="Software Engineer"
                                />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input
                                  value={exp.company}
                                  onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                  placeholder="Google"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(exp.id)}
                              className="text-red-500 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                              placeholder="San Francisco, CA"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                                placeholder="Jan 2020"
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                                placeholder="Present"
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                              placeholder="Describe your responsibilities and achievements..."
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education */}
              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Education</CardTitle>
                      <Button size="sm" onClick={addEducation}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {resume.education.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No education added yet
                      </p>
                    ) : (
                      resume.education.map((edu) => (
                        <div key={edu.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <Label>Degree</Label>
                                <Input
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                  placeholder="Bachelor of Science in Computer Science"
                                />
                              </div>
                              <div>
                                <Label>School</Label>
                                <Input
                                  value={edu.school}
                                  onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                                  placeholder="Stanford University"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(edu.id)}
                              className="text-red-500 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={edu.location}
                              onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                              placeholder="Stanford, CA"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                value={edu.startDate}
                                onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                                placeholder="2016"
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                                placeholder="2020"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button onClick={addSkill}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-3 py-1 cursor-pointer hover:bg-red-100 hover:text-red-700"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <Trash2 className="w-3 h-3 ml-2" />
                        </Badge>
                      ))}
                    </div>
                    {resume.skills.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No skills added yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certifications */}
              <TabsContent value="certifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        placeholder="Add a certification..."
                        onKeyDown={(e) => e.key === "Enter" && addCertification()}
                      />
                      <Button onClick={addCertification}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {resume.certifications.map((cert) => (
                        <div
                          key={cert}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span>{cert}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCertification(cert)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {resume.certifications.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No certifications added yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white text-black p-8 rounded-lg border min-h-[600px] text-sm">
                  {/* Header */}
                  <div className="text-center border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold">
                      {resume.personalInfo.fullName || "Your Name"}
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-2 text-gray-600 flex-wrap">
                      {resume.personalInfo.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {resume.personalInfo.email}
                        </span>
                      )}
                      {resume.personalInfo.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {resume.personalInfo.phone}
                        </span>
                      )}
                      {resume.personalInfo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {resume.personalInfo.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-1 text-gray-600">
                      {resume.personalInfo.linkedin && (
                        <span className="flex items-center gap-1">
                          <Linkedin className="w-3 h-3" />
                          {resume.personalInfo.linkedin}
                        </span>
                      )}
                      {resume.personalInfo.github && (
                        <span className="flex items-center gap-1">
                          <Github className="w-3 h-3" />
                          {resume.personalInfo.github}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {resume.personalInfo.summary && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide border-b mb-2">
                        Professional Summary
                      </h2>
                      <p className="text-gray-700">{resume.personalInfo.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {resume.experience.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide border-b mb-2">
                        Experience
                      </h2>
                      {resume.experience.map((exp) => (
                        <div key={exp.id} className="mb-3">
                          <div className="flex justify-between">
                            <span className="font-semibold">{exp.title || "Job Title"}</span>
                            <span className="text-gray-600 text-xs">
                              {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs">
                            {exp.company} | {exp.location}
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 mt-1 text-xs">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {resume.education.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide border-b mb-2">
                        Education
                      </h2>
                      {resume.education.map((edu) => (
                        <div key={edu.id} className="mb-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">{edu.degree || "Degree"}</span>
                            <span className="text-gray-600 text-xs">
                              {edu.startDate} - {edu.endDate}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs">
                            {edu.school} | {edu.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide border-b mb-2">
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-1">
                        {resume.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {resume.certifications.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wide border-b mb-2">
                        Certifications
                      </h2>
                      <ul className="list-disc list-inside text-gray-700">
                        {resume.certifications.map((cert) => (
                          <li key={cert} className="text-xs">{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
