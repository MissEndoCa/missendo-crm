import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  const content = {
    tr: {
      title: "Gizlilik Politikası",
      lastUpdate: "Son Güncelleme: 27 Mart 2026",
      sections: [
        {
          title: "1. Giriş",
          content: `Miss Endo CRM ("biz", "bizim" veya "platform") olarak, kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu Gizlilik Politikası, sağlık turizmi sektöründe faaliyet gösteren kliniklere yönelik CRM hizmetlerimizi kullanırken topladığımız, kullandığımız, sakladığımız ve koruduğumuz bilgileri detaylı olarak açıklamaktadır.

Bu politika, Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve Türkiye Kişisel Verilerin Korunması Kanunu (KVKK - 6698 Sayılı Kanun) başta olmak üzere, yürürlükteki tüm veri koruma mevzuatlarına uygun olarak hazırlanmıştır.`
        },
        {
          title: "2. Veri Sorumlusu",
          content: `Miss Endo, bu platformda işlenen kişisel veriler bakımından veri sorumlusu sıfatıyla hareket etmektedir.

İletişim: info@missendo.com`
        },
        {
          title: "3. Toplanan Veriler",
          content: `Hizmetlerimiz kapsamında aşağıdaki kişisel veri kategorilerini topluyoruz:

a) Kullanıcı (Klinik Personeli) Verileri:
• Ad ve Soyad
• E-posta adresi
• Telefon numarası
• Profil fotoğrafı (isteğe bağlı)
• Organizasyon/klinik bilgileri
• Kullanıcı rolü ve erişim yetkileri

b) Lead (Potansiyel Hasta) Verileri:
• Ad ve Soyad
• Telefon numarası
• E-posta adresi
• Ülke bilgisi
• İlgilenilen tedavi bilgisi
• Lead kaynağı (Facebook Lead Ads, manuel giriş vb.)
• İletişim geçmişi ve notlar

c) Hasta Verileri:
• Ad ve Soyad
• Telefon numarası ve e-posta adresi
• Doğum tarihi ve cinsiyet
• Ülke ve adres bilgileri
• Tıbbi durum ve alerji bilgileri
• Tedavi planları ve geçmişi
• Randevu ve finansal kayıtlar
• Refakatçi bilgileri
• Hasta fotoğrafları ve belgeleri

d) Facebook Lead Ads Üzerinden Toplanan Veriler:
• Facebook kullanıcı adı veya tam adı
• Telefon numarası
• E-posta adresi
• Facebook lead form'unda doldurulan özel alanlar (tedavi tercihleri, ülke bilgisi vb.)`
        },
        {
          title: "4. Facebook Entegrasyonu ve İzinler",
          content: `Platformumuz, kliniklerin Facebook Lead Ads kampanyalarından gelen potansiyel hastaları otomatik olarak CRM'e aktarabilmesi için Meta (Facebook) platformuyla entegre çalışmaktadır.

Bu entegrasyon kapsamında, klinik yöneticilerinden aşağıdaki Facebook izinleri talep edilmektedir:

a) pages_show_list (Sayfaları Listeleme):
• Amaç: Kullanıcının yönettiği Facebook Sayfalarının listesini görüntülemek
• Kullanım: Klinik yöneticisinin hangi Facebook Sayfasını CRM'e bağlamak istediğini seçmesini sağlamak
• Veri erişimi: Yalnızca sayfa adları ve ID'leri

b) pages_read_engagement (Sayfa Etkileşimlerini Okuma):
• Amaç: Bağlanan Facebook Sayfası için geçerli bir sayfa erişim belirteci (Page Access Token) almak
• Kullanım: Sayfa erişim belirteci, lead verilerine güvenli erişim ve webhook aboneliği oluşturmak için gereklidir
• Veri erişimi: Sayfa erişim belirteci ve sayfa meta verileri

c) leads_retrieval (Lead Verisi Alma):
• Amaç: Facebook Lead Ads formları aracılığıyla gönderilen lead verilerini almak
• Kullanım: Potansiyel hastaların bilgilerini otomatik olarak CRM sistemine aktarmak
• Veri erişimi: Lead formlarında kullanıcıların doldurduğu alanlar (ad, telefon, e-posta, özel sorular)

d) pages_manage_metadata (Sayfa Meta Verilerini Yönetme):
• Amaç: Facebook Sayfasına webhook aboneliği oluşturmak
• Kullanım: Yeni lead geldiğinde gerçek zamanlı bildirim almak için sayfa webhook'unu yapılandırmak
• Veri erişimi: Sayfa webhook yapılandırması

e) ads_read (Reklam Verilerini Okuma):
• Amaç: Facebook reklam hesabı ve kampanya bilgilerine erişmek
• Kullanım: Business Manager üzerinden yönetilen sayfaları listelemek ve reklam performansı metriklerini görüntülemek
• Veri erişimi: Reklam hesabı ID'leri, kampanya isimleri, reklam seti bilgileri ve performans metrikleri (gösterim, tıklama, maliyet vb.)

Önemli Notlar:
• Facebook izinleri yalnızca klinik yöneticisinin açık onayı ile alınır (OAuth 2.0 yetkilendirme akışı).
• Alınan erişim belirteçleri güvenli bir şekilde şifreli olarak saklanır.
• Facebook verileri yalnızca CRM platformu kapsamında, klinik operasyonları için kullanılır.
• Kullanıcılar istedikleri zaman Facebook bağlantısını kesebilir, bu durumda ilgili erişim belirteçleri sistemden silinir.
• Facebook üzerinden elde edilen hiçbir veri üçüncü taraflarla paylaşılmaz veya reklam amacıyla kullanılmaz.`
        },
        {
          title: "5. Verilerin Toplanma Yöntemleri",
          content: `Kişisel veriler aşağıdaki yöntemlerle toplanmaktadır:

• Doğrudan Giriş: Klinik personeli tarafından platforma manuel olarak girilen veriler
• Facebook Lead Ads: Facebook reklam formları aracılığıyla otomatik olarak aktarılan lead verileri (kullanıcının Facebook'taki rızası dahilinde)
• Hesap Oluşturma: Klinik personelinin sisteme kaydedilmesi sırasında alınan bilgiler
• Platform Kullanımı: Kullanıcıların platform üzerindeki etkileşimleri (randevu oluşturma, not ekleme vb.)`
        },
        {
          title: "6. Verilerin Kullanım Amaçları",
          content: `Topladığımız kişisel veriler aşağıdaki meşru amaçlarla işlenmektedir:

• Lead Yönetimi: Potansiyel hastaların takibi, iletişim kurulması ve hasta dönüşüm sürecinin yönetilmesi
• Hasta İlişkileri Yönetimi: Hasta bilgilerinin kaydedilmesi, tedavi süreçlerinin planlanması ve takibi
• Randevu Yönetimi: Randevuların oluşturulması, düzenlenmesi ve otomatik hatırlatmaların gönderilmesi
• Transfer ve Konaklama: Uluslararası hastaların havalimanı transferleri ve otel konaklamalarının koordinasyonu
• Finansal Yönetim: Tedavi maliyetleri, ödemeler ve gelir-gider takibi
• İletişim: E-posta kampanyaları, hatırlatmalar ve bildirimler (klinik tarafından yönetilir)
• Raporlama ve Analiz: Klinik performansının ölçülmesi ve hizmet kalitesinin artırılması
• Yasal Yükümlülükler: İlgili mevzuat kapsamında zorunlu kayıt tutma ve raporlama`
        },
        {
          title: "7. Verilerin Hukuki İşleme Dayanakları",
          content: `Kişisel verileriniz, aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:

• Açık Rıza: Facebook Lead Ads formu dolduran kullanıcıların rızası
• Sözleşmenin İfası: Kliniklerle yapılan hizmet sözleşmesi kapsamında veri işleme
• Meşru Menfaat: Hizmet kalitesinin artırılması ve güvenliğin sağlanması
• Yasal Yükümlülük: Sağlık mevzuatı ve vergi mevzuatı kapsamında zorunlu kayıt tutma

KVKK Madde 5 ve GDPR Madde 6 kapsamında, kişisel veriler yukarıdaki hukuki dayanaklar çerçevesinde işlenmektedir.`
        },
        {
          title: "8. Veri Paylaşımı ve Aktarımı",
          content: `Kişisel verileriniz, açık rızanız olmadan üçüncü taraflarla pazarlama veya reklam amacıyla paylaşılmaz. Ancak aşağıdaki durumlarda veri aktarımı yapılabilir:

• Hizmet Sağlayıcılar: Platformun teknik altyapısını sağlayan hizmet sağlayıcılarla (Supabase - veritabanı ve kimlik doğrulama hizmetleri) veri güvenliği sağlanarak paylaşım yapılır
• İş Ortağı Klinikler: Yalnızca tedavi amacıyla ve hastanın bilgisi dahilinde ilgili klinikle bilgi paylaşılır
• Meta (Facebook): Yalnızca OAuth yetkilendirmesi kapsamında, Facebook Lead Ads verilerinin alınması için API iletişimi gerçekleştirilir. Facebook'a herhangi bir hasta verisi gönderilmez
• Yasal Zorunluluklar: Mahkeme kararı, savcılık talebi veya ilgili mevzuat gereğince yetkili kurum ve kuruluşlarla paylaşım yapılabilir

Uluslararası Veri Aktarımı:
Platformumuz bulut tabanlı altyapı kullandığından, veriler AB/AEA dışındaki sunucularda barındırılabilir. Bu durumda, GDPR Madde 46 kapsamında uygun güvenceler (Standart Sözleşme Maddeleri) uygulanmaktadır.`
        },
        {
          title: "9. Veri Güvenliği",
          content: `Verilerinizi korumak için aşağıdaki güvenlik önlemlerini uyguluyoruz:

• Şifreleme: Tüm veriler hem aktarım sırasında (TLS/SSL) hem de depolama sırasında (AES-256) şifrelenmektedir
• Kimlik Doğrulama: Güçlü parola politikaları ve güvenli oturum yönetimi
• Erişim Kontrolü: Rol tabanlı erişim sistemi (Super Admin, Klinik Admin, Klinik Kullanıcısı) ile her kullanıcı yalnızca yetkili olduğu verilere erişebilir
• Organizasyon İzolasyonu: Her klinik/organizasyon yalnızca kendi verilerine erişebilir, çapraz erişim engellenmiştir
• Denetim Kaydı: Kritik veri işlemleri (oluşturma, güncelleme, silme) denetim günlüklerinde kayıt altına alınır
• Güvenli Token Yönetimi: Facebook erişim belirteçleri şifreli olarak saklanır ve güvenli kanallar üzerinden iletilir
• Düzenli Güvenlik Güncellemeleri: Platform altyapısı sürekli güncellenmekte ve güvenlik açıkları proaktif olarak giderilmektedir`
        },
        {
          title: "10. Veri Saklama Süreleri",
          content: `Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca saklanmaktadır:

• Lead Verileri: Lead durumu aktif olduğu sürece veya veri silme talebine kadar
• Hasta Verileri: Tedavi sürecinin tamamlanmasından itibaren ilgili sağlık mevzuatının öngördüğü süre boyunca
• Finansal Kayıtlar: Vergi mevzuatı kapsamında 10 yıl
• Denetim Günlükleri: 2 yıl
• Facebook Erişim Belirteçleri: Bağlantı kesildiğinde derhal silinir

Saklama süresi dolan veriler, güvenli yöntemlerle kalıcı olarak silinir veya anonim hale getirilir.`
        },
        {
          title: "11. Kullanıcı Hakları (KVKK/GDPR)",
          content: `Yürürlükteki veri koruma mevzuatı kapsamında aşağıdaki haklara sahipsiniz:

• Bilgi Edinme Hakkı: Kişisel verilerinizin işlenip işlenmediğini öğrenme
• Erişim Hakkı: İşlenen kişisel verilerinize erişim talep etme
• Düzeltme Hakkı: Eksik veya hatalı kişisel verilerinizin düzeltilmesini isteme
• Silme Hakkı (Unutulma Hakkı): Kişisel verilerinizin silinmesini talep etme
• İşlemenin Kısıtlanması: Belirli koşullarda veri işlemenin kısıtlanmasını isteme
• İtiraz Hakkı: Kişisel verilerinizin işlenmesine itiraz etme
• Veri Taşınabilirliği: Verilerinizi yapılandırılmış, yaygın olarak kullanılan ve makine tarafından okunabilir bir formatta alma
• Otomatik Karar Vermeye İtiraz: Otomatik profil oluşturma dahil, yalnızca otomatik işlemeye dayalı kararlara itiraz etme
• Şikayet Hakkı: İlgili veri koruma otoritesine (Türkiye: KVKK Kurulu, AB: yerel veri koruma otoritesi) şikayette bulunma

Bu haklarınızı kullanmak için info@missendo.com adresine e-posta gönderebilirsiniz. Talebiniz 30 gün içinde değerlendirilecek ve yanıtlanacaktır.`
        },
        {
          title: "12. Çerezler ve İzleme Teknolojileri",
          content: `Platformumuz, temel işlevselliği sağlamak için gerekli oturum çerezlerini kullanmaktadır. Bu çerezler:

• Kimlik doğrulama ve oturum yönetimi için gereklidir
• Kullanıcı tercihlerini (dil, tema vb.) saklar
• Üçüncü taraf izleme veya reklam amacıyla kullanılmaz

Platform, kullanıcı davranışlarını izleyen veya profil oluşturan üçüncü taraf izleme araçları kullanmamaktadır.`
        },
        {
          title: "13. Politika Değişiklikleri",
          content: `Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler yapıldığında, platform üzerinden veya e-posta yoluyla bilgilendirme yapılacaktır. Güncel politika her zaman bu sayfada yayınlanacaktır.

Platformu kullanmaya devam etmeniz, güncel gizlilik politikasını kabul ettiğiniz anlamına gelir.`
        },
        {
          title: "14. İletişim",
          content: `Gizlilik politikamız, kişisel verileriniz veya haklarınız hakkında sorularınız için:

E-posta: info@missendo.com

Veri silme talepleriniz için detaylı talimatlar: /legal/data-deletion sayfasını ziyaret edin.`
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last Updated: March 27, 2026",
      sections: [
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
          title: "4. Facebook Integration and Permissions",
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
          title: "5. Data Collection Methods",
          content: `Personal data is collected through the following methods:

• Direct Entry: Data manually entered into the platform by clinic staff
• Facebook Lead Ads: Lead data automatically transferred through Facebook ad forms (with the user's consent on Facebook)
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
• Secure Token Management: Facebook access tokens are stored encrypted and transmitted through secure channels
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
            <Link to="/legal/terms" className="hover:underline">
              {language === "tr" ? "Kullanım Şartları" : "Terms of Service"}
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

export default PrivacyPolicy;
