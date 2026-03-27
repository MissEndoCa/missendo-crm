import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Service Description",
    content: `Miss Endo CRM ("platform") is a comprehensive customer relationship management system developed for clinics operating in the health tourism sector. The platform offers lead management, patient tracking, appointment scheduling, transfer and accommodation coordination, financial management, email campaigns, Facebook Lead Ads integration, and reporting tools.

The platform can only be used by organizations (clinics) that have signed a contract with Miss Endo. Individual user accounts are created by organization administrators.`
  },
  {
    title: "2. Account Creation and Access",
    content: `• Organizations are created exclusively by Miss Endo, and accounts are opened only for companies that have completed the contract process.
• Each organization manages its own users (clinic staff).
• User accounts are managed with a role-based access system: Super Admin, Clinic Admin, and Clinic User.
• Each user can only access data belonging to their own organization.
• You are responsible for the security and confidentiality of your account credentials.`
  },
  {
    title: "3. User Responsibilities",
    content: `By using the platform, you agree to the following responsibilities:

• Ensure that all information you enter into the platform is accurate, current, and complete
• Keep your account credentials (email and password) confidential and not share them with anyone
• Immediately report any unauthorized access to info@missendo.com
• Use the platform only for legitimate clinic operations
• Protect the confidentiality of patient and lead data and act in accordance with KVKK/GDPR legislation
• Respect third-party rights (intellectual property, privacy, etc.)
• Not share data obtained through the platform with unauthorized persons or organizations`
  },
  {
    title: "4. Prohibited Use",
    content: `The platform may not be used for the following purposes:

• Illegal activities or fraud
• Spam, unsolicited emails, or mass messaging (misuse of platform email tools)
• Actions that threaten platform security (hacking, DDoS, data leak attempts, etc.)
• Unauthorized access attempts to other organizations' or users' data
• Reverse engineering, decompiling, or copying of the platform
• Entering false or misleading information
• Licensing, renting, or selling the platform to third parties`
  },
  {
    title: "5. Facebook Integration",
    content: `The platform integrates with Facebook Lead Ads. By using this integration:

• You agree to connect your clinic's Facebook Page through Facebook OAuth authorization
• You confirm that you understand and consent to the purpose of the requested Facebook permissions (pages_show_list, pages_read_engagement, leads_retrieval, pages_manage_metadata, ads_read)
• You accept that data obtained from Facebook will only be used within the scope of clinic CRM operations
• You commit to acting in accordance with Meta Platform Policies and Developer Terms
• You understand that you can disconnect the Facebook connection at any time and that the associated data will be deleted`
  },
  {
    title: "6. Intellectual Property",
    content: `• All intellectual property rights on the Miss Endo CRM platform, its design, source code, logo, and all content belong to Miss Endo.
• Copying, reproducing, distributing, modifying, or creating derivative works of any part of the platform without written permission is prohibited.
• Data entered by users on the platform (patient information, lead data, etc.) belongs to the respective organization.
• Miss Endo reserves the right to use user data for anonymous and aggregate statistical analyses.`
  },
  {
    title: "7. Privacy and Data Protection",
    content: `Detailed information regarding the protection of personal data processed on the platform can be found in our Privacy Policy (/legal/privacy-policy).

As platform users, you are also obligated to protect the confidentiality of data within your access scope and comply with relevant data protection legislation (KVKK, GDPR).`
  },
  {
    title: "8. Service Level and Availability",
    content: `• Miss Endo makes reasonable efforts to ensure continuous and uninterrupted platform operation but does not guarantee 100% availability.
• Planned maintenance will be communicated in advance whenever possible.
• Miss Endo cannot be held responsible for interruptions caused by technical issues, natural disasters, internet infrastructure problems, or third-party services (Facebook, Supabase, etc.).`
  },
  {
    title: "9. Limitation of Liability",
    content: `• Miss Endo is not responsible for direct or indirect damages arising from the use or inability to use the platform.
• The accuracy, completeness, and legality of data entered into the platform is the user's responsibility.
• Miss Endo does not guarantee the performance or availability of third-party services (Facebook, email providers, etc.).
• Miss Endo does not accept any responsibility for medical decisions or treatment planning carried out through the platform. The platform is not a medical device or medical decision support system.`
  },
  {
    title: "10. Account Suspension and Termination",
    content: `Miss Endo may suspend or terminate a user account or organization in the following cases:

• Violation of these terms of service
• Suspicion of illegal activity
• Behavior constituting a security threat
• Expiration or termination of the contract
• Failure to fulfill payment obligations

In case of account termination, organizational data will be retained or deleted in accordance with the periods prescribed by applicable legislation.`
  },
  {
    title: "11. Service Changes",
    content: `Miss Endo reserves the right to modify platform features, add new features, remove existing features, or completely terminate the service at any time. Significant changes will be communicated with reasonable advance notice.`
  },
  {
    title: "12. Modification of Terms",
    content: `These terms of service may be updated from time to time. Changes take effect when published and are communicated through the platform or via email. Your continued use of the platform means you accept the current terms.

Additional consent may be requested for significant changes.`
  },
  {
    title: "13. Applicable Law and Dispute Resolution",
    content: `These terms of service are subject to the laws of the Republic of Turkey. All disputes arising from or related to these terms shall be resolved under the exclusive jurisdiction of the Istanbul (Anatolian) Courts and Execution Offices.`
  },
  {
    title: "14. Contact",
    content: `For questions about terms of service:

Email: info@missendo.com`
  }
];

const Terms = () => {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last Updated: March 27, 2026</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© 2026 Miss Endo. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link to="/legal/data-deletion" className="hover:underline">Data Deletion</Link>
            <Link to="/legal/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
