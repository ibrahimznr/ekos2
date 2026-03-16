# EKOS - Ekipman Kontrol Otomasyon Sistemi PRD

## Original Problem Statement
EKOS is an equipment control automation system for managing inspection reports, machines, operators, and scaffolding components. The application was developed to help companies track and manage their equipment inspection processes.

## Core Requirements
1. **User Authentication** - JWT-based auth with single session enforcement
2. **Dashboard** - Overview of reports, statistics, and quick actions
3. **Report Management** - CRUD operations for equipment inspection reports
4. **Excel Import/Export** - Bulk data handling
5. **File Management** - Upload and manage inspection documents (images, PDFs)
6. **Project Management** - Organize reports by projects
7. **Category Management** - Equipment categorization
8. **Admin Panel** - User management, settings
9. **Çekiliş (Raffle) Module** - NEW: Draw management, vocabulary learning, mind games

## Architecture
- **Frontend:** React 18 + TailwindCSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **File Storage:** Local uploads directory

## Key Technical Features
- Modular router architecture (routers/)
- Single-session login enforcement
- ZIP export with category-based folder structure
- Project-specific report filtering and export
- Project-based bulk ZIP export with all media files
- **NEW:** Çekiliş module with 3 sub-features

---

## What's Been Implemented

### January 25, 2026 - Dashboard Excel Export with Filters

**Dashboard Filtreleme ve Excel Export** ✅
- Dashboard'a "Excel Raporu Oluştur" butonu eklendi (yeşil gradient, FileSpreadsheet ikonu)
- Filtreli Excel export API endpoint'i oluşturuldu (`POST /api/excel/export-filtered`)
- Kategori Dağılımı grafiği artık filtrelere göre güncelleniyor (filteredStats)
- Proje, İl, Firma filtreleri Excel export'a tam entegre
- Test sonuçları: Backend %100 (10/10), Frontend %100

### January 25, 2026 - QR Code & Language Support

**P0: Raporlara Özel Bağlantı ve QR Kodu** ✅
- Public rapor görüntüleme sayfası (`/rapor/{rapor_id}`)
- QR kod oluşturma endpoint (`/api/raporlar/public/{id}/qr`)
- Rapor detay modal'ına "Paylaş" butonu eklendi
- Link kopyalama ve QR kod indirme özellikleri
- Public sayfada rapor bilgileri ve medya dosyaları görüntüleme

**P1: TR/EN Dil Desteği** ✅
- `react-i18next` kütüphanesi entegrasyonu
- Türkçe ve İngilizce çeviri dosyaları (`/src/i18n/locales/`)
- Dil seçici bileşeni (`LanguageSelector.js`)
- Login/Register sayfalarında dil seçici (sağ üst köşe)
- Sidebar'da dil seçici
- Menü isimleri çevriliyor (Dashboard, Reports, Settings vb.)
- Dil tercihi localStorage'da saklanıyor

**Bug Fix: Excel Export** ✅
- `/api/excel/export` → `/api/excel/export-all` endpoint düzeltildi

### January 22, 2026 - Çekiliş (Raffle) Feature Integration ✅
**P0 Task: Çekiliş Özelliği Entegrasyonu** ✅
- Added 3 new sub-modules from external repository (`cekilix_local`)

**1. Çekiliş Havuzu (Raffle Pool):**
- Create, view, delete raffles
- Add/remove participants (manual or Excel upload)
- Execute draw with random selection
- Export results to Excel
- Backend: `/api/draws/*` endpoints
- Frontend: `/cekilis`, `/cekilis/olustur`, `/cekilis/{id}`, `/cekilis/{id}/sonuclar`

**2. İngilizce Kelime Havuzu (English Vocabulary Pool):**
- Add, edit, delete vocabulary words
- Fuzzy search with suggestions
- Quiz mode (5 questions, scoring)
- Sentence practice with feedback
- Statistics dashboard
- Backend: `/api/vocabulary/*` endpoints
- Frontend: `/kelime-havuzu`

**3. Zeka Oyunları (Mind Games):**
- "Sayı Okuyucu" (Number Reader) game
- Step-by-step mathematical puzzle
- Interactive UI with progress bar
- Frontend: `/zeka-oyunu`

**Sidebar Navigation Updated:**
- Added "Çekiliş" dropdown menu with purple accent
- Sub-menu items: Çekiliş Havuzu, İngilizce Kelime Havuzu, Zeka Oyunları
- Works on both desktop and mobile

**P1 Task: Bildirim Sistemi Standardizasyonu** ✅
- Added `NotificationModal` import to `Raporlar.js`
- Replaced critical toast notifications with centered modal dialogs
- Modal types: success, error, warning, info
- Modal includes icon, title, message, and "Tamam" button

### January 22, 2026 - Project ZIP Export with Media
**Feature: Proje Bazlı Toplu ZIP İndirme (Medya Dahil)** ✅
- Added new backend endpoint: `GET /api/raporlar/proje-zip-export/{proje_id}`
- Downloads ALL reports and media files for a specific project
- ZIP structure organized by category and report number

**Bug Fix: ProjeRaporlar Edit/Delete Buttons** ✅
- Fixed prop name mismatch in RaporModal
- Edit and Delete buttons work correctly

**Feature: Yeni Rapor with Auto-Fill Project Data** ✅
- "Yeni Rapor" button auto-fills project data

**Feature: Centered Notification Modal** ✅
- Created `NotificationModal` component
- Used in ProjeRaporlar page

### January 22, 2026 - GitHub Synchronization Complete
**P0 Task: GitHub Code Synchronization** ✅
- Synchronized with `https://github.com/ibrahimznr/ekos_local.git`
- Added: Makineler, Cephe İskeleleri, Ayarlar, Kullanıcı Sözleşmesi, Kalibrasyon

### Previously Implemented Features
- Single-session login policy
- Category-based folder structure for ZIP exports
- Project-specific report pages
- Admin Panel fixes
- Image and PDF preview

---

## Prioritized Backlog

### P0 - Critical (None)
All critical tasks completed.

### P1 - High Priority
- [ ] Email verification (full implementation)
- [ ] Notification system full standardization (remaining pages)

### P2 - Medium Priority
- [ ] Database cleanup (duplicate projects from migration)
- [ ] Machine maintenance tracking
- [ ] Operator certification management

### Future Tasks
- [ ] Mobile app optimization
- [ ] Advanced reporting/analytics
- [ ] Multi-language support

---

## API Endpoints

### New Endpoints (Çekiliş Module)
**Draws API:**
- `GET /api/draws` - List all draws
- `POST /api/draws` - Create new draw
- `GET /api/draws/{id}` - Get draw details
- `POST /api/draws/{id}/participants` - Add participant
- `POST /api/draws/{id}/participants/upload` - Upload participants from Excel
- `GET /api/draws/{id}/participants` - List participants
- `DELETE /api/draws/{id}/participants/{pid}` - Delete participant
- `POST /api/draws/{id}/execute` - Execute draw
- `GET /api/draws/{id}/results` - Get results
- `GET /api/draws/{id}/export` - Export results to Excel
- `DELETE /api/draws/{id}` - Delete draw

**Vocabulary API:**
- `GET /api/vocabulary` - List all words
- `POST /api/vocabulary` - Add new word
- `GET /api/vocabulary/{id}` - Get word details
- `PUT /api/vocabulary/{id}` - Update word
- `DELETE /api/vocabulary/{id}` - Delete word
- `GET /api/vocabulary/search?q=` - Search words
- `GET /api/vocabulary/quiz/generate` - Generate quiz
- `POST /api/vocabulary/quiz/submit` - Submit quiz answers
- `POST /api/vocabulary/practice/sentence` - Practice sentence
- `GET /api/vocabulary/statistics` - Get statistics

### Existing Endpoints
- `POST /api/raporlar/zip-export` - Download selected reports as ZIP
- `GET /api/raporlar/proje-zip-export/{proje_id}` - Download project reports with media
- `POST /api/excel/export` - Export reports to Excel
- `POST /api/excel/export-filtered` - Export filtered reports to Excel (Proje, İl, Firma filters)

---

## Test Credentials
- **Admin Email:** ibrahimznrmak@gmail.com
- **Admin Username:** miharbirnz
- **Admin Password:** Szd.dl_34

---

## Test Results (January 25, 2026)
- **Backend Tests:** 100% (10/10 passed for Excel Export with Filters)
- **Frontend Tests:** 100% (all features work correctly)
- Test files: 
  - `/app/backend/tests/test_excel_export.py`
  - `/app/backend/tests/test_cekilis_features.py`

---

## File Structure
```
/app/
├── backend/
│   ├── routers/
│   │   ├── draws.py (NEW - Çekiliş API)
│   │   ├── vocabulary.py (NEW - Kelime API)
│   │   └── ... (existing routers)
│   └── server.py (updated - new routers)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── cekilis/ (NEW)
│   │   │   │   ├── DrawsListPage.js
│   │   │   │   ├── CreateDrawPage.js
│   │   │   │   ├── DrawDetailPage.js
│   │   │   │   ├── DrawResultsPage.js
│   │   │   │   ├── VocabularyPage.js
│   │   │   │   └── MindReaderGame.js
│   │   │   └── ... (existing pages)
│   │   ├── components/
│   │   │   ├── vocabulary/ (NEW)
│   │   │   │   ├── WordList.js
│   │   │   │   ├── AddWordForm.js
│   │   │   │   ├── WordSearch.js
│   │   │   │   ├── QuizMode.js
│   │   │   │   ├── PracticeMode.js
│   │   │   │   └── VocabularyStats.js
│   │   │   ├── Layout.js (updated - Çekiliş menu)
│   │   │   └── NotificationModal.js
│   │   ├── services/
│   │   │   └── vocabularyService.js (NEW)
│   │   └── App.js (updated - new routes)
│   └── package.json
└── memory/
    └── PRD.md
```

---

## February 15, 2026 - Kombinasyonlar Module (Şans Topu Tahmin Üretici)

**Yeni Özellik: Şans Topu Tahmin Üretici** ✅
- Sidebar'a "Kombinasyonlar" dropdown menüsü eklendi (Çekiliş altına)
- `/sans-topu-tahmin` sayfası oluşturuldu
- Rastgele kombinasyon üretme sistemi (1 milyon adet)
- **Görsel Kombinasyon Filtreleme Paneli:**
  - Ana Sayılar (1-34): Grid formatında, max 5 seçim, yeşil vurgu
  - Artı Top (1-14): Grid formatında, max 1 seçim (opsiyonel), turuncu vurgu
  - Yeşil "Filtrele" ve "Temizle" butonları
  - Bonus seçilmezse tüm bonus değerleri (1-14) ile arama
- Örnek tahminler tablosu (5 rastgele kombinasyon)
- Excel export özelliği (maks 100.000 satır)
- Şans Topu kuralları bilgi kutusu

**API Endpoints:**
- `GET /api/kombinasyonlar/stats` - Toplam kombinasyon sayısı
- `POST /api/kombinasyonlar/generate` - Yeni kombinasyonlar üret
- `POST /api/kombinasyonlar/clear` - Önbelleği temizle
- `POST /api/kombinasyonlar/filter` - Görsel filtre ile arama (yeni)
- `POST /api/kombinasyonlar/search` - Metin formatı ile arama
- `GET /api/kombinasyonlar/sample` - Rastgele örnekler
- `GET /api/kombinasyonlar/export-excel` - Excel export

**Test Sonuçları:**
- Backend: %100 (21/21 test geçti)
- Frontend: %100 (tüm özellikler çalışıyor)
- Test dosyası: `/app/backend/tests/test_kombinasyonlar.py`

---

## March 16, 2026 - CAD Viewer Module

**Yeni Özellik: CAD Görüntüleyici** ✅
- Sidebar'a "CAD Görüntüleyici" menü öğesi eklendi
- `/cad-viewer` sayfası oluşturuldu
- DXF dosya parsing (ezdxf kütüphanesi)
- SVG tabanlı render engine
- Dark mode CAD görünümü

**Desteklenen Geometrik Öğeler:**
- LINE (Çizgi)
- CIRCLE (Daire)
- ARC (Yay)
- LWPOLYLINE/POLYLINE (Çoklu çizgi)
- SPLINE (Eğri)
- TEXT/MTEXT (Metin)

**Özellikler:**
- Zoom In/Out (mouse wheel + butonlar)
- Pan (sürükle-bırak)
- Grid görünümü toggle
- Katman kontrolü (visibility toggle)
- Tam ekran modu
- Kayıtlı dosyalar listesi
- AutoCAD renk indeksi desteği

**API Endpoints:**
- `POST /api/cad/parse` - DXF dosyasını parse et
- `POST /api/cad/upload` - CAD dosyasını kaydet
- `GET /api/cad/files` - Kayıtlı dosyaları listele
- `GET /api/cad/file/{id}` - Dosya detayı ve içeriği
- `DELETE /api/cad/file/{id}` - Dosya sil

**MongoDB Collection:**
- `cad_files`: { id, filename, file_path, upload_date, entity_count, layers, related_project_id, related_report_id }

---

## Prioritized Backlog

### P0 (Critical)
- [x] ~~Şans Topu Tahmin Üretici~~ (TAMAMLANDI)

### P1 (High Priority)  
- [ ] Veri tutarsızlığı hatası - Dashboard filtreleme sayısı backend ile uyumsuz
- [ ] Bildirim sistemini standartlaştırma (eski sonner toast'ları kaldırma)

### P2 (Medium Priority)
- [ ] Uluslararasılaştırma (TR/EN) - i18n framework mevcut ama metinler Türkçe hardcoded
- [ ] Veritabanı temizliği (tekrarlanan proje kayıtları)

### P3 (Low Priority)
- [ ] Medya dosyaları migrasyonu
