
# Facebook App Live Mode için Yasal Sayfalar

## Hedef
CRM içinde Facebook'un talep ettiği yasal sayfaları oluşturup, uygulamayı Live moda alabilmenizi sağlamak.

## Oluşturulacak Sayfalar

### 1. Privacy Policy (Gizlilik Politikası)
**URL:** `https://crm.missendo.com/legal/privacy-policy`

İçerik:
- Hangi veriler toplanıyor (ad, telefon, e-posta)
- Facebook Lead Ads entegrasyonu açıklaması
- Verilerin nasıl kullanıldığı
- Verilerin kimlerle paylaşıldığı
- Kullanıcı hakları (KVKK / GDPR uyumlu)

### 2. Terms of Service (Kullanım Şartları)
**URL:** `https://crm.missendo.com/legal/terms`

İçerik:
- Hizmet tanımı
- Kullanıcı sorumlulukları
- Sorumluluk sınırlamaları
- Değişiklik hakları

### 3. Data Deletion Instructions (Veri Silme Talimatları)
**URL:** `https://crm.missendo.com/legal/data-deletion`

İçerik:
- E-posta ile nasıl talep edileceği (info@talxmedia.com.tr)
- Hangi verilerin silineceği
- İşlem süresi (30 gün içinde)

## Teknik Değişiklikler

### Yeni Dosyalar
```text
src/pages/legal/
├── PrivacyPolicy.tsx    # Gizlilik Politikası (TR+EN)
├── Terms.tsx            # Kullanım Şartları (TR+EN)
└── DataDeletion.tsx     # Veri Silme Talimatları (TR+EN)
```

### Router Güncellemesi (App.tsx)
```text
/legal/privacy-policy  → PrivacyPolicy
/legal/terms           → Terms  
/legal/data-deletion   → DataDeletion
```

Bu sayfalar:
- **Public** olacak (giriş yapmadan erişilebilir)
- **Dil seçici** olacak (TR/EN toggle)
- **Profesyonel görünümlü** ve print-friendly

## Facebook Console'a Girilecek URL'ler

Sayfalar canlıya alındıktan sonra:

| Alan | URL |
|------|-----|
| Privacy Policy URL | `https://crm.missendo.com/legal/privacy-policy` |
| Terms of Service URL | `https://crm.missendo.com/legal/terms` |
| User Data Deletion | `https://crm.missendo.com/legal/data-deletion` |

## Adım Adım Süreç

1. Yasal sayfaları oluştur
2. App.tsx'e public route'ları ekle
3. Publish et (CRM'i canlıya al)
4. URL'leri Facebook Developer Console'a gir
5. App Mode'u "Live" yap
6. Webhook'u test et

## Ek Öneriler

- **App Icon:** 1024x1024 Miss Endo logosu yükleyebilirsiniz
- **Category:** "Business" veya "Health & Fitness" seçebilirsiniz
- **Contact Email:** Zaten girilmiş (info@talxmedia.com.tr)
