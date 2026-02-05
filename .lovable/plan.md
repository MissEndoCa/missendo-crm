
# Facebook Lead Senkronizasyonu ve Bildirim Sistemi

## Genel Bakış

Bu plan, Facebook Lead Ads entegrasyonunu daha güvenilir hale getirmek ve yeni lead geldiğinde e-posta bildirimi göndermek için gerekli değişiklikleri kapsar.

---

## Yapılacaklar Özeti

| Adım | Açıklama |
|------|----------|
| 1 | Veritabanındaki test/seed leadleri silmek için migration |
| 2 | Facebook'tan lead çeken yeni edge function oluştur |
| 3 | Leads sayfasına manuel yenileme butonu ekle |
| 4 | Otomatik polling (her dakika) mekanizması ekle |
| 5 | Yeni lead geldiğinde e-posta gönderen trigger/function |

---

## Adım 1: Test Leadleri Temizleme

Veritabanında aynı anda (2026-01-28 07:48:48) oluşturulmuş 5 adet seed/test lead bulunuyor:
- Ahmet Yılmaz
- Fatma Kaya
- Ayşe Öztürk
- Ali Çelik
- Mehmet Demir

Bu kayıtları silmek için bir migration oluşturulacak.

---

## Adım 2: Facebook Lead Polling Edge Function

Yeni bir edge function oluşturulacak: `poll-facebook-leads`

Bu function:
- Facebook bağlantısı olan tüm organizasyonları bulur
- Her organizasyon için Facebook Graph API'den son leadleri çeker
- Yeni leadleri veritabanına kaydeder (telefon numarası ile mükerrer kontrol)
- Manuel tetikleme ve cron job ile çağrılabilir olacak

```text
+------------------+      +----------------------+      +------------------+
|   Leads Page     | ---> | poll-facebook-leads  | ---> |  Facebook API    |
|  (Refresh Btn)   |      |   Edge Function      |      |  Graph API       |
+------------------+      +----------------------+      +------------------+
                                    |
                                    v
                          +------------------+
                          |   leads table    |
                          |   (Supabase)     |
                          +------------------+
                                    |
                                    v
                          +------------------+
                          |  notify trigger  |
                          |  (email + notif) |
                          +------------------+
```

---

## Adım 3: Leads Sayfasına Yenileme Butonu

Leads sayfasının header kısmına yenileme (refresh) ikonu olan bir buton eklenecek:
- RefreshCw ikonu kullanılacak
- Butona tıklandığında `poll-facebook-leads` edge function çağrılacak
- Loading state gösterilecek
- Sonuç toast mesajı ile bildirilecek

---

## Adım 4: Otomatik Polling Mekanizması

İki seçenek mevcut:

**Seçenek A - Frontend Polling (Önerilen):**
- Leads sayfası açıkken 60 saniyede bir otomatik yenileme
- `useEffect` ile interval kurulacak
- Sayfa kapatılınca polling durur

**Seçenek B - Supabase Cron Job:**
- pg_cron ile her dakika edge function çağrılır
- Sayfa açık olmasa da çalışır
- Daha fazla kaynak kullanır

Frontend polling tercih edilecek (sayfa açıkken aktif).

---

## Adım 5: Yeni Lead E-posta Bildirimi

Mevcut `notify_admins_on_new_lead` trigger'ı sadece uygulama içi bildirim oluşturuyor. E-posta göndermesi için:

Yeni edge function: `send-new-lead-email`

Bu function:
- Lead oluşturulduğunda çağrılır (trigger veya webhook ile)
- Tüm super adminlere e-posta gönderir
- İlgili clinic admin'e e-posta gönderir
- Lead bilgilerini (isim, telefon, kaynak, klinik) içerir

**E-posta Akışı:**
```text
Yeni Lead Insert
      |
      v
trigger_notify_admins_on_new_lead (mevcut - bildirim)
      |
      v
pg_net HTTP hook --> send-new-lead-email (yeni)
      |
      v
SMTP --> Super Admins + Clinic Admin
```

---

## Teknik Detaylar

### poll-facebook-leads Edge Function

```
supabase/functions/poll-facebook-leads/index.ts
```

Yapacakları:
1. Facebook bağlantısı olan organizasyonları çek
2. Her biri için leadgen form'larını listele
3. Son 24 saatteki leadleri çek
4. Mükerrer kontrolü yap (telefon + org)
5. Yeni leadleri insert et
6. Kaç lead eklendi bilgisini döndür

### send-new-lead-email Edge Function

```
supabase/functions/send-new-lead-email/index.ts
```

Yapacakları:
1. Lead ID'yi al
2. Lead detaylarını ve organizasyon bilgisini çek
3. Super admin e-postalarını bul
4. İlgili clinic admin e-postalarını bul
5. HTML e-posta şablonu oluştur
6. SMTP ile gönder

### Leads.tsx Değişiklikleri

- Header'a RefreshCw butonu
- `pollFacebookLeads()` fonksiyonu
- 60 saniyelik interval ile otomatik polling
- Loading ve sonuç gösterimi

---

## Dosya Değişiklikleri

| Dosya | İşlem |
|-------|-------|
| `supabase/functions/poll-facebook-leads/index.ts` | Yeni |
| `supabase/functions/send-new-lead-email/index.ts` | Yeni |
| `supabase/config.toml` | Güncelle (yeni functions) |
| `src/pages/Leads.tsx` | Güncelle (refresh button + polling) |
| Migration SQL | Yeni (seed data silme + pg_net trigger) |

---

## Risk ve Dikkat Edilecekler

- **Facebook Rate Limit:** Her dakika polling yapılacağı için rate limit'e dikkat edilmeli
- **Token Geçerliliği:** Page access token'ların geçerliliği kontrol edilmeli
- **E-posta Spam:** Çok fazla lead gelirse e-posta flood olabilir - throttling düşünülmeli
