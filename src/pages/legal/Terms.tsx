import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  const content = {
    tr: {
      title: "Kullanım Şartları",
      lastUpdate: "Son Güncelleme: 27 Mart 2026",
      sections: [
        {
          title: "1. Hizmet Tanımı",
          content: `Miss Endo CRM ("platform"), sağlık turizmi alanında faaliyet gösteren klinikler için geliştirilmiş kapsamlı bir müşteri ilişkileri yönetim sistemidir. Platform; lead yönetimi, hasta takibi, randevu planlaması, transfer ve konaklama koordinasyonu, finansal yönetim, e-posta kampanyaları, Facebook Lead Ads entegrasyonu ve raporlama araçları sunmaktadır.

Platform, yalnızca Miss Endo ile sözleşme imzalamış organizasyonlar (klinikler) tarafından kullanılabilir. Bireysel kullanıcı hesapları, organizasyon yöneticileri tarafından oluşturulur.`
        },
        {
          title: "2. Hesap Oluşturma ve Erişim",
          content: `• Organizasyonlar yalnızca Miss Endo tarafından oluşturulur ve sözleşme sürecini tamamlamış şirketlere hesap açılır.
• Her organizasyon kendi kullanıcılarını (klinik personelini) yönetir.
• Kullanıcı hesapları rol tabanlı erişim sistemiyle yönetilir: Super Admin, Klinik Admin ve Klinik Kullanıcısı.
• Her kullanıcı yalnızca kendi organizasyonunun verilerine erişebilir.
• Hesap bilgilerinizin güvenliğinden ve gizliliğinden siz sorumlusunuz.`
        },
        {
          title: "3. Kullanıcı Sorumlulukları",
          content: `Platformu kullanarak aşağıdaki sorumlulukları kabul etmiş olursunuz:

• Platforma girdiğiniz tüm bilgilerin doğru, güncel ve eksiksiz olmasını sağlamak
• Hesap kimlik bilgilerinizi (e-posta ve şifre) gizli tutmak ve kimseyle paylaşmamak
• Yetkisiz erişim fark ettiğinizde derhal info@missendo.com adresine bildirmek
• Platformu yalnızca meşru klinik operasyonları için kullanmak
• Hasta ve lead verilerinin gizliliğini korumak ve KVKK/GDPR mevzuatına uygun hareket etmek
• Üçüncü taraf haklarına (fikri mülkiyet, gizlilik vb.) saygı göstermek
• Platform üzerinden elde ettiğiniz verileri yetkisiz kişi veya kuruluşlarla paylaşmamak`
        },
        {
          title: "4. Yasaklanan Kullanım",
          content: `Platform aşağıdaki amaçlarla kullanılamaz:

• Yasa dışı faaliyetler veya dolandırıcılık
• Spam, istenmeyen e-posta veya toplu mesaj gönderimi (platform e-posta araçlarının kötüye kullanımı)
• Platform güvenliğini tehdit eden eylemler (hacking, DDoS, veri sızıntısı girişimleri vb.)
• Başka organizasyonların veya kullanıcıların verilerine yetkisiz erişim girişimi
• Platformun tersine mühendislik, decompile veya kopyalama girişimleri
• Sahte veya yanıltıcı bilgiler girme
• Platformun üçüncü taraflara lisanslanması, kiralanması veya satılması`
        },
        {
          title: "5. Facebook Entegrasyonu",
          content: `Platform, Facebook Lead Ads ile entegre çalışmaktadır. Bu entegrasyonu kullanarak:

• Facebook OAuth yetkilendirmesi yoluyla klinik Facebook Sayfanızı bağlamayı kabul edersiniz
• Talep edilen Facebook izinlerinin (pages_show_list, pages_read_engagement, leads_retrieval, pages_manage_metadata, ads_read) amacını anlayarak onay verdiğinizi teyit edersiniz
• Facebook üzerinden elde edilen verilerin yalnızca klinik CRM operasyonları kapsamında kullanılacağını kabul edersiniz
• Meta Platform Politikaları ve Geliştirici Şartlarına uygun hareket edeceğinizi taahhüt edersiniz
• İstediğiniz zaman Facebook bağlantısını kesebileceğinizi ve bu durumda ilgili verilerin silineceğini bilirsiniz`
        },
        {
          title: "6. Fikri Mülkiyet",
          content: `• Miss Endo CRM platformu, tasarımı, kaynak kodu, logosu ve tüm içerikleri üzerindeki fikri mülkiyet hakları Miss Endo'ya aittir.
• Yazılı izin olmadan platformun herhangi bir bölümünü kopyalama, çoğaltma, dağıtma, değiştirme veya türev eserler oluşturma yasaktır.
• Platformda kullanıcılar tarafından girilen veriler (hasta bilgileri, lead verileri vb.) ilgili organizasyona aittir.
• Miss Endo, kullanıcı verilerini anonim ve toplu istatistiksel analizler için kullanma hakkını saklı tutar.`
        },
        {
          title: "7. Gizlilik ve Veri Koruma",
          content: `Platformda işlenen kişisel verilerin korunmasına ilişkin detaylı bilgi, Gizlilik Politikamızda (/legal/privacy-policy) yer almaktadır.

Platform kullanıcıları olarak siz de kendi erişiminiz kapsamındaki verilerin gizliliğini korumak ve ilgili veri koruma mevzuatına (KVKK, GDPR) uymakla yükümlüsünüz.`
        },
        {
          title: "8. Hizmet Düzeyi ve Kullanılabilirlik",
          content: `• Miss Endo, platformun sürekli ve kesintisiz çalışmasını sağlamak için makul çabayı gösterir ancak %100 kullanılabilirlik garantisi vermez.
• Planlı bakım çalışmaları mümkün olduğunca önceden bildirilecektir.
• Teknik sorunlar, doğal afetler, internet altyapısı sorunları veya üçüncü taraf hizmetlerinden (Facebook, Supabase vb.) kaynaklanan kesintilerden dolayı Miss Endo sorumlu tutulamaz.`
        },
        {
          title: "9. Sorumluluk Sınırlamaları",
          content: `• Miss Endo, platformun kullanımından veya kullanılamamasından kaynaklanan doğrudan veya dolaylı zararlardan sorumlu değildir.
• Platforma girilen verilerin doğruluğu, eksiksizliği ve yasallığı kullanıcının sorumluluğundadır.
• Miss Endo, üçüncü taraf hizmetlerinin (Facebook, e-posta sağlayıcıları vb.) performansı veya kesintileri için garanti vermez.
• Kullanıcıların platform üzerinden gerçekleştirdiği tıbbi kararlar veya tedavi planlamaları konusunda Miss Endo herhangi bir sorumluluk kabul etmez. Platform bir tıbbi cihaz veya tıbbi karar destek sistemi değildir.`
        },
        {
          title: "10. Hesap Askıya Alma ve Sonlandırma",
          content: `Miss Endo, aşağıdaki durumlarda kullanıcı hesabını veya organizasyonu askıya alabilir veya sonlandırabilir:

• Bu kullanım şartlarının ihlali
• Yasadışı faaliyet şüphesi
• Güvenlik tehdidi oluşturan davranışlar
• Sözleşme süresinin sona ermesi veya sözleşmenin feshi
• Ödeme yükümlülüklerinin yerine getirilmemesi

Hesap sonlandırılması durumunda, organizasyona ait veriler ilgili mevzuatın öngördüğü sürelere uygun olarak saklanır veya silinir.`
        },
        {
          title: "11. Hizmet Değişiklikleri",
          content: `Miss Endo, herhangi bir zamanda platformun özelliklerini değiştirme, yeni özellikler ekleme, mevcut özellikleri kaldırma veya hizmeti tamamen sonlandırma hakkını saklı tutar. Önemli değişiklikler makul bir süre öncesinden bildirilecektir.`
        },
        {
          title: "12. Şartların Değiştirilmesi",
          content: `Bu kullanım şartları zaman zaman güncellenebilir. Değişiklikler yayınlandığında yürürlüğe girer ve platform üzerinden veya e-posta yoluyla bildirilir. Platformu kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.

Önemli değişiklikler için ek onay istenebilir.`
        },
        {
          title: "13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü",
          content: `Bu kullanım şartları Türkiye Cumhuriyeti yasalarına tabidir. Bu şartlardan doğan veya bunlarla ilgili tüm uyuşmazlıklar, İstanbul (Anadolu) Mahkemeleri ve İcra Dairelerinin münhasır yetkisine tabi olarak çözümlenecektir.`
        },
        {
          title: "14. İletişim",
          content: `Kullanım şartları hakkında sorularınız için:

E-posta: info@missendo.com`
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdate: "Last Updated: March 27, 2026",
      sections: [
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
      ]
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
          <CardContent className="pt-6 space-y-6">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© 2026 Miss Endo. {language === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/legal/privacy-policy" className="hover:underline">
              {language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </Link>
            <Link to="/legal/data-deletion" className="hover:underline">
              {language === "tr" ? "Veri Silme" : "Data Deletion"}
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

export default Terms;
