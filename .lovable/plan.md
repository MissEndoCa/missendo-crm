

# CRM Status Ayirma ve Reminder Mail Secimi

## 1. CRM Status: "Answered - Waiting Photos" Ayirma

Mevcut `called_answered` statusu "Answered - Waiting Photos" olarak birlesik. Bunu ikiye ayiracagiz.

### Veritabani Degisikligi
- `crm_status` enum tipine yeni bir deger eklenecek: `waiting_photos`
- Mevcut `called_answered` degeri korunacak, sadece label'i "Answered" olarak guncellenecek

### Kod Degisiklikleri

**Dosya: `src/pages/Patients.tsx`**
- `CrmStatus` type'ina `waiting_photos` eklenecek
- `CRM_STATUS_CONFIG` icerisinde:
  - `called_answered` label'i `"Answered"` olarak degisecek
  - Yeni `waiting_photos` statusu eklenecek: `{ label: 'Waiting Photos', color: 'text-cyan-700', bgColor: 'bg-cyan-100' }`
- Siralama: `new_lead` > `called_answered` > `called_no_answer` > `waiting_photos` > `photos_received` > ...

**Dosya: `src/components/PatientCard.tsx`**
- Ayni `CrmStatus` type ve `CRM_STATUS_CONFIG` guncellemeleri

---

## 2. Reminder Olusturulurken Mail Alici Secimi

Reminders sayfasinda (`src/pages/Reminders.tsx`) zaten "Sadece bana", "Tum adminlere" ve "Belirli adminlere" secenekleri mevcut. Ancak `PatientDetails.tsx` icerisindeki reminder olusturma formunda bu secenekler yok - `notify_all_admins: true` olarak sabit kodlanmis.

### Kod Degisiklikleri

**Dosya: `src/components/PatientDetails.tsx`**
- Reminder olusturma formuna uc secenekli bir bildirim ayari eklenecek:
  1. **Sadece bana** - sadece olusturan kisiye mail gider
  2. **Tum Adminlere** - tum super adminlere mail gider
  3. **Belirli Adminleri Sec** - secilen kisilere mail gider
- Super admin listesi `profiles` + `user_roles` tablolarindan cekilecek (Reminders.tsx'teki mevcut pattern kullanilacak)
- Secilen adminler `reminder_notify_users` tablosuna kaydedilecek
- Form state'ine `notify_all_admins` ve `selected_admins` alanlari eklenecek

---

## Teknik Detaylar

### Veritabani Migrasyonu
```sql
ALTER TYPE crm_status ADD VALUE 'waiting_photos' AFTER 'called_no_answer';
```

### Degisecek Dosyalar
| Dosya | Degisiklik |
|-------|-----------|
| DB Migration | `crm_status` enum'a `waiting_photos` ekleme |
| `src/pages/Patients.tsx` | CrmStatus type + config guncelleme |
| `src/components/PatientCard.tsx` | CrmStatus type + config guncelleme |
| `src/components/PatientDetails.tsx` | Reminder formuna bildirim alici secimi ekleme |

