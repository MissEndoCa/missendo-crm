import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Zap, Heart, Lock, BarChart3, Calendar, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import LegalFooter from "@/components/LegalFooter";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b">
            <img src="/miss-endo-logo.webp" alt="Miss Endo" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-3xl">About Us</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last Updated: March 27, 2026</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Digital Transformation in Health Tourism</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Miss Endo CRM is a secure and comprehensive customer relationship management platform specifically designed for clinics operating in the health tourism sector. Our goal is to digitize the entire patient journey end-to-end, increasing operational efficiency and maximizing patient satisfaction.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Our Mission</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">To help clinics operating in the health tourism sector manage their patient relationships more effectively, automate their operational processes, and accelerate their growth. While doing so, we are committed to maintaining the highest level of patient data security and privacy.</p>
              </div>
              <div className="p-6 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Our Vision</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">As a pioneer of digital transformation in the health tourism sector, to provide innovative and reliable technology solutions that enable clinics to compete on a global scale.</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center">Platform Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Users, title: "Lead & Patient Management", description: "Track potential patients (leads) from first contact through the entire treatment process. Automatically import leads from Facebook Lead Ads directly into your CRM. Manage patients' demographic information, medical history, treatment plans, and all communication history from a single hub." },
                  { icon: Calendar, title: "Appointment & Scheduling", description: "Create, edit, and track appointments with ease. Minimize no-shows with an automatic reminder system. Optimize clinic capacity to increase efficiency." },
                  { icon: Globe2, title: "Transfer & Accommodation Management", description: "Coordinate airport transfers, hotel accommodations, and city transportation for international patients from a single platform. Record companion information and special requirements." },
                  { icon: BarChart3, title: "Financial Tracking & Reporting", description: "Track treatment costs, payments, discounts, and income-expense management in detail. Access comprehensive reports and analytics to measure clinic performance." },
                  { icon: Zap, title: "Facebook Lead Ads Integration", description: "Automatically import potential patients from Facebook advertisements into your CRM system. Easily integrate your Facebook Pages with secure OAuth-based connection. Track ad performance and analyze your lead conversion rates." },
                  { icon: Lock, title: "Security & GDPR/KVKK Compliance", description: "All data is protected with industry-standard encryption methods. Full compliance with GDPR and KVKK (Turkish Data Protection Law) regulations is ensured. With role-based access control, each user can only access the data they are authorized for." },
                ].map((feature, index) => (
                  <div key={index} className="p-5 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Us */}
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Why Miss Endo CRM?</h2>
              <ul className="space-y-2">
                {[
                  "A platform specifically designed for health tourism that deeply understands the sector's needs",
                  "End-to-end patient journey management: lead → patient → appointment → treatment → follow-up",
                  "Maximize advertising ROI with direct Facebook Lead Ads integration",
                  "GDPR and KVKK compliant data management and patient privacy",
                  "Multi-organization support for independent management of different clinics",
                  "Secure and controlled usage with role-based access system",
                  "Modern technology infrastructure that is continuously updated and improved",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Our Technology Infrastructure</h2>
              <p className="text-muted-foreground leading-relaxed">Miss Endo CRM is a reliable and scalable platform built on modern web technologies. Thanks to our cloud-based infrastructure, your data is kept secure while providing seamless access from anywhere. Our platform is continuously improved with security updates and new features.</p>
            </div>

            {/* Contact */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-2">
              <h2 className="text-xl font-semibold">Get in Touch</h2>
              <p className="text-muted-foreground">Contact us to learn more about our platform, request a demo, or ask any questions.</p>
              <div className="space-y-1">
                <a href="mailto:info@missendo.com" className="text-primary font-medium text-lg hover:underline block">info@missendo.com</a>
                <a href="tel:+13106287442" className="text-primary font-medium hover:underline block">+1 (310) 628-7442</a>
                <p className="text-sm text-muted-foreground">9440 Santa Monica Blvd, Suite 301, Beverly Hills, CA 90210</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <LegalFooter />
      </div>
    </div>
  );
};

export default AboutUs;
