
# Facebook ile Bağlan - OAuth Entegrasyonu

## Hedef
Klinik kullanıcıları Settings sayfasında **"Facebook ile Bağlan"** butonuna tıklayarak, tek tıkla Facebook sayfalarını CRM'e bağlayabilecek. Sistem otomatik olarak:
- Page Access Token alacak
- Token'ı veritabanına kaydedecek
- Leadgen webhook aboneliğini aktifleyecek

---

## Akış Özeti

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CRM Settings  │────>│  Facebook Login │────>│  Sayfa Seçimi   │
│   "Bağlan" btn  │     │   OAuth Dialog  │     │   (Popup)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Token Kaydet   │<────│  Edge Function  │<────│  Callback ile   │
│  organizations  │     │  Token Exchange │     │  Code Döner     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Teknik Detaylar

### 1. Database Güncellemesi
Organizations tablosuna yeni kolonlar eklenecek:

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `fb_page_id` | text | Bağlanan Facebook Page ID |
| `fb_page_name` | text | Sayfa adı (gösterim için) |
| `fb_connected_at` | timestamp | Bağlantı tarihi |
| `fb_user_id` | text | Token sahibi kullanıcı ID |

### 2. Gerekli Secrets
Facebook Developer Console'dan alınacak:

| Secret | Kaynak |
|--------|--------|
| `FB_APP_ID` | Facebook App > Settings > Basic |
| `FB_APP_SECRET` | Facebook App > Settings > Basic |

### 3. Yeni Edge Function: `facebook-oauth`
Token exchange ve sayfa listeleme işlemleri için:

**Endpoint:** `/functions/v1/facebook-oauth`

| Action | Açıklama |
|--------|----------|
| `exchange` | Short-lived token'ı long-lived'a çevir |
| `pages` | Kullanıcının yönettiği sayfaları listele |
| `subscribe` | Seçilen sayfayı leadgen webhook'una abone et |

### 4. Frontend Bileşenleri

**Yeni Bileşen:** `FacebookConnectButton.tsx`
- "Facebook ile Bağlan" butonu
- Bağlantı durumunu göster (bağlı/bağlı değil)
- Bağlıysa sayfa adını ve bağlantıyı kaldır seçeneğini göster

**Settings.tsx Güncellemesi:**
- Manuel token input alanlarını kaldır
- FacebookConnectButton bileşenini ekle

---

## Adım Adım İmplementasyon

### Adım 1: Database Migration
```sql
ALTER TABLE organizations
ADD COLUMN fb_page_id text,
ADD COLUMN fb_page_name text,
ADD COLUMN fb_connected_at timestamptz,
ADD COLUMN fb_user_id text;
```

### Adım 2: Secrets Ekleme
- `FB_APP_ID` - Facebook App ID
- `FB_APP_SECRET` - Facebook App Secret

### Adım 3: facebook-oauth Edge Function
Token exchange akışı:
1. Frontend Facebook SDK ile login → short-lived token alır
2. Edge function'a gönderir
3. Edge function:
   - Token'ı long-lived'a çevirir (60 günlük)
   - `/me/accounts` ile page token alır (sınırsız süre)
   - Sayfayı leadgen webhook'una abone eder
   - Token'ı organizations tablosuna kaydeder

### Adım 4: FacebookConnectButton Bileşeni
```text
┌────────────────────────────────────────────┐
│  📘 Facebook Lead Ads                       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔗 Facebook ile Bağlan             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  veya (bağlıysa):                          │
│                                             │
│  ✅ Bağlı: Miss Endo Clinic Sayfa          │
│  📅 Bağlantı: 5 Şubat 2026                 │
│  [Bağlantıyı Kaldır]                       │
└────────────────────────────────────────────┘
```

### Adım 5: Settings.tsx Güncellemesi
- Facebook Ads kartını güncelle
- Manuel input yerine FacebookConnectButton kullan
- WhatsApp kartı olduğu gibi kalacak

---

## Facebook İzinleri (Permissions)

OAuth dialog'da istenen izinler:
- `pages_show_list` - Sayfa listesini görme
- `pages_read_engagement` - Sayfa etkileşimlerini okuma
- `leads_retrieval` - Lead verilerini çekme
- `pages_manage_metadata` - Webhook aboneliği için

---

## Dosya Değişiklikleri

### Yeni Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `supabase/functions/facebook-oauth/index.ts` | Token exchange ve webhook aboneliği |
| `src/components/FacebookConnectButton.tsx` | OAuth bağlantı butonu |

### Güncellenecek Dosyalar
| Dosya | Değişiklik |
|-------|------------|
| `src/pages/Settings.tsx` | Manuel input → FacebookConnectButton |
| `src/integrations/supabase/types.ts` | Yeni kolonlar (regenerate) |
| `supabase/config.toml` | facebook-oauth function config |

### Migration
| Dosya | Açıklama |
|-------|----------|
| `XXXXXX_add_fb_page_columns.sql` | Yeni organizations kolonları |

---

## Güvenlik Notları

1. **FB_APP_SECRET** sadece Edge Function'da kullanılacak (asla frontend'e gitmeyecek)
2. Token exchange server-side yapılacak
3. Sadece clinic_admin ve super_admin rolü bağlantı yapabilecek
4. Token veritabanında şifreli saklanacak (RLS korumalı)

---

## Kullanıcı Deneyimi

**Klinik Yöneticisi için akış:**
1. Settings sayfasına git
2. "Facebook ile Bağlan" butonuna tıkla
3. Facebook popup açılır → Giriş yap
4. İzinleri onayla
5. Hangi sayfayı bağlamak istediğini seç
6. Tamamlandı! Artık leadler otomatik gelecek

**Bağlantı durumu gösterimi:**
- Bağlı değilse: Mavi "Facebook ile Bağlan" butonu
- Bağlıysa: Yeşil onay + sayfa adı + tarih + kaldır butonu
