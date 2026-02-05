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
       lastUpdate: "Son Güncelleme: 5 Şubat 2026",
       sections: [
         {
           title: "1. Hizmet Tanımı",
           content: `Miss Endo CRM, sağlık turizmi alanında faaliyet gösteren klinikler için geliştirilmiş bir müşteri ilişkileri yönetim sistemidir. Platform, lead yönetimi, hasta takibi, randevu planlaması ve iletişim araçları sunmaktadır.`
         },
         {
           title: "2. Kullanıcı Sorumlulukları",
           content: `Platformu kullanarak aşağıdaki sorumluluklarınızı kabul etmiş olursunuz:
 • Doğru ve güncel bilgi sağlamak
 • Hesap güvenliğinizi korumak
 • Üçüncü taraf haklarına saygı göstermek
 • Platformu yasalara uygun şekilde kullanmak
 • Kişisel verilerin korunması mevzuatına uymak`
         },
         {
           title: "3. Hesap Güvenliği",
           content: `Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmamalı ve yetkisiz erişim fark ettiğinizde derhal bize bildirmelisiniz.`
         },
         {
           title: "4. Hizmet Kullanımı",
           content: `Platformu aşağıdaki amaçlarla kullanamazsınız:
 • Yasa dışı faaliyetler
 • Spam veya istenmeyen iletişim
 • Sistem güvenliğini tehdit eden eylemler
 • Başkalarının verilerine yetkisiz erişim`
         },
         {
           title: "5. Fikri Mülkiyet",
           content: `Platform ve içerikleri üzerindeki tüm fikri mülkiyet hakları Miss Endo'ya aittir. Yazılı izin olmadan kopyalama, dağıtma veya değiştirme yasaktır.`
         },
         {
           title: "6. Sorumluluk Sınırlamaları",
           content: `Miss Endo, platformun kesintisiz veya hatasız çalışacağını garanti etmez. Teknik sorunlar, veri kayıpları veya üçüncü taraf hizmetlerinden kaynaklanan aksaklıklardan dolayı sorumluluk kabul etmez.
 
 Platforma girilen verilerin doğruluğu ve yasallığı kullanıcının sorumluluğundadır.`
         },
         {
           title: "7. Hizmet Değişiklikleri",
           content: `Miss Endo, herhangi bir zamanda hizmeti değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Önemli değişiklikler önceden bildirilecektir.`
         },
         {
           title: "8. Şartların Değiştirilmesi",
           content: `Bu kullanım şartları zaman zaman güncellenebilir. Değişiklikler yayınlandığında yürürlüğe girer. Platformu kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.`
         },
         {
           title: "9. Uygulanacak Hukuk",
           content: `Bu şartlar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar İstanbul mahkemelerinde çözümlenecektir.`
         },
         {
           title: "10. İletişim",
           content: `Kullanım şartları hakkında sorularınız için:
 E-posta: info@talxmedia.com.tr`
         }
       ]
     },
     en: {
       title: "Terms of Service",
       lastUpdate: "Last Updated: February 5, 2026",
       sections: [
         {
           title: "1. Service Description",
           content: `Miss Endo CRM is a customer relationship management system developed for clinics operating in the health tourism sector. The platform offers lead management, patient tracking, appointment scheduling, and communication tools.`
         },
         {
           title: "2. User Responsibilities",
           content: `By using the platform, you agree to the following responsibilities:
 • Provide accurate and up-to-date information
 • Protect the security of your account
 • Respect third-party rights
 • Use the platform in compliance with laws
 • Comply with personal data protection regulations`
         },
         {
           title: "3. Account Security",
           content: `You are responsible for the security of your account. You should not share your password with anyone and should notify us immediately if you notice unauthorized access.`
         },
         {
           title: "4. Service Usage",
           content: `You may not use the platform for the following purposes:
 • Illegal activities
 • Spam or unwanted communications
 • Actions that threaten system security
 • Unauthorized access to others' data`
         },
         {
           title: "5. Intellectual Property",
           content: `All intellectual property rights on the platform and its contents belong to Miss Endo. Copying, distribution, or modification without written permission is prohibited.`
         },
         {
           title: "6. Limitation of Liability",
           content: `Miss Endo does not guarantee that the platform will operate without interruption or error. We do not accept liability for technical problems, data loss, or disruptions caused by third-party services.
 
 The accuracy and legality of data entered into the platform is the user's responsibility.`
         },
         {
           title: "7. Service Changes",
           content: `Miss Endo reserves the right to modify, suspend, or terminate the service at any time. Significant changes will be notified in advance.`
         },
         {
           title: "8. Modification of Terms",
           content: `These terms of use may be updated from time to time. Changes take effect when published. Your continued use of the platform means you accept the current terms.`
         },
         {
           title: "9. Applicable Law",
           content: `These terms are subject to the laws of the Republic of Turkey. Disputes will be resolved in Istanbul courts.`
         },
         {
           title: "10. Contact",
           content: `For questions about terms of service:
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
             <Link to="/legal/privacy-policy" className="hover:underline">
               {language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
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
 
 export default Terms;