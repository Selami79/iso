## Bölüm 3: Süreç Akış Diyagramları

Bu bölümde, Kalite Yönetim Sistemi (KYS) içerisindeki temel süreçlerin akış diyagramları metin tabanlı (Mermaid.js formatında) olarak sunulmuştur. Bu diyagramlar, süreç adımlarını, karar noktalarını ve farklı roller arasındaki etkileşimleri görselleştirmeyi amaçlar.

### 3.1. Giriş (Diyagramların Nasıl Okunacağına Dair Kısa Bir Rehber)

Mermaid.js formatındaki diyagramlar, metin tabanlı tanımlamalardan otomatik olarak akış şemaları oluşturur. Temel elemanlar şunlardır:
*   `graph TD` veya `graph LR`: Diyagramın yönünü belirtir (TD: Üstten Alta, LR: Soldan Sağa).
*   `A[Metin]`: Dikdörtgen bir süreç adımını temsil eder.
*   `B{Karar Metni}`: Baklava dilimi şeklinde bir karar noktasını temsil eder.
*   `C(Başlangıç/Bitiş)`: Yuvarlak köşeli dikdörtgen bir başlangıç veya bitiş noktasını temsil eder.
*   `-->`: İki adım arasındaki bağlantıyı gösterir.
*   `-- Metin -->`: Üzerinde açıklama olan bir bağlantıyı gösterir.

### 3.2. Doküman Oluşturma, Onay ve Yayınlama Süreci Diyagramı

```mermaid
graph TD
    A[Doküman İhtiyacı Belirlenir] --> B(Yeni Doküman Talebi Oluşturulur);
    B --> C{Doküman Türü Seçilir Prosedür/Talimat/Form vb.};
    C -- Prosedür/Talimat --> D[İlgili Departman Sorumlusu Taslak Hazırlar];
    C -- Form --> E[Form Tasarımı Yapılır];
    D --> F[Taslak Doküman Sisteme Yüklenir];
    E --> F;
    F --> G{Onay Akışı Başlatılır};
    G --> H[İlk Seviye Onaycı İnceler];
    H -- Onaylamaz --> I[Revizyon İçin Geri Gönderilir];
    I --> D;
    H -- Onaylar --> J[İkinci Seviye Onaycı (Kalite Yöneticisi) İnceler];
    J -- Onaylamaz --> I;
    J -- Onaylar --> K[Doküman Yayınlanır];
    K --> L[İlgili Personele Duyurulur/Dağıtılır];
    L --> M(Süreç Tamamlanır);
    M --> N[Periyodik Gözden Geçirme Tarihi Belirlenir];
```




### 3.3. DÖF Yönetimi Süreci Diyagramı (CAPA Management)

```mermaid
graph TD
    A[Uygunsuzluk Tespit Edilir/Bildirilir] --> B(DÖF Kaydı Oluşturulur);
    B --> C{Uygunsuzluk Türü Belirlenir Düzeltici/Önleyici?};
    C -- Düzeltici --> D[Acil Düzeltme Faaliyeti Gerekli mi?];
    D -- Evet --> E[Acil Düzeltme Uygulanır ve Kaydedilir];
    E --> F[Kök Neden Analizi Yapılır];
    D -- Hayır --> F;
    C -- Önleyici --> G[Potansiyel Uygunsuzluk/Risk Analizi Yapılır];
    G --> F;
    F --> H[Düzeltici/Önleyici Faaliyetler Planlanır];
    H --> I[Sorumlular Atanır ve Termin Tarihi Belirlenir];
    I --> J[Faaliyetler Uygulanır];
    J --> K{Faaliyetler Tamamlandı mı?};
    K -- Hayır --> J;
    K -- Evet --> L[Uygulanan Faaliyetlerin Etkinliği Doğrulanır];
    L -- Etkin Değil --> F;
    L -- Etkin --> M[DÖF Kaydı Kapatılır];
    M --> N(Süreç Tamamlanır);
```

### 3.4. İç Denetim Süreci Diyagramı

```mermaid
graph TD
    A[Yıllık Denetim Programı Oluşturulur] --> B(Denetim Planı Hazırlanır Kapsam, Kriter, Ekip);
    B --> C[Denetim Soru Listeleri (Checklist) Hazırlanır/Seçilir];
    C --> D[Açılış Toplantısı Yapılır];
    D --> E[Denetim Gerçekleştirilir Saha İncelemesi, Görüşmeler, Kayıt Kontrolü];
    E --> F{Bulgu Tespit Edildi mi? Uygunsuzluk/Gözlem};
    F -- Evet --> G[Bulgular Kaydedilir ve Sınıflandırılır];
    G --> H[Kapanış Toplantısı Yapılır Bulgular Sunulur];
    F -- Hayır --> H;
    H --> I[Denetim Raporu Hazırlanır ve Dağıtılır];
    I --> J{Uygunsuzluk Var mı?};
    J -- Evet --> K[İlgili Uygunsuzluklar İçin DÖF Süreci Başlatılır Bkz. 3.3];
    K --> L[Takip Denetimi Planlanır Gerekirse];
    L --> M(Süreç Tamamlanır);
    J -- Hayır --> M;
```

### 3.5. Müşteri Şikayeti Ele Alma Süreci Diyagramı

```mermaid
graph TD
    A[Müşteri Şikayeti Alınır Çeşitli Kanallar];
    A --> B(Şikayet Kaydı Oluşturulur);
    B --> C{Şikayet Detayları Yeterli mi?};
    C -- Hayır --> D[Müşteriden Ek Bilgi İstenir];
    D --> C;
    C -- Evet --> E[Şikayet Sınıflandırılır ve Önceliklendirilir];
    E --> F[İlgili Departmana/Kişiye Atanır];
    F --> G[Şikayet İncelenir ve Kök Neden Araştırılır];
    G --> H{Acil Çözüm/Geçici Önlem Gerekli mi?};
    H -- Evet --> I[Acil Çözüm Uygulanır];
    I --> J[Kalıcı Çözüm İçin Düzeltici Faaliyet Planlanır Bkz. 3.3];
    H -- Hayır --> J;
    J --> K[Müşteriye Çözüm ve Yapılanlar Hakkında Bilgi Verilir];
    K --> L{Müşteri Tatmin Oldu mu?};
    L -- Hayır --> G;
    L -- Evet --> M[Şikayet Kaydı Kapatılır];
    M --> N(Süreç Tamamlanır);
```



### 3.6. Kalibrasyon Takip Süreci Diyagramı

```mermaid
graph TD
    A[Ölçüm Ekipmanı Envantere Eklenir/Güncellenir] --> B(Kalibrasyon İhtiyacı Belirlenir);
    B --> C{Kalibrasyon Periyodu Tanımlı mı?};
    C -- Hayır --> D[Ekipman İçin Kalibrasyon Periyodu Belirlenir];
    D --> E[Kalibrasyon Planına Eklenir];
    C -- Evet --> E;
    E --> F[Yaklaşan Kalibrasyon Tarihi İçin Hatırlatma Oluşur];
    F --> G{Kalibrasyon Zamanı Geldi mi?};
    G -- Hayır --> F;
    G -- Evet --> H[Kalibrasyon Gerçekleştirilir İç/Dış Kaynak];
    H --> I[Kalibrasyon Sonuçları Kaydedilir Sertifika, Değerler];
    I --> J{Kalibrasyon Sonucu Uygun mu?};
    J -- Hayır --> K[Uygun Olmayan Ekipman Yönetimi Süreci Başlatılır Tamir, Ayar, Kullanım Dışı];
    K --> H; 
    J -- Evet --> L[Ekipman Etiketlenir ve Kullanıma Alınır];
    L --> M[Sonraki Kalibrasyon Tarihi Güncellenir];
    M --> N(Süreç Tamamlanır);
```

### 3.7. Periyodik Bakım Süreci Diyagramı

```mermaid
graph TD
    A[Ekipman Envantere Eklenir/Güncellenir] --> B(Periyodik Bakım İhtiyacı Belirlenir);
    B --> C[Bakım Planı Oluşturulur Frekans, Yapılacak İşler, Sorumlu];
    C --> D[Yaklaşan Bakım Tarihi İçin Hatırlatma Oluşur];
    D --> E{Bakım Zamanı Geldi mi?};
    E -- Hayır --> D;
    E -- Evet --> F[Periyodik Bakım Gerçekleştirilir];
    F --> G[Bakım Kayıtları Tutulur Yapılan İşler, Kullanılan Malzeme, Süre];
    G --> H[Sonraki Bakım Tarihi Güncellenir];
    H --> I(Süreç Tamamlanır);
    J[Arıza Oluşur] --> K(Arıza Bakım Talebi Oluşturulur);
    K --> L[Arıza Analiz Edilir ve Bakım Planlanır];
    L --> F;
```

### 3.8. Eğitim Yönetimi Süreci Diyagramı

```mermaid
graph TD
    A[Pozisyon İçin Yetkinlik İhtiyaçları Belirlenir] --> B(Personelin Mevcut Yetkinlikleri Değerlendirilir);
    B --> C{Eğitim İhtiyacı Var mı?};
    C -- Hayır --> D(Süreç Tamamlanır);
    C -- Evet --> E[Eğitim İhtiyacı Tanımlanır];
    E --> F[Uygun Eğitim Programı Araştırılır/Planlanır İç/Dış Kaynaklı];
    F --> G[Eğitim Organize Edilir ve Personele Duyurulur];
    G --> H[Personel Eğitime Katılır];
    H --> I[Eğitim Tamamlanır ve Değerlendirilir Sınav, Proje vb.];
    I --> J{Eğitim Başarılı mı?};
    J -- Hayır --> E; 
    J -- Evet --> K[Eğitim Kayıtları Sisteme Girilir Sertifika, Tarih];
    K --> L[Eğitimin Etkinliği Belirli Aralıklarla Değerlendirilir];
    L --> D;
```

### 3.9. Tedarikçi Değerlendirme Süreci Diyagramı

```mermaid
graph TD
    A[Yeni Tedarikçi İhtiyacı Ortaya Çıkar] --> B(Potansiyel Tedarikçiler Belirlenir);
    B --> C[Ön Değerlendirme Kriterleri Uygulanır];
    C --> D{Tedarikçi Ön Değerlendirmeyi Geçti mi?};
    D -- Hayır --> B;
    D -- Evet --> E[Tedarikçi Onaylı Listeye Eklenir/Aday Olur];
    E --> F[Tedarikçiden Ürün/Hizmet Alımı Yapılır];
    F --> G[Performans Kriterleri Belirlenir Kalite, Teslimat, Fiyat vb.];
    G --> H[Periyodik Olarak Tedarikçi Performansı İzlenir ve Kaydedilir];
    H --> I{Değerlendirme Zamanı Geldi mi?};
    I -- Hayır --> H;
    I -- Evet --> J[Tedarikçi Değerlendirme Formu Doldurulur/Puanlanır];
    J --> K{Performans Yeterli mi?};
    K -- Hayır --> L[Düzeltici Faaliyet Talep Edilir/Tedarikçi Statüsü Gözden Geçirilir];
    L --> M(Süreç Tamamlanır);
    K -- Evet --> M;
```

### 3.10. Risk Değerlendirme ve İşleme Süreci Diyagramı

```mermaid
graph TD
    A[Risk Değerlendirme Kapsamı Belirlenir Süreç/Proje/Departman] --> B(Potansiyel Riskler ve Fırsatlar Tanımlanır);
    B --> C[Her Risk İçin Olasılık ve Etki Değerlendirilir];
    C --> D[Risk Seviyesi Hesaplanır Risk Matrisi];
    D --> E{Risk Kabul Edilebilir Seviyede mi?};
    E -- Evet --> F(Risk İzlemeye Alınır);
    F --> G[Periyodik Gözden Geçirme];
    G --> B;
    E -- Hayır --> H[Risk İşleme Seçenekleri Değerlendirilir Azalt, Transfer Et, Kaçın];
    H --> I[Risk İşleme Planı Oluşturulur Faaliyetler, Sorumlular, Terminler];
    I --> J[Risk İşleme Faaliyetleri Uygulanır];
    J --> K[Kalan Risk Seviyesi Değerlendirilir];
    K --> E;
    L[Fırsatlar Değerlendirilir] --> M[Fırsatları Ele Alma Planı Oluşturulur];
    M --> N[Uygulama ve İzleme];
    N --> G;
```

### 3.11. Yönetimin Gözden Geçirmesi (YGG) Süreci Diyagramı

```mermaid
graph TD
    A[YGG Toplantı Periyodu Belirlenir Yıllık/6 Aylık vb.] --> B(YGG Toplantısı Planlanır Tarih, Gündem, Katılımcılar);
    B --> C[YGG Girdileri Toplanır Denetim Sonuçları, DÖF Durumu, Müşteri Geri Bildirimleri, Süreç Performansı, Hedefler vb.];
    C --> D[Toplanan Girdiler Katılımcılara Önceden Dağıtılır];
    D --> E[YGG Toplantısı Gerçekleştirilir];
    E --> F[Gündem Maddeleri Görüşülür ve Değerlendirilir];
    F --> G[KYSnin Uygunluğu, Yeterliliği ve Etkinliği Değerlendirilir];
    G --> H[İyileştirme Fırsatları ve Kaynak İhtiyaçları Belirlenir];
    H --> I[Kararlar Alınır ve Sorumlular Atanır];
    I --> J[YGG Toplantı Tutanağı Hazırlanır ve Dağıtılır];
    J --> K[Alınan Kararların Uygulanması Takip Edilir];
    K --> L(Süreç Tamamlanır);
```

