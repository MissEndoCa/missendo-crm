 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Switch } from "@/components/ui/switch";
 import { ArrowLeft, Globe, Mail, Clock, CheckCircle } from "lucide-react";
 import { Link } from "react-router-dom";
 
 const DataDeletion = () => {
   const [language, setLanguage] = useState<"tr" | "en">("tr");
 
   const content = {
     tr: {
       title: "Veri Silme Talimatları",
       lastUpdate: "Son Güncelleme: 5 Şubat 2026",
       intro: "Kişisel verilerinizin silinmesini talep etme hakkına sahipsiniz. Aşağıdaki adımları izleyerek veri silme talebinde bulunabilirsiniz.",
       steps: {
         title: "Veri Silme Talep Süreci",
         items: [
           {
             icon: Mail,
             title: "1. E-posta Gönderin",
             description: "Aşağıdaki e-posta adresine veri silme talebinizi gönderin:",
             highlight: "info@talxmedia.com.tr"
           },
           {
             icon: CheckCircle,
             title: "2. Gerekli Bilgileri Ekleyin",
             description: "E-postanızda aşağıdaki bilgileri belirtin:\n• Ad ve Soyad\n• Kayıtlı telefon numarası veya e-posta\n• Silmek istediğiniz verilerin kapsamı"
           },
           {
             icon: Clock,
             title: "3. Yanıt Bekleyin",
             description: "Talebiniz 30 gün içinde işleme alınacak ve sonuç hakkında bilgilendirileceksiniz."
           }
         ]
       },
       dataDeleted: {
         title: "Silinecek Veriler",
         items: [
           "İletişim bilgileriniz (ad, telefon, e-posta)",
           "Facebook Lead Ads üzerinden toplanan form verileri",
           "Randevu ve tedavi geçmişi",
           "Sistemde kayıtlı notlar ve belgeler"
         ]
       },
       dataRetained: {
         title: "Saklanan Veriler",
         description: "Yasal yükümlülükler gereği aşağıdaki veriler belirli süreler saklanabilir:",
         items: [
           "Fatura ve ödeme kayıtları (10 yıl)",
           "Sağlık kayıtları (yasal saklama süresi boyunca)"
         ]
       },
       contact: {
         title: "İletişim",
         email: "info@talxmedia.com.tr",
         response: "Yanıt süresi: 30 gün içinde"
       }
     },
     en: {
       title: "Data Deletion Instructions",
       lastUpdate: "Last Updated: February 5, 2026",
       intro: "You have the right to request the deletion of your personal data. You can submit a data deletion request by following the steps below.",
       steps: {
         title: "Data Deletion Request Process",
         items: [
           {
             icon: Mail,
             title: "1. Send an Email",
             description: "Send your data deletion request to the following email address:",
             highlight: "info@talxmedia.com.tr"
           },
           {
             icon: CheckCircle,
             title: "2. Include Required Information",
             description: "In your email, please specify:\n• First and Last Name\n• Registered phone number or email\n• Scope of data you want deleted"
           },
           {
             icon: Clock,
             title: "3. Wait for Response",
             description: "Your request will be processed within 30 days and you will be informed about the result."
           }
         ]
       },
       dataDeleted: {
         title: "Data to be Deleted",
         items: [
           "Your contact information (name, phone, email)",
           "Form data collected via Facebook Lead Ads",
           "Appointment and treatment history",
           "Notes and documents recorded in the system"
         ]
       },
       dataRetained: {
         title: "Retained Data",
         description: "The following data may be retained for certain periods due to legal obligations:",
         items: [
           "Invoice and payment records (10 years)",
           "Health records (for the legally required retention period)"
         ]
       },
       contact: {
         title: "Contact",
         email: "info@talxmedia.com.tr",
         response: "Response time: Within 30 days"
       }
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
           <CardContent className="pt-6 space-y-8">
             <p className="text-muted-foreground text-center text-lg">
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
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default DataDeletion;