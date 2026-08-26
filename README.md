# 🎮 DUSTFX — GPU Display & DCCW Gamma Optimizer

> **Yüksek Performanslı GPU Ekran Filtreleme, DCCW Gama Boost, Digital Vibrance, PvP Özel Nişangah & GitHub Otomatik Güncelleme Takip Sistemi**

[![Release](https://img.shields.io/badge/Release-v1.2.1-brightgreen?style=for-the-badge&logo=windows)](https://github.com/Dust-exe/DustFX/releases)
[![Tech](https://img.shields.io/badge/C%2B%2B20-React%20%2F%20Tailwind-purple?style=for-the-badge)](https://dust-studio.com)
[![Status](https://img.shields.io/badge/DirectX%20%2F%20NVAPI-Zero--Lag-fuchsia?style=for-the-badge)](https://dust-studio.com)

---

## ✨ Temel Özellikler

### 1. ⚡ Donanım Seviyesi GPU & DCCW Gama Kontrolü
- **DCCW Gama Boost (0.5x - 3.0x):** Windows GDI GammaRamp ve donanım renk rampaları ile gecikmesiz gece aydınlatması.
- **Gelişmiş CAS Keskinleştirme (Unsharp LUT):** Düşman silüetlerini ve uzaktaki hedefleri belirginleştiren çok bantlı keskinleştirme filtresi.
- **Gölge Detay Kurtarma (Toe Curve):** Karanlık mağara ve tünellerde karanlık alan detaylarını açığa çıkarma.
- **Kelvin Renk Sıcaklığı (2700K - 10000K):** Gece göz yorgunluğunu önleyen sıcak filtre veya rekabetçi soğuk mavi ayarı.
- **Digital Vibrance (%0 - %100):** Donanım seviyesinde renk canlılığı.
- **RGB Bağımsız Kanalları:** Kırmızı, Yeşil ve Mavi renk kanallarını ayrı ayrı kalibre edebilme.

### 2. 🎯 PvP Özel Nişangah (Crosshair Overlay)
- Ekranın tam merkezine harici, saydam ve FPS düşürmeyen donanım nişangahı (`Alt + Z`).
- Nokta, Artı (+), Daire (O) ve Açık Artı stilleri.
- 6 farklı neon renk seçeneği ve dinamik boyut ayarı.

### 3. 🤖 Akıllı Oyun Algılama & Alt+Tab Sıfırlama
- Rekabetçi oyunlar ve 3D uygulamalar açıldığında profilin otomatik devreye girmesi.
- Masaüstüne dönüldüğünde (Alt+Tab) veya oyundan çıkıldığında ayarları otomatik olarak varsayılan Windows değerlerine çekme (göz yorgunluğunu önler).

### 4. 🌙 Hazır Ekran Profilleri & Topluluk Paylaşımı
- **🌙 Gece Görüşü Boost:** Karanlık haritalarda, gece operasyonlarında ve binaların içini aydınlatır.
- **🕳️ Mağara Parlatıcı Modu:** Maksimum gama (2.5x) ve gölge detayı.
- **🎯 PVP Netlik & Kontrast:** Rekabetçi oyunlar için düşman silüeti keskinleştirici.
- **☀️ Gündüz Canlılık Modu:** Sinematik %80 renk doygunluğu.
- **👁️ Göz Dinlendirme Modu:** Mavi ışık kıran sıcak gece filtresi.
- **Topluluk İçe/Dışa Aktarma:** Tek tıkla JSON formatında profil paylaşma.

### 5. 🔄 GitHub Otomatik Güncelleme Takibi
- Arka planda GitHub Releases API (`Dust-exe/DustFX`) üzerinden otomatik versiyon kontrolü.
- Yeni sürüm yayınlandığında arayüzde ve oyun içi OSD bildiriminde anında uyarı.
- Tek tıkla doğrudan `.exe` indirme ve sürüm notlarını inceleme.

### 6. 🖥️ Çoklu Monitör Bağımsız Yönetimi
- Tüm monitörleri senkronize yönetme veya yalnızca ana oyun monitörüne uygulama seçeneği.

---

## ⌨️ Tuş Atamaları (Default Hotkeys)

| Tuş | Eylem | Açıklama |
|---|---|---|
| **F11** | MAX DCCW GAMA | Anında 2.5x Gama Boost uygular / kapatır |
| **F12** | Vibrance Toggle | %75 Canlılık açar / kapatır |
| **F10** | Hızlı Sıfırla | Varsayılan Windows renk ayarlarına döner |
| **Alt + Z** | Crosshair Toggle | PvP Nişangahını açar / kapatır |
| **Alt + X** | DustFX HUD | Oyun içi OSD durum bildirimini gösterir |

---

## 🏗️ Mimari & Proje Yapısı

```
DustFX/
├── CMakeLists.txt              # C++20 Derleme Yapılandırması
├── src/
│   ├── main.cpp                # WinMain, System Tray & Edge App Host
│   ├── core/
│   │   ├── common.h            # Veri modelleri & Tanımlar
│   │   ├── app/                # DustFxApp ana yaşam döngüsü
│   │   ├── gpu/                # Donanım GPU & GDI Gama kontrolcüsü
│   │   ├── display/            # Monitör tarama & multi-display
│   │   ├── profile/            # Profil yöneticisi & JSON sync
│   │   ├── hotkey/             # Global asenkron hotkey dinleyicisi
│   │   ├── process/            # Oyun algılama & foreground hook
│   │   ├── config/             # Ayar dosyası yöneticisi
│   │   └── updater/            # GitHub Releases auto-updater
│   ├── overlay/                # Oyun içi OSD & Toast bildirimleri
│   └── server/                 # Gömülü HTTP UI Server (Port 19840)
└── web/                        # React + TypeScript + Vite + Tailwind UI
    ├── src/
    │   ├── App.tsx             # Ana Glassmorphism Panel
    │   ├── api.ts              # Backend REST API istemcisi
    │   └── components/         # Sliderlar, Profiller, Monitör, Hotkeys, Güncelleme
    └── dist/                   # Derlenmiş üretim web varlıkları
```

---

## 🚀 Derleme & Çalıştırma

### C++ Native Uygulama Derleme:
```bash
cmake -B build -S .
cmake --build build --config Release
```

### Web Arayüzü Geliştirme:
```bash
cd web
npm install
npm run build
```

---

<sub>Engineered by **dust.exe** • [dust-studio.com](https://dust-studio.com/)</sub>
