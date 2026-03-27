import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Introduction",
    content: `At Miss Endo CRM ("we", "our", or "platform"), we take the protection of your personal data very seriously. This Privacy Policy explains in detail the information we collect, use, store, and protect when you use our CRM services designed for clinics operating in the health tourism sector.

This policy has been prepared in accordance with all applicable data protection regulations, primarily the European Union General Data Protection Regulation (GDPR) and the Turkish Personal Data Protection Law (KVKK - Law No. 6698).`
  },
  {
    title: "2. Data Controller",
    content: `Miss Endo acts as the data controller for personal data processed on this platform.

Contact: info@missendo.com`
  },
  {
    title: "3. Data We Collect",
    content: `We collect the following categories of personal data as part of our services:

a) User (Clinic Staff) Data:
• First and Last Name
• Email address
• Phone number
• Profile photo (optional)
• Organization/clinic information
• User role and access permissions

b) Lead (Potential Patient) Data:
• First and Last Name
• Phone number
• Email address
• Country information
• Treatment interest information
• Lead source (Facebook Lead Ads, manual entry, etc.)
• Communication history and notes

c) Patient Data:
• First and Last Name
• Phone number and email address
• Date of birth and gender
• Country and address information
• Medical condition and allergy information
• Treatment plans and history
• Appointment and financial records
• Companion information
• Patient photos and documents

d) Data Collected via Facebook Lead Ads:
• Facebook username or full name
• Phone number
• Email address
• Custom fields filled in the Facebook lead form (treatment preferences, country information, etc.)`
  },
  {
    title: "4. Third-Party Integrations",
    content: `The following sections (4a and 4b) describe optional third-party integrations available on the platform. The terms outlined in each subsection apply only to organizations that actively enable and use the respective integration. If your organization does not use a particular integration, the corresponding terms do not apply to you.`
  },
  {
    title: "4a. Facebook Integration and Permissions",
    content: `Our platform integrates with the Meta (Facebook) platform to enable clinics to automatically import potential patients from their Facebook Lead Ads campaigns into the CRM.

As part of this integration, the following Facebook permissions are requested from clinic administrators:

a) pages_show_list (List Pages):
• Purpose: To display the list of Facebook Pages managed by the user
• Usage: To allow clinic administrators to select which Facebook Page they want to connect to the CRM
• Data access: Page names and IDs only

b) pages_read_engagement (Read Page Engagement):
• Purpose: To obtain a valid Page Access Token for the connected Facebook Page
• Usage: The Page Access Token is required for secure access to lead data and creating webhook subscriptions
• Data access: Page Access Token and page metadata

c) leads_retrieval (Lead Data Retrieval):
• Purpose: To retrieve lead data submitted through Facebook Lead Ads forms
• Usage: To automatically import potential patient information into the CRM system
• Data access: Fields filled by users in lead forms (name, phone, email, custom questions)

d) pages_manage_metadata (Manage Page Metadata):
• Purpose: To create a webhook subscription on the Facebook Page
• Usage: To configure the page webhook for receiving real-time notifications when new leads arrive
• Data access: Page webhook configuration

e) ads_read (Read Advertising Data):
• Purpose: To access Facebook ad account and campaign information
• Usage: To list Pages managed through Business Manager and display ad performance metrics
• Data access: Ad account IDs, campaign names, ad set information, and performance metrics (impressions, clicks, cost, etc.)

Important Notes:
• Facebook permissions are only obtained with the explicit consent of the clinic administrator (OAuth 2.0 authorization flow).
• Access tokens obtained are stored securely in encrypted form.
• Facebook data is used solely within the scope of the CRM platform for clinic operations.
• Users can disconnect their Facebook connection at any time, in which case the associated access tokens are deleted from the system.
• No data obtained from Facebook is shared with third parties or used for advertising purposes.`
  },
  {
    title: "4b. WhatsApp Business API Integration",
    content: `Our platform integrates with the WhatsApp Business API (provided by Meta) to enable clinics to communicate with patients and leads directly through WhatsApp.

As part of this integration, the following data is processed:

a) WhatsApp Business Account Configuration:
• Phone Number ID: The unique identifier of the clinic's WhatsApp Business phone number
• Access Token: A secure token used to authenticate API requests to the WhatsApp Business API
• These credentials are provided by the clinic administrator and stored securely in encrypted form

b) Data Processed Through WhatsApp:
• Patient and lead phone numbers (used as recipient identifiers)
• Message content sent by clinic staff through the platform
• Message delivery status and read receipts

Important Notes:
• WhatsApp Business API credentials are only configured with the explicit action of the clinic administrator.
• Access tokens are stored securely in encrypted form and transmitted through secure channels.
• WhatsApp communication is used solely for legitimate clinic-patient interactions such as appointment reminders, treatment follow-ups, and patient inquiries.
• No patient data is shared with Meta/WhatsApp beyond what is required for message delivery.
• The clinic is responsible for obtaining appropriate patient consent before initiating WhatsApp communication, in accordance with GDPR/KVKK requirements.
• Organizations can remove their WhatsApp configuration at any time, and the associated credentials will be immediately deleted from the system.
• All WhatsApp communications must comply with Meta's WhatsApp Business Policy and Commerce Policy.`
  },
  {
    title: "5. Data Collection Methods",
    content: `Personal data is collected through the following methods:

• Direct Entry: Data manually entered into the platform by clinic staff
• Facebook Lead Ads: Lead data automatically transferred through Facebook ad forms (with the user's consent on Facebook)
• WhatsApp Business API: Message interactions between clinic staff and patients/leads through WhatsApp
• Account Creation: Information obtained during the registration of clinic staff
• Platform Usage: User interactions on the platform (creating appointments, adding notes, etc.)`
  },
  {
    title: "6. Purpose of Data Use",
    content: `The personal data we collect is processed for the following legitimate purposes:

• Lead Management: Tracking potential patients, establishing communication, and managing the patient conversion process
• Patient Relationship Management: Recording patient information, planning and tracking treatment processes
• Appointment Management: Creating, editing appointments, and sending automated reminders
• Transfer & Accommodation: Coordinating airport transfers and hotel accommodations for international patients
• Financial Management: Treatment cost, payment, and income-expense tracking
• Communication: Email campaigns, reminders, and notifications (managed by the clinic)
• Reporting & Analytics: Measuring clinic performance and improving service quality
• Legal Obligations: Mandatory record-keeping and reporting under applicable legislation`
  },
  {
    title: "7. Legal Basis for Data Processing",
    content: `Your personal data is processed within the following legal frameworks:

• Explicit Consent: Consent of users filling out Facebook Lead Ads forms
• Performance of Contract: Data processing under the service agreement with clinics
• Legitimate Interest: Improving service quality and ensuring security
• Legal Obligation: Mandatory record-keeping under health legislation and tax legislation

Personal data is processed within the legal bases specified in KVKK Article 5 and GDPR Article 6.`
  },
  {
    title: "8. Data Sharing and Transfer",
    content: `Your personal data will not be shared with third parties for marketing or advertising purposes without your explicit consent. However, data transfer may occur in the following cases:

• Service Providers: Data is shared with technical infrastructure providers (Supabase - database and authentication services) with data security ensured
• Partner Clinics: Information is shared with the relevant clinic only for treatment purposes and with the patient's knowledge
• Meta (Facebook): API communication is carried out only within the scope of OAuth authorization to receive Facebook Lead Ads data. No patient data is sent to Facebook
• Meta (WhatsApp): Message delivery is facilitated through the WhatsApp Business API. Only the minimum data required for message delivery (phone number and message content) is transmitted
• Legal Requirements: Sharing with authorized institutions and organizations may occur pursuant to court orders, prosecution requests, or applicable legislation

International Data Transfer:
As our platform uses cloud-based infrastructure, data may be hosted on servers outside the EU/EEA. In such cases, appropriate safeguards (Standard Contractual Clauses) under GDPR Article 46 are applied.`
  },
  {
    title: "9. Data Security",
    content: `We implement the following security measures to protect your data:

• Encryption: All data is encrypted both in transit (TLS/SSL) and at rest (AES-256)
• Authentication: Strong password policies and secure session management
• Access Control: Role-based access system (Super Admin, Clinic Admin, Clinic User) ensures each user can only access data they are authorized for
• Organization Isolation: Each clinic/organization can only access their own data, cross-access is blocked
• Audit Logging: Critical data operations (create, update, delete) are recorded in audit logs
• Secure Token Management: Facebook and WhatsApp access tokens are stored encrypted and transmitted through secure channels
• Regular Security Updates: Platform infrastructure is continuously updated and security vulnerabilities are proactively addressed`
  },
  {
    title: "10. Data Retention Periods",
    content: `Your personal data is retained for the duration required by the processing purpose:

• Lead Data: As long as the lead status is active or until a data deletion request
• Patient Data: For the period prescribed by relevant health legislation from the completion of the treatment process
• Financial Records: 10 years under tax legislation
• Audit Logs: 2 years
• Facebook Access Tokens: Immediately deleted when the connection is disconnected
• WhatsApp API Credentials: Immediately deleted when the configuration is removed

Data that has exceeded its retention period is permanently deleted or anonymized using secure methods.`
  },
  {
    title: "11. User Rights (KVKK/GDPR)",
    content: `You have the following rights under applicable data protection legislation:

• Right to Information: To learn whether your personal data is being processed
• Right of Access: To request access to your processed personal data
• Right to Rectification: To request correction of incomplete or inaccurate personal data
• Right to Erasure (Right to be Forgotten): To request deletion of your personal data
• Right to Restriction: To request restriction of data processing under certain conditions
• Right to Object: To object to the processing of your personal data
• Data Portability: To receive your data in a structured, commonly used, and machine-readable format
• Right to Object to Automated Decision-Making: To object to decisions based solely on automated processing, including automated profiling
• Right to Complain: To file a complaint with the relevant data protection authority (Turkey: KVKK Board, EU: local data protection authority)

To exercise these rights, you can send an email to info@missendo.com. Your request will be evaluated and responded to within 30 days.`
  },
  {
    title: "12. Cookies and Tracking Technologies",
    content: `Our platform uses essential session cookies to provide core functionality. These cookies:

• Are required for authentication and session management
• Store user preferences (language, theme, etc.)
• Are not used for third-party tracking or advertising purposes

The platform does not use third-party tracking tools that monitor user behavior or create profiles.`
  },
  {
    title: "13. Policy Changes",
    content: `This privacy policy may be updated from time to time. When significant changes are made, notifications will be provided through the platform or via email. The current policy will always be published on this page.

Your continued use of the platform means you accept the current privacy policy.`
  },
  {
    title: "14. Contact",
    content: `For questions about our privacy policy, your personal data, or your rights:

Email: info@missendo.com

For detailed instructions on data deletion requests, please visit the /legal/data-deletion page.`
  }
];

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
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
            <Link to="/legal/terms" className="hover:underline">Terms of Service</Link>
            <Link to="/legal/data-deletion" className="hover:underline">Data Deletion</Link>
            <Link to="/legal/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
