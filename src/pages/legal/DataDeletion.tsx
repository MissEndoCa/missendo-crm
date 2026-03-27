import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe, Mail, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const DataDeletion = () => {
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  const content = {
    tr: {
      title: "Veri Silme Talimatları",
      lastUpdate: "Son Güncelleme: 27 Mart 2026",
      intro: "KVKK (6698 Sayılı Kişisel Verilerin Korunması Kanunu) ve GDPR (Genel Veri Koruma Tüzüğü) kapsamında, kişisel verilerinizin silinmesini talep etme hakkına sahipsiniz. Aşağıdaki adımları izleyerek veri silme talebinde bulunabilirsiniz.",
      steps: {
        title: "Veri Silme Talep Süreci",
        items: [
          {
            icon: Mail,
            title: "1. E-posta Gönderin",
            description: "Veri silme talebinizi aşağıdaki e-posta adresine gönderin. E-posta konu satırına 'Veri Silme Talebi' yazmanızı rica ederiz.",
            highlight: "info@missendo.com"
          },
          {
            icon: CheckCircle,
            title: "2. Gerekli Bilgileri Ekleyin",
            description: "Kimliğinizi doğrulamamız ve doğru verileri silmemiz için e-postanızda aşağıdaki bilgileri belirtin:\n• Ad ve Soyad\n• Kayıtlı telefon numarası veya e-posta adresi\n• Silmek istediğiniz verilerin kapsamı (tüm veriler veya belirli kategoriler)\n• Facebook Lead Ads üzerinden paylaştığınız bilgiler varsa bunu belirtin"
          },
          {
            icon: Clock,
            title: "3. Doğrulama ve İşleme",
            description: "Kimliğiniz doğrulandıktan sonra talebiniz işleme alınacaktır. İşlem süresi, talebin kapsamına bağlı olarak değişebilir ancak yasal süre olan 30 gün içinde tamamlanacak ve sonuç hakkında bilgilendirileceksiniz."
          }
        ]
      },
      dataDeleted: {
        title: "Silinecek Veriler",
        description: "Talebiniz onaylandığında aşağıdaki veriler kalıcı olarak silinecektir:",
        items: [
          "İletişim bilgileriniz (ad, soyad, telefon, e-posta)",
          "Facebook Lead Ads üzerinden toplanan form verileri",
          "Randevu geçmişi ve tedavi kayıtları",
          "Sistemde kayıtlı notlar ve belgeler",
          "Transfer ve konaklama bilgileri",
          "Refakatçi bilgileri",
          "Hasta fotoğrafları ve yüklenen belgeler"
        ]
      },
      dataRetained: {
        title: "Yasal Zorunluluk Nedeniyle Saklanabilecek Veriler",
        description: "Aşağıdaki veriler, ilgili mevzuatın öngördüğü süreler boyunca saklanmak zorundadır ve silme talebi bu verileri kapsamayabilir:",
        items: [
          "Fatura ve ödeme kayıtları — Vergi mevzuatı kapsamında 10 yıl (213 Sayılı Vergi Usul Kanunu)",
          "Sağlık kayıtları — İlgili sağlık mevzuatının öngördüğü süre boyunca",
          "Denetim günlükleri — Güvenlik ve hukuki gereklilikler için 2 yıl"
        ],
        note: "Saklama süresi dolan veriler otomatik olarak güvenli yöntemlerle kalıcı olarak silinir veya anonim hale getirilir."
      },
      facebook: {
        title: "Facebook Verileri İçin Özel Not",
        content: `Facebook Lead Ads aracılığıyla toplanan verilerinizin silinmesini talep edebilirsiniz. Bu durumda:

• CRM sistemimizdeki Facebook kaynaklı lead verileriniz kalıcı olarak silinecektir
• Facebook'un kendi sistemindeki verileriniz için ayrıca Facebook'a başvurmanız gerekmektedir
• Klinik Facebook bağlantısını kestiğinde, ilgili Facebook erişim belirteçleri derhal silinir

Facebook veri politikası hakkında detaylı bilgi için: facebook.com/privacy`
      },
      rights: {
        title: "Diğer Veri Haklarınız",
        content: "Veri silme talebinin yanı sıra aşağıdaki haklarınızı da kullanabilirsiniz:",
        items: [
          "Verilerinize erişim talep etme",
          "Verilerinizin düzeltilmesini isteme",
          "Veri işleme faaliyetlerine itiraz etme",
          "Veri taşınabilirliği talep etme",
          "İlgili veri koruma otoritesine şikayette bulunma"
        ]
      },
      contact: {
        title: "İletişim",
        email: "info@missendo.com",
        response: "Yanıt süresi: Yasal süre olan 30 gün içinde"
      }
    },
    en: {
      title: "Data Deletion Instructions",
      lastUpdate: "Last Updated: March 27, 2026",
      intro: "Under KVKK (Turkish Personal Data Protection Law No. 6698) and GDPR (General Data Protection Regulation), you have the right to request the deletion of your personal data. You can submit a data deletion request by following the steps below.",
      steps: {
        title: "Data Deletion Request Process",
        items: [
          {
            icon: Mail,
            title: "1. Send an Email",
            description: "Send your data deletion request to the email address below. Please include 'Data Deletion Request' in the subject line.",
            highlight: "info@missendo.com"
          },
          {
            icon: CheckCircle,
            title: "2. Include Required Information",
            description: "To verify your identity and delete the correct data, please include the following information in your email:\n• First and Last Name\n• Registered phone number or email address\n• Scope of data you want deleted (all data or specific categories)\n• If applicable, mention any information shared via Facebook Lead Ads"
          },
          {
            icon: Clock,
            title: "3. Verification and Processing",
            description: "After your identity is verified, your request will be processed. Processing time may vary depending on the scope of the request but will be completed within the legally mandated 30 days, and you will be informed of the result."
          }
        ]
      },
      dataDeleted: {
        title: "Data to be Deleted",
        description: "Once your request is approved, the following data will be permanently deleted:",
        items: [
          "Your contact information (first name, last name, phone, email)",
          "Form data collected via Facebook Lead Ads",
          "Appointment history and treatment records",
          "Notes and documents recorded in the system",
          "Transfer and accommodation information",
          "Companion information",
          "Patient photos and uploaded documents"
        ]
      },
      dataRetained: {
        title: "Data That May Be Retained Due to Legal Obligations",
        description: "The following data must be retained for the periods prescribed by applicable legislation and may not be covered by deletion requests:",
        items: [
          "Invoice and payment records — 10 years under tax legislation (Tax Procedure Law No. 213)",
          "Health records — For the period prescribed by relevant health legislation",
          "Audit logs — 2 years for security and legal requirements"
        ],
        note: "Data that has exceeded its retention period is automatically permanently deleted or anonymized using secure methods."
      },
      facebook: {
        title: "Special Note for Facebook Data",
        content: `You can request the deletion of your data collected through Facebook Lead Ads. In this case:

• Your Facebook-sourced lead data in our CRM system will be permanently deleted
• For your data in Facebook's own systems, you need to apply to Facebook separately
• When a clinic disconnects their Facebook connection, the associated Facebook access tokens are immediately deleted

For detailed information about Facebook's data policy: facebook.com/privacy`
      },
      rights: {
        title: "Your Other Data Rights",
        content: "In addition to data deletion requests, you can also exercise the following rights:",
        items: [
          "Request access to your data",
          "Request correction of your data",
          "Object to data processing activities",
          "Request data portability",
          "File a complaint with the relevant data protection authority"
        ]
      },
      contact: {
        title: "Contact",
        email: "info@missendo.com",
        response: "Response time: Within the legally mandated 30 days"
      }
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>{language === "tr" ? "Giriş Sayfası" : "Sign In"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className={language === "tr" ? "font-medium" : "text-muted-foreground"}>TR</span>
            <Switch
              checked={language === "en"}
              onCheckedChange={(checked) => setLanguage(checked ? "en" : "tr")}
            />
            <span className={language === "en" ? "font-medium" : "text-muted-foreground"}>EN</span>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b">
            <img 
              src="/miss-endo-logo.webp" 
              alt="Miss Endo" 
              className="h-16 mx-auto mb-4"
            />
            <CardTitle className="text-3xl">{currentContent.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{currentContent.lastUpdate}</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <p className="text-muted-foreground text-center text-lg leading-relaxed">
              {currentContent.intro}
            </p>

            {/* Steps */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{currentContent.steps.title}</h2>
              <div className="grid gap-4">
                {currentContent.steps.items.map((step, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                    <step.icon className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-muted-foreground whitespace-pre-line text-sm mt-1">
                        {step.description}
                      </p>
                      {step.highlight && (
                        <a 
                          href={`mailto:${step.highlight}`}
                          className="inline-block mt-2 text-primary font-medium hover:underline"
                        >
                          {step.highlight}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data to be deleted */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{currentContent.dataDeleted.title}</h2>
              <p className="text-muted-foreground">{currentContent.dataDeleted.description}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {currentContent.dataDeleted.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Retained data */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{currentContent.dataRetained.title}</h2>
              <p className="text-muted-foreground">{currentContent.dataRetained.description}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {currentContent.dataRetained.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground italic flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {currentContent.dataRetained.note}
              </p>
            </div>

            {/* Facebook Note */}
            <div className="space-y-2 p-5 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="text-xl font-semibold">{currentContent.facebook.title}</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {currentContent.facebook.content}
              </p>
            </div>

            {/* Other Rights */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{currentContent.rights.title}</h2>
              <p className="text-muted-foreground">{currentContent.rights.content}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {currentContent.rights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <h2 className="text-xl font-semibold mb-2">{currentContent.contact.title}</h2>
              <a 
                href={`mailto:${currentContent.contact.email}`}
                className="text-primary font-medium text-lg hover:underline"
              >
                {currentContent.contact.email}
              </a>
              <p className="text-sm text-muted-foreground mt-2">{currentContent.contact.response}</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© 2026 Miss Endo. {language === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/privacy-policy" className="hover:underline">
              {language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </Link>
            <Link to="/legal/terms" className="hover:underline">
              {language === "tr" ? "Kullanım Şartları" : "Terms of Service"}
            </Link>
            <Link to="/legal/contact" className="hover:underline">
              {language === "tr" ? "İletişim" : "Contact"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
