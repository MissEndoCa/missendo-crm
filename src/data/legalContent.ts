export interface LegalSection {
  title: string;
  content: string;
}

export const privacySections: LegalSection[] = [
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

export const termsSections: LegalSection[] = [
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
    title: "5. Third-Party Integrations",
    content: `The following subsections (5a and 5b) describe optional third-party integrations available on the platform. The terms outlined in each subsection apply only to organizations that actively enable and use the respective integration. If your organization does not use a particular integration, the corresponding terms do not apply to you.`
  },
  {
    title: "5a. Facebook Integration",
    content: `The platform integrates with Facebook Lead Ads. By using this integration:

• You agree to connect your clinic's Facebook Page through Facebook OAuth authorization
• You confirm that you understand and consent to the purpose of the requested Facebook permissions (pages_show_list, pages_read_engagement, leads_retrieval, pages_manage_metadata, ads_read)
• You accept that data obtained from Facebook will only be used within the scope of clinic CRM operations
• You commit to acting in accordance with Meta Platform Policies and Developer Terms
• You understand that you can disconnect the Facebook connection at any time and that the associated data will be deleted`
  },
  {
    title: "5b. WhatsApp Business API Integration",
    content: `The platform integrates with the WhatsApp Business API to enable direct patient communication. By using this integration:

• You agree to provide your WhatsApp Business API credentials (Phone Number ID and Access Token) to the platform
• You confirm that you have the necessary rights and permissions to use the WhatsApp Business API for your clinic
• You accept responsibility for obtaining appropriate patient consent before initiating WhatsApp communication
• You commit to using WhatsApp messaging solely for legitimate clinic-patient interactions (appointment reminders, treatment follow-ups, patient inquiries)
• You agree to comply with Meta's WhatsApp Business Policy and Commerce Policy at all times
• You accept that data sent through WhatsApp will be processed according to Meta's data handling practices
• You understand that you can remove your WhatsApp configuration at any time, and the associated credentials will be immediately deleted from the system
• You commit to not using the WhatsApp integration for spam, unsolicited marketing, or any communication that violates applicable data protection regulations (KVKK/GDPR)`
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
