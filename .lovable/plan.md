
# Facebook "Sayfa Bulunamadı" Hatası Çözüm Planı

## Problem Özeti
Kullanıcılar Facebook bağlantısı yaparken "Sayfa Bulunamadı" hatası alıyor. Aynı kullanıcılar Zapier veya Doktor365 gibi uygulamalarda sorunsuz bağlanabiliyor.

**Log Analizi:**
- Token exchange başarılı (60 günlük token alındı)
- Pages API çağrısı yapıldı ama **0 sayfa döndü**

## Kök Neden
Facebook Graph API `me/accounts` endpoint'i sayfa döndürmemesi şu nedenlerden olabilir:

1. **Advanced Access Eksikliği** - `pages_show_list` ve `pages_read_engagement` izinleri Standard Access modunda sınırlı çalışıyor
2. **Kullanıcı İzinleri Reddetmiş** - Popup'ta izinleri onaylamadan devam etmiş olabilir
3. **Sayfa Rolü Eksikliği** - Kullanıcı sayfada admin/editor değil

## Çözüm Adımları

### Adım 1: Enhanced Debug Logging
`facebook-oauth` edge function'ına detaylı loglama eklenecek:
- Facebook API'nin tam yanıtını loglama
- Verilen izinleri kontrol etme (`/me/permissions` endpoint'i)
- Hata durumunda kullanıcıya anlamlı mesaj gösterme

### Adım 2: İzin Kontrolü Ekleme
Token alındıktan sonra kullanıcının verdiği izinleri kontrol eden bir adım eklenecek:
- `me/permissions` endpoint'i ile verilen izinleri sorgulama
- Eksik izin varsa kullanıcıya hangi izinlerin gerektiğini gösterme

### Adım 3: Alternatif Sayfa Çekme Yöntemi
Business API üzerinden sayfa çekmeyi deneme:
- `/me/businesses` → her business için `/accounts`
- Bu yöntem bazı kurumsal hesaplarda daha iyi çalışıyor

### Adım 4: Kullanıcı Dostu Hata Mesajları
Frontend'de daha açıklayıcı hata mesajları:
- İzin eksikse ne yapması gerektiğini anlatan mesaj
- Meta Business Suite'te sayfa yöneticisi olduğunu doğrulaması için yönlendirme

---

## Teknik Detaylar

### Edge Function Değişiklikleri (`facebook-oauth/index.ts`)

**Yeni `check-permissions` action:**
```text
me/permissions endpoint'ini çağırarak kullanıcının 
hangi izinleri verdiğini kontrol eder
```

**Güncellenmiş `pages` action:**
```text
1. Önce permissions kontrolü yap
2. me/accounts çağrısının tam yanıtını logla
3. 0 sayfa dönerse alternatif endpoint'leri dene
4. Detaylı hata mesajı döndür
```

### Frontend Değişiklikleri (`FacebookConnectButton.tsx`)
- İzin kontrolü adımı ekleme
- Eksik izinler için uyarı dialog'u
- "İzinleri Düzenle" butonu ile Facebook'ta ayarları açma linki

---

## Meta Developer Console Gereksinimleri

Aşağıdaki izinler için **Advanced Access** alınmalı:

| İzin | Durum | Gereklilik |
|------|-------|------------|
| `pages_show_list` | Advanced Access gerekli | Sayfa listesi |
| `pages_read_engagement` | Advanced Access gerekli | Sayfa detayları |
| `leads_retrieval` | Zaten var | Lead çekme |
| `pages_manage_metadata` | Advanced Access gerekli | Webhook |

**Not:** Development Mode'da sadece App Administrator'lar test edebilir.
