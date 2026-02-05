 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Switch } from "@/components/ui/switch";
 import { ArrowLeft, Globe } from "lucide-react";
 import { Link } from "react-router-dom";
 
 const PrivacyPolicy = () => {
   const [language, setLanguage] = useState<"tr" | "en">("tr");
 
   const content = {
     tr: {
       title: "Gizlilik Politikası",
       lastUpdate: "Son Güncelleme: 5 Şubat 2026",
       sections: [
         {
           title: "1. Giriş",
           content: `Miss Endo CRM olarak, kişisel verilerinizin korunmasına büyük önem veriyoruz. Bu Gizlilik Politikası, hizmetlerimizi kullanırken topladığımız, kullandığımız ve koruduğumuz bilgileri açıklamaktadır.`
         },
         {
           title: "2. Toplanan Veriler",
           content: `Hizmetlerimiz kapsamında aşağıdaki kişisel verileri topluyoruz:
 • Ad ve Soyad
 • Telefon numarası
 • E-posta adresi
 • Ülke bilgisi
 • Facebook Lead Ads üzerinden gönderilen form verileri
 • Tedavi tercihleri ve sağlık ile ilgili genel bilgiler`
         },
         {
           title: "3. Facebook Lead Ads Entegrasyonu",
           content: `Uygulamamız, Facebook Lead Ads ile entegre çalışmaktadır. Facebook reklamları aracılığıyla form dolduran kullanıcıların bilgileri, rızaları dahilinde CRM sistemimize aktarılmaktadır. Bu veriler yalnızca sizinle iletişim kurmak ve hizmetlerimizi sunmak amacıyla kullanılmaktadır.`
         },
         {
           title: "4. Verilerin Kullanım Amacı",
           content: `Topladığımız veriler aşağıdaki amaçlarla kullanılmaktadır:
 • Sizinle iletişim kurmak
 • Randevu planlaması yapmak
 • Tedavi süreçlerini yönetmek
 • Hizmet kalitesini artırmak
 • Yasal yükümlülükleri yerine getirmek`
         },
         {
           title: "5. Veri Paylaşımı",
           content: `Kişisel verileriniz, açık rızanız olmadan üçüncü taraflarla paylaşılmaz. Ancak aşağıdaki durumlar istisnadır:
 • Yasal zorunluluklar
 • İş ortağı kliniklerle (sadece tedavi amacıyla)
 • Teknik altyapı sağlayıcıları (Supabase, veri güvenliği sağlanarak)`
         },
         {
           title: "6. Veri Güvenliği",
           content: `Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz. Tüm veriler şifreli olarak saklanmakta ve yetkisiz erişime karşı korunmaktadır.`
         },
         {
           title: "7. Kullanıcı Hakları (KVKK/GDPR)",
           content: `Aşağıdaki haklara sahipsiniz:
 • Verilerinize erişim talep etme
 • Verilerinizin düzeltilmesini isteme
 • Verilerinizin silinmesini talep etme
 • Veri işlemeye itiraz etme
 • Veri taşınabilirliği talep etme
 
 Bu haklarınızı kullanmak için info@talxmedia.com.tr adresine e-posta gönderebilirsiniz.`
         },
         {
           title: "8. İletişim",
           content: `Gizlilik politikamız hakkında sorularınız için:
 E-posta: info@talxmedia.com.tr`
         }
       ]
     },
     en: {
       title: "Privacy Policy",
       lastUpdate: "Last Updated: February 5, 2026",
       sections: [
         {
           title: "1. Introduction",
           content: `At Miss Endo CRM, we take the protection of your personal data very seriously. This Privacy Policy explains the information we collect, use, and protect when you use our services.`
         },
         {
           title: "2. Data We Collect",
           content: `We collect the following personal data as part of our services:
 • First and Last Name
 • Phone number
 • Email address
 • Country information
 • Form data submitted via Facebook Lead Ads
 • Treatment preferences and general health-related information`
         },
         {
           title: "3. Facebook Lead Ads Integration",
           content: `Our application is integrated with Facebook Lead Ads. Information from users who fill out forms through Facebook advertisements is transferred to our CRM system with their consent. This data is used solely to contact you and provide our services.`
         },
         {
           title: "4. Purpose of Data Use",
           content: `The data we collect is used for the following purposes:
 • To contact you
 • To schedule appointments
 • To manage treatment processes
 • To improve service quality
 • To fulfill legal obligations`
         },
         {
           title: "5. Data Sharing",
           content: `Your personal data will not be shared with third parties without your explicit consent. However, the following exceptions apply:
 • Legal requirements
 • Partner clinics (for treatment purposes only)
 • Technical infrastructure providers (Supabase, with data security ensured)`
         },
         {
           title: "6. Data Security",
           content: `We use industry-standard security measures to protect your data. All data is stored encrypted and protected against unauthorized access.`
         },
         {
           title: "7. User Rights (KVKK/GDPR)",
           content: `You have the following rights:
 • Request access to your data
 • Request correction of your data
 • Request deletion of your data
 • Object to data processing
 • Request data portability
 
 To exercise these rights, you can send an email to info@talxmedia.com.tr.`
         },
         {
           title: "8. Contact",
           content: `For questions about our privacy policy:
 Email: info@talxmedia.com.tr`
         }
       ]
     }
   };
 
   const currentContent = content[language];
 
   return (
     <div className="min-h-screen bg-background">
       <div className="max-w-4xl mx-auto px-4 py-8">
         <div className="flex items-center justify-between mb-8">
           <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
             <ArrowLeft className="h-4 w-4" />
             <span>{language === "tr" ? "Ana Sayfa" : "Home"}</span>
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
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default PrivacyPolicy;