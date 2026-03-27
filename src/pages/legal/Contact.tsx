import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageSquare, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import LegalFooter from "@/components/LegalFooter";

const Contact = () => {
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
            <CardTitle className="text-3xl">Contact</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last Updated: March 27, 2026</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <p className="text-muted-foreground text-center text-lg leading-relaxed">
              Don't hesitate to reach out to us with your questions, suggestions, or support requests. We are committed to responding to you as quickly as possible.
            </p>

            {/* Contact Channels */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Channels</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-semibold">General Inquiries & Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">Send us an email for general questions about the platform, demo requests, account applications, and technical support.</p>
                  <a href="mailto:info@missendo.com" className="text-primary font-medium hover:underline inline-block">info@missendo.com</a>
                  <p className="text-xs text-muted-foreground">Response time: Within 24 hours on business days</p>
                </div>
                <div className="p-5 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-semibold">Data Privacy & KVKK/GDPR</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">For requests related to your personal data, data deletion requests, access rights, and KVKK/GDPR related matters, you can write to the address below.</p>
                  <a href="mailto:info@missendo.com" className="text-primary font-medium hover:underline inline-block">info@missendo.com</a>
                  <p className="text-xs text-muted-foreground">KVKK/GDPR requests are responded to within 30 days</p>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">How Can We Help You?</h2>
              <div className="space-y-4">
                {[
                  { icon: MessageSquare, title: "Platform Information & Demo", description: "Contact us to learn more about the features offered by the Miss Endo CRM platform, pricing, and suitability for your clinic's needs. We can organize a personalized demo presentation for you." },
                  { icon: Shield, title: "Account & Organization Application", description: "If you want to join Miss Endo CRM as a new organization, send us an email to learn about the application process. Organizations are created by us and accounts are only opened for companies that have completed the contract process." },
                  { icon: Clock, title: "Technical Support", description: "Our support team is ready to assist you with technical issues encountered during platform use, Facebook integration, data transfer, or account access problems." },
                ].map((topic, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg border">
                    <topic.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Requests */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Submitting Data Requests</h2>
              <p className="text-muted-foreground">Under KVKK and GDPR, you can submit the following requests regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to data processing activities</li>
                <li>Request data portability</li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                For detailed information about data deletion requests, please visit our Data Deletion Instructions page.{" "}
                <Link to="/legal/data-deletion" className="text-primary hover:underline">→</Link>
              </p>
            </div>

            {/* Main CTA */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-2">
              <h2 className="text-xl font-semibold">Miss Endo Tourism LLC</h2>
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

export default Contact;
