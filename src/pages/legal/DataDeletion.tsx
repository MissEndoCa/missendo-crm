import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import LegalFooter from "@/components/LegalFooter";

const DataDeletion = () => {
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
            <CardTitle className="text-3xl">Data Deletion Instructions</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last Updated: March 27, 2026</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <p className="text-muted-foreground text-center text-lg leading-relaxed">
              Under KVKK (Turkish Personal Data Protection Law No. 6698) and GDPR (General Data Protection Regulation), you have the right to request the deletion of your personal data. You can submit a data deletion request by following the steps below.
            </p>

            {/* Steps */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Data Deletion Request Process</h2>
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                  <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium">1. Send an Email</h3>
                    <p className="text-muted-foreground text-sm mt-1">Send your data deletion request to the email address below. Please include 'Data Deletion Request' in the subject line.</p>
                    <a href="mailto:info@missendo.com" className="inline-block mt-2 text-primary font-medium hover:underline">info@missendo.com</a>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium">2. Include Required Information</h3>
                    <p className="text-muted-foreground whitespace-pre-line text-sm mt-1">{"To verify your identity and delete the correct data, please include the following information in your email:\n• First and Last Name\n• Registered phone number or email address\n• Scope of data you want deleted (all data or specific categories)\n• If applicable, mention any information shared via Facebook Lead Ads"}</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                  <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium">3. Verification and Processing</h3>
                    <p className="text-muted-foreground text-sm mt-1">After your identity is verified, your request will be processed. Processing time may vary depending on the scope of the request but will be completed within the legally mandated 30 days, and you will be informed of the result.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data to be deleted */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Data to be Deleted</h2>
              <p className="text-muted-foreground">Once your request is approved, the following data will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Your contact information (first name, last name, phone, email)</li>
                <li>Form data collected via Facebook Lead Ads</li>
                <li>Appointment history and treatment records</li>
                <li>Notes and documents recorded in the system</li>
                <li>Transfer and accommodation information</li>
                <li>Companion information</li>
                <li>Patient photos and uploaded documents</li>
              </ul>
            </div>

            {/* Retained data */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Data That May Be Retained Due to Legal Obligations</h2>
              <p className="text-muted-foreground">The following data must be retained for the periods prescribed by applicable legislation and may not be covered by deletion requests:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Invoice and payment records — 10 years under tax legislation (Tax Procedure Law No. 213)</li>
                <li>Health records — For the period prescribed by relevant health legislation</li>
                <li>Audit logs — 2 years for security and legal requirements</li>
              </ul>
              <p className="text-sm text-muted-foreground italic flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                Data that has exceeded its retention period is automatically permanently deleted or anonymized using secure methods.
              </p>
            </div>

            {/* Facebook Note */}
            <div className="space-y-2 p-5 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="text-xl font-semibold">Special Note for Facebook Data</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {`You can request the deletion of your data collected through Facebook Lead Ads. In this case:

• Your Facebook-sourced lead data in our CRM system will be permanently deleted
• For your data in Facebook's own systems, you need to apply to Facebook separately
• When a clinic disconnects their Facebook connection, the associated Facebook access tokens are immediately deleted

For detailed information about Facebook's data policy: facebook.com/privacy`}
              </p>
            </div>

            {/* Other Rights */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Your Other Data Rights</h2>
              <p className="text-muted-foreground">In addition to data deletion requests, you can also exercise the following rights:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Request access to your data</li>
                <li>Request correction of your data</li>
                <li>Object to data processing activities</li>
                <li>Request data portability</li>
                <li>File a complaint with the relevant data protection authority</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <a href="mailto:info@missendo.com" className="text-primary font-medium text-lg hover:underline">info@missendo.com</a>
              <p className="text-sm text-muted-foreground mt-2">Response time: Within the legally mandated 30 days</p>
            </div>
          </CardContent>
        </Card>

        <LegalFooter />
      </div>
    </div>
  );
};

export default DataDeletion;
