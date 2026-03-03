

## ads_read Reddi - Analiz ve Çözüm Planı

### Sorun
Meta reviewer, `ads_read` izni için gerçek reklam performans verilerinin (impressions, clicks, reach, spend, conversions) Facebook API'den çekilip CRM dashboard'unda gösterilmesini istiyor. Şu anki uygulama `ads_read` iznini sadece kampanya/adset filtreleme için kullanıyor, performans metrikleri gösterilmiyor.

### Çözüm
CRM'e bir **Ad Performance Dashboard** bölümü eklenecek. Bu bölüm Facebook Graph API'den kampanya performans verilerini çekip görsel olarak gösterecek.

### Yapılacaklar

**1. Yeni Edge Function: `fetch-ad-insights`**
- Facebook Graph API v21.0 üzerinden `/act_{ad_account_id}/insights` endpoint'ini çağıracak
- Metrikleri çekecek: impressions, clicks, reach, spend, conversions, cpc, ctr
- Kampanya bazında breakdown yapacak
- Organizasyonun `fb_page_access_token` bilgisini kullanacak

**2. Settings veya Dashboard sayfasına "Ad Performance" bölümü ekleme**
- Kampanya listesi ve her kampanyanın performans metrikleri (tablo veya kartlar)
- Impressions, Clicks, Reach, Spend, Conversions, CTR, CPC kolonları
- Gerçek veriler Facebook API'den gelecek
- Recharts ile basit grafikler eklenebilir (opsiyonel ama screencast için etkileyici olur)

**3. Screencast akışı**
Yeni video şunları göstermeli:
1. CRM'e giriş
2. Meta login flow (Connect with Facebook)
3. İzinleri onayla
4. Ad Performance bölümüne git
5. Gerçek kampanya verileri (impressions, clicks, spend vs.) yükleniyor ve dashboard'da görünüyor

### Önemli Not
Bu özelliğin çalışması için Facebook'ta **aktif reklam kampanyalarına** sahip bir ad account'a erişim gerekiyor. Screencast çekerken gerçek veri gösteren bir hesap kullanılmalı.

### Alternatif: ads_read'den vazgeçme
Eğer reklam performans verilerini göstermeye gerek yoksa ve sadece lead filtreleme yeterliyse, `ads_read` izninden vazgeçilebilir. Kampanya/adset filtreleme `leads_retrieval` ile de kısmen yapılabilir. Ancak detaylı filtreleme için `ads_read` gerekli.

