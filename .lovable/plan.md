

## Problem

Facebook OAuth login scope'unda `ads_read` izni isteniyor ancak bu izin Meta App Review'da **"Not approved"** durumunda. Facebook, onaylanmamış izin istendiğinde harici kullanıcılara (App Role'ü olmayan) "Missing Permissions" hatası gösteriyor.

## Çözüm

`ads_read` iznini OAuth scope'undan kaldırmak. Sistem zaten `ads_read` olmadan da lead senkronizasyonu yapabiliyor (sayfa düzeyinde `/{page_id}/leads` polling fallback mekanizması mevcut). Sadece reklam performans metrikleri (CPL, harcama vs.) bu izin olmadan çalışmayacak.

## Değişiklikler

### 1. `src/components/FacebookConnectButton.tsx`
- Satır 176'daki OAuth scope'undan `ads_read` kaldırılacak
- Scope: `pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata`

### 2. Opsiyonel: Reklam performans özelliklerinde uyarı
- `ads_read` olmadan Ad Performance Dashboard çalışmayacak, bu bölümde kullanıcıya bilgi verilebilir

## Etki
- Harici klinik kullanıcıları Facebook'a bağlanabilecek
- Lead senkronizasyonu normal çalışmaya devam edecek
- Reklam performans metrikleri (CPL, spend vb.) görüntülenemeyecek (`ads_read` onaylanana kadar)

