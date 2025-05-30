# Kapsamlı KYS Meta-Prompt Yapı Tasarımı

Bu doküman, Kalite Yönetim Sistemi (KYS) oluşturmak için kullanılacak olan kapsamlı meta-prompt'un yapısal tasarımını ana hatlarıyla belirtmektedir. Amaç, tüm gereksinimleri, senaryoları, görev tanımlarını, diyagramları ve veritabanı yapısını mantıksal ve organize bir şekilde sunacak bir şablon oluşturmaktır.

## Meta-Prompt Ana Bölümleri

Meta-prompt aşağıdaki ana bölümlerden oluşacaktır:

**Bölüm 0: Giriş ve Amaç**
*   0.1. Bu Meta-Prompt'un Amacı
*   0.2. Oluşturulacak Kalite Yönetim Sistemi'nin (KYS) Genel Hedefleri
*   0.3. Teknoloji Bağımsız Yaklaşım ve Beklentiler

**Bölüm 1: Genel Sistem Mimarisi (Kavramsal)**
*   1.1. Sistemin Yüksek Seviye Bileşenleri (Örn: Kullanıcı Arayüzü, İş Mantığı Katmanı, Veri Erişim Katmanı, Veritabanı)
*   1.2. Modüler Yapı ve Entegrasyon Felsefesi
*   1.3. Temel Kullanıcı Rolleri ve Genel Yetkilendirme Yaklaşımı

**Bölüm 2: KYS Temel Modülleri**

Bu bölüm, `kys_requirements_analysis.md` dosyasında detaylandırılan her bir KYS modülünü ayrı alt bölümler halinde ele alacaktır. Her modül için standart bir yapı izlenecektir:

*   **2.X. [Modül Adı]** (Örn: 2.1. Doküman Yönetimi)
    *   2.X.1. Amaç ve Kapsam
    *   2.X.2. Temel Özellikler ve Fonksiyonlar (Detaylı kullanıcı senaryoları ve görev tanımları ile)
        *   *Senaryo 1: [Senaryo Açıklaması]*
        *   *Görev Tanımı: [Kullanıcı Rolü] - [Görev Açıklaması]*
    *   2.X.3. Süreç Akış Diyagramı (Bkz. Bölüm 3.X - [İlgili Diyagram Numarası])
    *   2.X.4. Veri Gereksinimleri (Bu modüle özgü temel veri girişleri, çıkışları ve önemli alanlar)
    *   2.X.5. Diğer Modüllerle Entegrasyon Noktaları
    *   2.X.6. Yapay Zeka (AI) Asistanı Entegrasyon Senaryoları (Varsa)
    *   2.X.7. Çevrimdışı (Offline) Çalışma Gereksinimleri (Varsa)

*   *Kapsanacak Modüller (kys_requirements_analysis.md referans alınarak):*
    *   2.1. Doküman Yönetimi (Kontrollü Dokümanlar)
    *   2.2. Kayıt Yönetimi
    *   2.3. Düzeltici ve Önleyici Faaliyetler (DÖF / CAPA)
    *   2.4. İç Denetim Yönetimi
    *   2.5. Yönetimin Gözden Geçirmesi (YGG)
    *   2.6. Risk ve Fırsat Yönetimi
    *   2.7. Eğitim ve Yetkinlik Yönetimi
    *   2.8. Müşteri İlişkileri Yönetimi (Şikayetler ve Geri Bildirimler)
    *   2.9. Tedarikçi Yönetimi ve Değerlendirme
    *   2.10. Kalibrasyon ve Bakım Yönetimi (Ekipman Yönetimi)
    *   2.11. Ürün/Hizmet Gerçekleştirme ve Kontrolü
    *   2.12. Sürekli İyileştirme Yönetimi
    *   2.13. Bildirimler ve Görev Yönetimi
    *   2.14. Raporlama ve Analiz
    *   2.15. Kullanıcı Yönetimi ve Yetkilendirme
    *   2.16. Yapay Zeka (AI) Asistanı Entegrasyonu (Genel ve modül bazlı)

**Bölüm 3: Süreç Akış Diyagramları**
*   3.1. Giriş (Diyagramların nasıl okunacağına dair kısa bir rehber)
*   3.2. Doküman Oluşturma, Onay ve Yayınlama Süreci Diyagramı
*   3.3. DÖF Yönetimi Süreci Diyagramı
*   3.4. İç Denetim Süreci Diyagramı
*   3.5. Müşteri Şikayeti Ele Alma Süreci Diyagramı
*   3.6. Kalibrasyon Takip Süreci Diyagramı
*   3.7. Periyodik Bakım Süreci Diyagramı
*   ... (kys_requirements_analysis.md'de listelenen diğer tüm süreçler için ayrı diyagramlar)
*   *Not: Her diyagram net, anlaşılır ve standart bir notasyon (örn: BPMN temelleri) kullanılarak oluşturulacaktır.*

**Bölüm 4: Detaylı Veritabanı Yapısı ve Şeması**
*   4.1. Veritabanı Tasarım Felsefesi (Normalizasyon, ilişki türleri vb.)
*   4.2. Varlık-İlişki Diyagramı (ERD - Genel Bakış)
*   4.3. Tablo Şemaları (Her tablo için detaylı açıklama):
    *   **Tablo Adı: [Tablo_Adı]**
        *   Açıklama: [Tablonun amacı]
        *   Sütunlar:
            *   `sutun_adi` (Veri Tipi, Kısıtlamalar (PK, FK, Not Null, Unique), Açıklama)
            *   Örnek: `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz Tanımlayıcı)
            *   Örnek: `dokuman_basligi` (VARCHAR(255), NOT NULL, Dokümanın başlığı)
            *   Örnek: `olusturma_tarihi` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP, Kaydın oluşturulma zamanı)
            *   Örnek: `kullanici_id` (INTEGER, FOREIGN KEY (Kullanicilar.id), Kaydı oluşturan kullanıcı)
        *   İndeksler: (Varsa önemli indeksler ve nedenleri)
        *   İlişkiler: (Diğer tablolarla olan ilişkilerin açıklaması)
*   *kys_requirements_analysis.md Bölüm 4'te listelenen tüm temel varlıklar için tablo şemaları burada detaylandırılacaktır.*

**Bölüm 5: Fonksiyonel Olmayan Gereksinimler (Genel İlkeler)**
*   5.1. Performans Beklentileri (Genel)
*   5.2. Güvenlik İlkeleri (Veri güvenliği, yetkilendirme, loglama)
*   5.3. Kullanılabilirlik (Arayüz basitliği, erişilebilirlik standartları)
*   5.4. Ölçeklenebilirlik (Gelecekteki büyümeye adaptasyon)
*   5.5. Çevrimdışı (Offline) Çalışma Yetenekleri (Genel yaklaşım)
*   5.6. Veri Bütünlüğü ve Tutarlılığı

**Bölüm 6: Terimler Sözlüğü**
*   KYS ve bu prompt'ta kullanılan özel terimlerin ve kısaltmaların açıklamaları.

**Bölüm 7: Sonuç ve Beklenen Çıktılar**
*   Bu meta-prompt'u kullanarak bir KYS geliştirecek olan yapay zeka veya geliştiriciden beklenen temel çıktılar (örn: çalışan bir yazılım, kaynak kodu, test senaryoları, teknik dokümantasyon - bu kısım prompt'un hedefine göre ayarlanabilir).

Bu yapı, meta-prompt'un hem kapsamlı hem de anlaşılır olmasını sağlayacak ve KYS'nin başarılı bir şekilde geliştirilmesi için gerekli tüm bilgileri içerecektir.

