import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Globe, Shield, Users, Zap, Heart, Lock, BarChart3, Calendar, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  const content = {
    tr: {
      title: "Hakkımızda",
      lastUpdate: "Son Güncelleme: 27 Mart 2026",
      hero: {
        title: "Sağlık Turizminde Dijital Dönüşüm",
        description: "Miss Endo CRM, sağlık turizmi sektöründe faaliyet gösteren kliniklere özel olarak tasarlanmış, güvenli ve kapsamlı bir müşteri ilişkileri yönetim platformudur. Amacımız, kliniklerin hasta yolculuğunu uçtan uca dijitalleştirerek operasyonel verimliliği artırmak ve hasta memnuniyetini en üst düzeye çıkarmaktır."
      },
      mission: {
        title: "Misyonumuz",
        content: "Sağlık turizmi alanında faaliyet gösteren kliniklerin, hasta ilişkilerini daha etkili yönetmelerine, operasyonel süreçlerini otomatikleştirmelerine ve büyümelerini hızlandırmalarına yardımcı olmak. Bunu yaparken hasta verilerinin güvenliğini ve gizliliğini en üst düzeyde tutmayı taahhüt ediyoruz."
      },
      vision: {
        title: "Vizyonumuz",
        content: "Sağlık turizmi sektöründe dijital dönüşümün öncüsü olarak, kliniklerin küresel ölçekte rekabet edebilmelerini sağlayan, yenilikçi ve güvenilir teknoloji çözümleri sunmak."
      },
      features: {
        title: "Platform Özellikleri",
        items: [
          {
            icon: Users,
            title: "Lead ve Hasta Yönetimi",
            description: "Potansiyel hastaları (lead) ilk temastan tedavi sürecine kadar takip edin. Facebook Lead Ads entegrasyonu ile reklamlardan gelen lead'leri otomatik olarak CRM'e aktarın. Hastaların demografik bilgilerini, tıbbi geçmişlerini, tedavi planlarını ve tüm iletişim geçmişlerini tek bir merkezden yönetin."
          },
          {
            icon: Calendar,
            title: "Randevu ve Planlama",
            description: "Randevuları kolayca oluşturun, düzenleyin ve takip edin. Otomatik hatırlatma sistemiyle randevu kaçırmalarını en aza indirin. Klinik kapasitesini optimize ederek verimliliği artırın."
          },
          {
            icon: Globe2,
            title: "Transfer ve Konaklama Yönetimi",
            description: "Uluslararası hastalar için havalimanı transferleri, otel konaklamaları ve şehir içi ulaşımı tek platformdan koordine edin. Refakatçi bilgilerini ve özel gereksinimleri kayıt altına alın."
          },
          {
            icon: BarChart3,
            title: "Finansal Takip ve Raporlama",
            description: "Tedavi maliyetleri, ödemeler, indirimler ve gelir-gider takibini detaylı bir şekilde yapın. Klinik performansını ölçmek için kapsamlı raporlara ve analizlere erişin."
          },
          {
            icon: Zap,
            title: "Facebook Lead Ads Entegrasyonu",
            description: "Facebook reklamlarından gelen potansiyel hastaları otomatik olarak CRM sisteminize aktarın. OAuth tabanlı güvenli bağlantıyla Facebook sayfalarınızı kolayca entegre edin. Reklam performansını takip edin ve lead dönüşüm oranlarınızı analiz edin."
          },
          {
            icon: Lock,
            title: "Güvenlik ve GDPR/KVKK Uyumluluk",
            description: "Tüm veriler endüstri standardı şifreleme yöntemleriyle korunmaktadır. GDPR ve KVKK mevzuatlarına tam uyumluluk sağlanmaktadır. Rol tabanlı erişim kontrolü ile her kullanıcı yalnızca yetkili olduğu verilere erişebilir."
          }
        ]
      },
      whyUs: {
        title: "Neden Miss Endo CRM?",
        items: [
          "Sağlık turizmine özel olarak tasarlanmış, sektörün ihtiyaçlarını derinlemesine anlayan bir platform",
          "Uçtan uca hasta yolculuğu yönetimi: lead → hasta → randevu → tedavi → takip",
          "Facebook Lead Ads ile doğrudan entegrasyon sayesinde reklam yatırım getirisini (ROI) maksimize etme",
          "GDPR ve KVKK'ya tam uyumlu veri yönetimi ve hasta gizliliği",
          "Çoklu organizasyon desteği ile farklı kliniklerin bağımsız yönetimi",
          "Rol tabanlı erişim sistemi ile güvenli ve kontrollü kullanım",
          "Sürekli güncellenen ve geliştirilen modern teknoloji altyapısı"
        ]
      },
      technology: {
        title: "Teknoloji Altyapımız",
        content: "Miss Endo CRM, modern web teknolojileri üzerine inşa edilmiş güvenilir ve ölçeklenebilir bir platformdur. Bulut tabanlı altyapımız sayesinde verileriniz güvende tutulurken, her yerden kesintisiz erişim imkanı sunulmaktadır. Platformumuz sürekli olarak güvenlik güncellemeleri ve yeni özelliklerle geliştirilmektedir."
      },
      contact: {
        title: "Bizimle İletişime Geçin",
        content: "Platformumuz hakkında daha fazla bilgi almak, demo talep etmek veya sorularınızı iletmek için bizimle iletişime geçebilirsiniz.",
        email: "info@missendo.com"
      }
    },
    en: {
      title: "About Us",
      lastUpdate: "Last Updated: March 27, 2026",
      hero: {
        title: "Digital Transformation in Health Tourism",
        description: "Miss Endo CRM is a secure and comprehensive customer relationship management platform specifically designed for clinics operating in the health tourism sector. Our goal is to digitize the entire patient journey end-to-end, increasing operational efficiency and maximizing patient satisfaction."
      },
      mission: {
        title: "Our Mission",
        content: "To help clinics operating in the health tourism sector manage their patient relationships more effectively, automate their operational processes, and accelerate their growth. While doing so, we are committed to maintaining the highest level of patient data security and privacy."
      },
      vision: {
        title: "Our Vision",
        content: "As a pioneer of digital transformation in the health tourism sector, to provide innovative and reliable technology solutions that enable clinics to compete on a global scale."
      },
      features: {
        title: "Platform Features",
        items: [
          {
            icon: Users,
            title: "Lead & Patient Management",
            description: "Track potential patients (leads) from first contact through the entire treatment process. Automatically import leads from Facebook Lead Ads directly into your CRM. Manage patients' demographic information, medical history, treatment plans, and all communication history from a single hub."
          },
          {
            icon: Calendar,
            title: "Appointment & Scheduling",
            description: "Create, edit, and track appointments with ease. Minimize no-shows with an automatic reminder system. Optimize clinic capacity to increase efficiency."
          },
          {
            icon: Globe2,
            title: "Transfer & Accommodation Management",
            description: "Coordinate airport transfers, hotel accommodations, and city transportation for international patients from a single platform. Record companion information and special requirements."
          },
          {
            icon: BarChart3,
            title: "Financial Tracking & Reporting",
            description: "Track treatment costs, payments, discounts, and income-expense management in detail. Access comprehensive reports and analytics to measure clinic performance."
          },
          {
            icon: Zap,
            title: "Facebook Lead Ads Integration",
            description: "Automatically import potential patients from Facebook advertisements into your CRM system. Easily integrate your Facebook Pages with secure OAuth-based connection. Track ad performance and analyze your lead conversion rates."
          },
          {
            icon: Lock,
            title: "Security & GDPR/KVKK Compliance",
            description: "All data is protected with industry-standard encryption methods. Full compliance with GDPR and KVKK (Turkish Data Protection Law) regulations is ensured. With role-based access control, each user can only access the data they are authorized for."
          }
        ]
      },
      whyUs: {
        title: "Why Miss Endo CRM?",
        items: [
          "A platform specifically designed for health tourism that deeply understands the sector's needs",
          "End-to-end patient journey management: lead → patient → appointment → treatment → follow-up",
          "Maximize advertising ROI with direct Facebook Lead Ads integration",
          "GDPR and KVKK compliant data management and patient privacy",
          "Multi-organization support for independent management of different clinics",
          "Secure and controlled usage with role-based access system",
          "Modern technology infrastructure that is continuously updated and improved"
        ]
      },
      technology: {
        title: "Our Technology Infrastructure",
        content: "Miss Endo CRM is a reliable and scalable platform built on modern web technologies. Thanks to our cloud-based infrastructure, your data is kept secure while providing seamless access from anywhere. Our platform is continuously improved with security updates and new features."
      },
      contact: {
        title: "Get in Touch",
        content: "Contact us to learn more about our platform, request a demo, or ask any questions.",
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
            {/* Hero */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{currentContent.hero.title}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {currentContent.hero.description}
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{currentContent.mission.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">{currentContent.mission.content}</p>
              </div>
              <div className="p-6 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{currentContent.vision.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">{currentContent.vision.content}</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center">{currentContent.features.title}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {currentContent.features.items.map((feature, index) => (
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
              <h2 className="text-2xl font-semibold">{currentContent.whyUs.title}</h2>
              <ul className="space-y-2">
                {currentContent.whyUs.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{currentContent.technology.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{currentContent.technology.content}</p>
            </div>

            {/* Contact */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-2">
              <h2 className="text-xl font-semibold">{currentContent.contact.title}</h2>
              <p className="text-muted-foreground">{currentContent.contact.content}</p>
              <a 
                href={`mailto:${currentContent.contact.email}`}
                className="text-primary font-medium text-lg hover:underline inline-block"
              >
                {currentContent.contact.email}
              </a>
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

export default AboutUs;
