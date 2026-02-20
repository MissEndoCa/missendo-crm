
# Facebook Lead Polling - Permission Hatasi Cozumu

## Sorun

`poll-facebook-leads` edge function'i lead'leri cekmek icin `/{page_id}/leadgen_forms` endpoint'ini kullaniyor. Facebook bu endpoint icin **`pages_manage_ads`** iznini gerektiriyor ancak uygulamada bu izin yok ve Meta'dan almak da zor/gereksiz.

Mevcut izinler: `pages_show_list`, `pages_read_engagement`, `leads_retrieval`, `pages_manage_metadata`, `ads_read`

## Cozum

Leadgen formlarina sayfa uzerinden erismek yerine, **`ads_read`** izniyle Ad Account uzerinden reklam bilgilerini cekip, her reklamdan lead'leri dogrudan alacagiz.

### Yeni Akis

Mevcut (calismayan):
```text
Page -> leadgen_forms -> form_id -> leads (pages_manage_ads GEREKLI)
```

Yeni (calisacak):
```text
Ad Account -> Campaigns (filtered) -> Ads -> ad_id/leads (ads_read + leads_retrieval YETERLI)
```

### Degisecek Dosya

**`supabase/functions/poll-facebook-leads/index.ts`**

Mevcut `/{page_id}/leadgen_forms` yaklasimindan tamamen vazgecilecek. Yerine:

1. Organizasyonun `fb_page_access_token` ile Facebook kullanicisinin ad account'larini cek (`/me/adaccounts`)
2. Secili kampanyalari (`fb_selected_campaigns`) kullanarak bu kampanyalardaki reklamlari cek (`/{campaign_id}/ads`)
3. Her reklam icin lead'leri cek (`/{ad_id}/leads`) - bu endpoint `leads_retrieval` + `ads_read` izniyle calisiyor
4. Mevcut lead isleme mantigi (field_data parse, duplicate kontrolu, insert) aynen korunacak

### Eger Kampanya Filtresi Yoksa

Kampanya filtresi secilmemisse, tum ad account'lardaki aktif kampanyalardaki reklamlardan lead cekilecek.

### Teknik Detaylar

- `/{ad_id}/leads` endpoint'i `leads_retrieval` izniyle calisiyor
- `/{campaign_id}/ads` endpoint'i `ads_read` izniyle calisiyor  
- Pagination destegi eklenecek (Facebook API'nin `paging.next` alani)
- Hata yonetimi her asamada korunacak
- Mevcut duplicate kontrolu ve lead ekleme mantigi degismeyecek

### Avantajlar

- `pages_manage_ads` iznine ihtiyac kalmayacak
- Mevcut izinlerle (`ads_read` + `leads_retrieval`) calisacak
- Kampanya filtresi ile daha hedefli lead cekimi
