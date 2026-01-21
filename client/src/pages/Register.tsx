import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Users, Brain, Dumbbell, Apple, Trophy } from "lucide-react";

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childDateOfBirth: "",
    preferredPosition: "",
    currentClub: "",
    experience: "",
    medicalConditions: "",
    howHeard: "",
    message: "",
  });

  const submitMutation = trpc.registration.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Registration submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit registration");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate age from DOB
    const dob = new Date(formData.childDateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    submitMutation.mutate({
      ...formData,
      childAge: age,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Future Stars FC" className="h-12 w-auto" />
              <span className="text-xl font-bold text-primary">Future Stars FC</span>
            </Link>
          </div>
        </header>

        <div className="container py-20">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Registration Submitted!</h1>
              <p className="text-muted-foreground text-lg mb-8">
                Thank you for registering your child with Future Stars FC. Our team will review your application and contact you within 2-3 business days to schedule a trial session.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
                <Link href="/team">
                  <Button>Meet Our Team</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Future Stars FC" className="h-12 w-auto" />
            <span className="text-xl font-bold text-primary">Future Stars FC</span>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-orange-100/30 py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Future Stars FC</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Register your child for our elite football academy program. We develop complete athletes through technical excellence, mental strength, and physical conditioning.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-card">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: Trophy, label: "Elite Coaching" },
              { icon: Brain, label: "Mental Training" },
              { icon: Dumbbell, label: "Physical Conditioning" },
              { icon: Apple, label: "Nutrition Plans" },
              { icon: Users, label: "Parent Portal" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16">
        <div className="container">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Registration Form</CardTitle>
              <CardDescription>
                Please fill out the form below to register your child. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Parent/Guardian Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Full Name *</Label>
                      <Input
                        id="parentName"
                        required
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Email Address *</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        required
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="parentPhone">Phone Number *</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        required
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Child Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Child Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="childName">Child's Full Name *</Label>
                      <Input
                        id="childName"
                        required
                        value={formData.childName}
                        onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                        placeholder="Enter child's full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childDateOfBirth">Date of Birth *</Label>
                      <Input
                        id="childDateOfBirth"
                        type="date"
                        required
                        value={formData.childDateOfBirth}
                        onChange={(e) => setFormData({ ...formData, childDateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredPosition">Preferred Position</Label>
                      <Select
                        value={formData.preferredPosition}
                        onValueChange={(value) => setFormData({ ...formData, preferredPosition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                          <SelectItem value="defender">Defender</SelectItem>
                          <SelectItem value="midfielder">Midfielder</SelectItem>
                          <SelectItem value="forward">Forward</SelectItem>
                          <SelectItem value="not_sure">Not Sure Yet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentClub">Current Club (if any)</Label>
                      <Input
                        id="currentClub"
                        value={formData.currentClub}
                        onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                        placeholder="Enter current club name"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Football Experience</Label>
                      <Textarea
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Describe your child's football experience, achievements, and training history..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medicalConditions">Medical Conditions or Allergies</Label>
                      <Textarea
                        id="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                        placeholder="Please list any medical conditions, allergies, or special requirements..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="howHeard">How did you hear about us?</Label>
                      <Select
                        value={formData.howHeard}
                        onValueChange={(value) => setFormData({ ...formData, howHeard: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="friend">Friend or Family</SelectItem>
                          <SelectItem value="search">Google Search</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="event">Sports Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Any questions or additional information you'd like to share..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  By submitting this form, you agree to our terms and conditions. We will contact you within 2-3 business days.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>© 2024 Future Stars FC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
