import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe, Mail, MessageSquare, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  const content = {
    tr: {
      title: "İletişim",
      lastUpdate: "Son Güncelleme: 27 Mart 2026",
      intro: "Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçmekten çekinmeyin. Size en kısa sürede yanıt vermeyi taahhüt ediyoruz.",
      channels: {
        title: "İletişim Kanalları",
        items: [
          {
            icon: Mail,
            title: "Genel Bilgi ve Destek",
            description: "Platform hakkında genel sorular, demo talepleri, hesap başvuruları ve teknik destek için bize e-posta gönderin.",
            highlight: "info@missendo.com",
            note: "Yanıt süresi: İş günlerinde 24 saat içinde"
          },
          {
            icon: Shield,
            title: "Veri Gizliliği ve KVKK/GDPR",
            description: "Kişisel verilerinizle ilgili talepler, veri silme istekleri, erişim hakları ve KVKK/GDPR ile ilgili konular için aşağıdaki adrese yazabilirsiniz.",
            highlight: "info@missendo.com",
            note: "KVKK/GDPR talepleri 30 gün içinde yanıtlanır"
          }
        ]
      },
      topics: {
        title: "Hangi Konularda Yardımcı Olabiliriz?",
        items: [
          {
            icon: MessageSquare,
            title: "Platform Bilgisi ve Demo",
            description: "Miss Endo CRM platformunun sunduğu özellikler, fiyatlandırma ve klinik ihtiyaçlarınıza uygunluğu hakkında detaylı bilgi almak için bizimle iletişime geçin. Size özel bir demo sunumu organize edebiliriz."
          },
          {
            icon: Shield,
            title: "Hesap ve Organizasyon Başvurusu",
            description: "Miss Endo CRM'e yeni bir organizasyon olarak katılmak istiyorsanız, başvuru süreciniz hakkında bilgi almak için bize e-posta gönderin. Organizasyonlar tarafımızdan oluşturulmakta ve yalnızca sözleşme sürecini tamamlamış şirketlere hesap açılmaktadır."
          },
          {
            icon: Clock,
            title: "Teknik Destek",
            description: "Platform kullanımı sırasında karşılaştığınız teknik sorunlar, Facebook entegrasyonu, veri aktarımı veya hesap erişimi ile ilgili sorunlarınız için destek ekibimiz size yardımcı olmaya hazırdır."
          }
        ]
      },
      dataRequests: {
        title: "Veri Talebi Gönderme",
        content: "KVKK ve GDPR kapsamında kişisel verilerinizle ilgili aşağıdaki talepleri iletebilirsiniz:",
        items: [
          "Kişisel verilerinize erişim talebi",
          "Kişisel verilerinizin düzeltilmesi talebi",
          "Kişisel verilerinizin silinmesi talebi",
          "Veri işleme faaliyetlerine itiraz",
          "Veri taşınabilirliği talebi"
        ],
        note: "Veri silme talepleriniz için detaylı bilgiye Veri Silme Talimatları sayfamızdan ulaşabilirsiniz."
      },
      footer: {
        company: "Miss Endo",
        email: "info@missendo.com"
      }
    },
    en: {
      title: "Contact",
      lastUpdate: "Last Updated: March 27, 2026",
      intro: "Don't hesitate to reach out to us with your questions, suggestions, or support requests. We are committed to responding to you as quickly as possible.",
      channels: {
        title: "Contact Channels",
        items: [
          {
            icon: Mail,
            title: "General Inquiries & Support",
            description: "Send us an email for general questions about the platform, demo requests, account applications, and technical support.",
            highlight: "info@missendo.com",
            note: "Response time: Within 24 hours on business days"
          },
          {
            icon: Shield,
            title: "Data Privacy & KVKK/GDPR",
            description: "For requests related to your personal data, data deletion requests, access rights, and KVKK/GDPR related matters, you can write to the address below.",
            highlight: "info@missendo.com",
            note: "KVKK/GDPR requests are responded to within 30 days"
          }
        ]
      },
      topics: {
        title: "How Can We Help You?",
        items: [
          {
            icon: MessageSquare,
            title: "Platform Information & Demo",
            description: "Contact us to learn more about the features offered by the Miss Endo CRM platform, pricing, and suitability for your clinic's needs. We can organize a personalized demo presentation for you."
          },
          {
            icon: Shield,
            title: "Account & Organization Application",
            description: "If you want to join Miss Endo CRM as a new organization, send us an email to learn about the application process. Organizations are created by us and accounts are only opened for companies that have completed the contract process."
          },
          {
            icon: Clock,
            title: "Technical Support",
            description: "Our support team is ready to assist you with technical issues encountered during platform use, Facebook integration, data transfer, or account access problems."
          }
        ]
      },
      dataRequests: {
        title: "Submitting Data Requests",
        content: "Under KVKK and GDPR, you can submit the following requests regarding your personal data:",
        items: [
          "Request access to your personal data",
          "Request correction of your personal data",
          "Request deletion of your personal data",
          "Object to data processing activities",
          "Request data portability"
        ],
        note: "For detailed information about data deletion requests, please visit our Data Deletion Instructions page."
      },
      footer: {
        company: "Miss Endo",
        email: "info@missendo.com"
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

            {/* Contact Channels */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{currentContent.channels.title}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {currentContent.channels.items.map((channel, index) => (
                  <div key={index} className="p-5 rounded-lg border bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <channel.icon className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-semibold">{channel.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{channel.description}</p>
                    <a 
                      href={`mailto:${channel.highlight}`}
                      className="text-primary font-medium hover:underline inline-block"
                    >
                      {channel.highlight}
                    </a>
                    <p className="text-xs text-muted-foreground">{channel.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{currentContent.topics.title}</h2>
              <div className="space-y-4">
                {currentContent.topics.items.map((topic, index) => (
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
              <h2 className="text-xl font-semibold">{currentContent.dataRequests.title}</h2>
              <p className="text-muted-foreground">{currentContent.dataRequests.content}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {currentContent.dataRequests.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground italic">
                {currentContent.dataRequests.note}{" "}
                <Link to="/legal/data-deletion" className="text-primary hover:underline">
                  →
                </Link>
              </p>
            </div>

            {/* Main CTA */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-2">
              <h2 className="text-xl font-semibold">{currentContent.footer.company}</h2>
              <a 
                href={`mailto:${currentContent.footer.email}`}
                className="text-primary font-medium text-lg hover:underline inline-block"
              >
                {currentContent.footer.email}
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© 2026 Miss Endo. {language === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/about" className="hover:underline">
              {language === "tr" ? "Hakkımızda" : "About Us"}
            </Link>
            <Link to="/legal/privacy-policy" className="hover:underline">
              {language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </Link>
            <Link to="/legal/terms" className="hover:underline">
              {language === "tr" ? "Kullanım Şartları" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
