
Sorunun anlamı ve neden aynı yerde kaldığı (kısa cevap):
- Bu ekran, kullanıcının Facebook OAuth sonunda gerekli izinleri gerçekten alamadığını gösteriyor.
- Incognito bunu değiştirmez; çünkü izin kararı tarayıcıda değil Facebook hesabı + Meta Business yetki yapısında tutulur.

Kod ve loglardan net bulgu:
1) Frontend şu scope’ları istiyor:
- `pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata`
2) Edge function loglarında son denemede Facebook’un verdiği sonuç:
- Granted: `pages_manage_metadata`, `public_profile`
- Missing: `pages_show_list`, `pages_read_engagement`, `leads_retrieval`
3) Bu yüzden akış “Missing Permissions” ekranına geri düşüyor.
4) Yani problem şu an “scope istenmiyor” değil; “istenen scope Facebook tarafından bu kullanıcıya grant edilmiyor”.

Neden Live + onaylı olsa da olabilir:
- App permission’larının Advanced Access olması tek başına yetmez.
- Bağlanmaya çalışan kullanıcının ilgili sayfa üzerinde doğru Business/Page yetkileri (özellikle admin/full control + leads erişimi) yoksa Facebook bu izinleri grant etmeyebilir.
- Kullanıcı daha önce app access ekranında bazı izinleri kapattıysa da tekrar aynı döngü olur.

Uygulanacak plan:
1) Operasyonel doğrulama (kodsuz, en hızlı)
- Klinik kullanıcı Facebook > Business Integrations/App Permissions’tan bu uygulamayı tamamen kaldırıp yeniden authorize etsin.
- Meta Business Suite’te ilgili sayfada kullanıcının yetkileri kontrol edilsin (full control/admin + leads erişimi).
- Tekrar bağlantı denensin.
- Aynı anda edge logs’ta `permissions` çıktısı kontrol edilsin; hedef: missing listesinin boşalması.

2) Ürün tarafı iyileştirme (kullanıcı “aynı yerde kaldım” demesin)
- Permission error dialog metnini daha net ayır:
  - “App reviewed ama kullanıcıya page/business yetkisi eksik”
  - “Bu izinleri bu hesap grant etmedi”
- “Try Again” yanında “Revoke app access and reconnect” adımını açıkça göster.

3) Akış dayanıklılığı iyileştirmesi
- `adaccounts` çağrısı `ads_read` yoksa zaten `#200 Missing Permissions` döndürüyor; bu hatayı sessizce “normal fallback” olarak ele alıp kullanıcıyı gereksiz korkutmayan mesaj standardize edilecek.
- Ana bloklayıcı olarak sadece page/lead izinleri gösterilecek.

4) Doğrulama kriteri
- Başarılı senaryoda log’da:
  - Granted içinde en az `pages_show_list`, `pages_read_engagement`, `leads_retrieval`, `pages_manage_metadata`
  - `/me/accounts` boş dönmemeli (veya fallback ile yönetilebilir sayfa bulunmalı)
- Sonrasında page seçimi ekranına geçmeli ve bağlantı tamamlanmalı.

Teknik not:
- Mevcut koddaki scope doğru görünüyor; sorun büyük ihtimalle kullanıcı-level grant/business role tarafında.
- Bu yüzden “incognito denedik ama olmadı” beklenen bir sonuç.
