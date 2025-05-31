# Kalite Yönetim Sistemi (KYS) Gereksinim Analizi

Bu doküman, kapsamlı bir Kalite Yönetim Sistemi (KYS) oluşturmak için gereken temel gereksinimleri, bileşenleri, süreçleri ve veri yapılarını analiz etmektedir. Amaç, teknoloji bağımsız bir meta-prompt oluşturmak için temel oluşturmaktır.

## 1. Genel KYS Kavramları ve Amaçları

Bir Kalite Yönetim Sistemi (KYS), bir kuruluşun müşteri ve yasal gereklilikleri tutarlı bir şekilde karşılayan ürün veya hizmetleri sunma yeteneğini yönetmek ve sürekli iyileştirmek için tasarlanmış resmi bir sistemdir. Temel amaçları şunlardır:

*   Müşteri memnuniyetini artırmak
*   Süreçleri standartlaştırmak ve verimliliği artırmak
*   Hataları ve israfı azaltmak
*   Yasal ve düzenleyici gerekliliklere uyumu sağlamak
*   Sürekli iyileştirme kültürünü teşvik etmek
*   Risk bazlı düşünmeyi entegre etmek

## 2. Temel KYS Standartları (Referans: ISO 9001)

ISO 9001, en yaygın kullanılan KYS standardıdır ve aşağıdaki ana prensiplere dayanır:

*   Müşteri odaklılık
*   Liderlik
*   İnsanların katılımı
*   Proses yaklaşımı
*   İyileştirme
*   Kanıta dayalı karar verme
*   İlişki yönetimi

## 3. Kapsamlı Bir KYS'nin Temel Modülleri ve Fonksiyonları

Kullanıcının "bütün senaryolar, görev tanımları" talebi doğrultusunda, modern ve kapsamlı bir KYS için aşağıdaki modüller ve fonksiyonlar dikkate alınmalıdır:



### 3.1. Doküman Yönetimi (Kontrollü Dokümanlar)
*   **Amaç:** KYS ile ilgili tüm dokümanların (politikalar, prosedürler, talimatlar, formlar, kayıtlar, dış kaynaklı dokümanlar vb.) kontrollü bir şekilde oluşturulmasını, gözden geçirilmesini, onaylanmasını, dağıtılmasını, güncellenmesini ve arşivlenmesini sağlamak.
*   **Temel Fonksiyonlar:**
    *   Doküman Oluşturma ve Şablonlar: Farklı doküman türleri için standart şablonlar.
    *   Versiyon Kontrolü: Her dokümanın revizyon geçmişinin takibi, eski versiyonlara erişim.
    *   Onay Akışları: Dokümanların yayınlanmadan önce yetkili kişiler tarafından elektronik olarak gözden geçirilmesi ve onaylanması için yapılandırılabilir iş akışları.
    *   Dağıtım ve Erişim Kontrolü: Dokümanların ilgili kişilere/departmanlara kontrollü dağıtımı, rol bazlı erişim izinleri.
    *   Periyodik Gözden Geçirme ve Güncelleme: Dokümanların geçerliliğini koruması için periyodik gözden geçirme hatırlatıcıları ve süreçleri.
    *   Arşivleme ve İmha: Geçerliliğini yitirmiş dokümanların güvenli bir şekilde arşivlenmesi veya imha edilmesi.
    *   Arama ve Filtreleme: Dokümanlara kolay erişim için gelişmiş arama ve filtreleme özellikleri.
    *   Değişiklik Talepleri: Dokümanlarda değişiklik yapılması için resmi talep süreci.
    *   Dış Kaynaklı Doküman Yönetimi: Standartlar, yasal düzenlemeler gibi dış kaynaklı dokümanların takibi.

### 3.2. Kayıt Yönetimi
*   **Amaç:** KYS'nin etkin bir şekilde uygulandığını ve uygunluğun sağlandığını gösteren kanıtların (kayıtların) oluşturulması, saklanması, korunması, erişilmesi ve imha edilmesi.
*   **Temel Fonksiyonlar:**
    *   Kayıt Tanımlama: Hangi kayıtların tutulacağı, saklama süreleri, sorumluları.
    *   Kayıt Oluşturma: Formlar aracılığıyla veya süreçler sırasında otomatik olarak kayıt oluşturma.
    *   Saklama ve Koruma: Kayıtların kaybolmaya, hasara veya yetkisiz erişime karşı korunması.
    *   Erişim ve Geri Alma: Yetkili kişilerin kayıtlara kolayca erişebilmesi.
    *   İmha: Saklama süresi dolan kayıtların güvenli bir şekilde imha edilmesi.

### 3.3. Düzeltici ve Önleyici Faaliyetler (DÖF / CAPA)
*   **Amaç:** Tespit edilen uygunsuzlukların (veya potansiyel uygunsuzlukların) temel nedenlerini ortadan kaldırmak, tekrarlanmasını (veya oluşmasını) önlemek ve sürekli iyileştirmeyi sağlamak.
*   **Temel Fonksiyonlar:**
    *   Uygunsuzluk Bildirimi: İç/dış denetim bulguları, müşteri şikayetleri, süreç hataları, ürün/hizmet hataları gibi kaynaklardan uygunsuzlukların kaydedilmesi.
    *   Acil Düzeltme Faaliyetleri: Uygunsuzluğun etkilerini hemen gidermek için yapılan ilk müdahaleler.
    *   Kök Neden Analizi: Uygunsuzluğun temel nedenlerini belirlemek için araçlar (5 Neden, Balık Kılçığı vb. entegrasyonu veya manuel giriş).
    *   Düzeltici Faaliyet Planlama ve Uygulama: Kök nedeni ortadan kaldırmak için faaliyetlerin planlanması, sorumluların atanması, termin tarihlerinin belirlenmesi ve uygulanması.
    *   Önleyici Faaliyet Planlama ve Uygulama: Potansiyel uygunsuzlukları ve riskleri analiz ederek oluşmalarını önleyici faaliyetler.
    *   Takip ve Doğrulama: Uygulanan DÖF'lerin etkinliğinin belirli bir süre sonra doğrulanması.
    *   Kapatma: Etkinliği doğrulanan DÖF kayıtlarının kapatılması.
    *   Raporlama: DÖF istatistikleri, açık/kapalı kayıtlar, geciken görevler.

### 3.4. İç Denetim Yönetimi
*   **Amaç:** KYS'nin planlanan düzenlemelere, standart şartlarına ve kuruluşun kendi belirlediği şartlara uygun olup olmadığını ve etkin bir şekilde uygulanıp sürdürülmediğini doğrulamak.
*   **Temel Fonksiyonlar:**
    *   Yıllık Denetim Programı Oluşturma: Risk bazlı yaklaşımla denetlenecek süreçlerin, denetim tarihlerinin ve denetçilerin planlanması.
    *   Denetim Planı Hazırlama: Her bir denetim için kapsam, amaç, kriterler, denetim ekibi, denetim takvimi.
    *   Denetim Soru Listeleri (Checklist): Denetim sırasında kullanılacak standart soru listeleri oluşturma ve yönetme.
    *   Denetim Gerçekleştirme ve Bulguların Kaydedilmesi: Denetimlerin yapılması, kanıtların toplanması, uygunsuzlukların, gözlemlerin ve iyileştirme fırsatlarının kaydedilmesi.
    *   Denetim Raporu Oluşturma: Denetim sonuçlarını özetleyen raporların hazırlanması.
    *   Bulguların DÖF Modülüne Aktarılması: Tespit edilen uygunsuzluklar için DÖF süreci başlatma.
    *   Takip Denetimleri: Uygulanan düzeltici faaliyetlerin etkinliğini doğrulamak için takip denetimleri planlama ve gerçekleştirme.

### 3.5. Yönetimin Gözden Geçirmesi (YGG)
*   **Amaç:** KYS'nin uygunluğunu, yeterliliğini ve etkinliğini sürekli olarak sağlamak üzere yönetimin sistemi periyodik olarak gözden geçirmesi.
*   **Temel Fonksiyonlar:**
    *   YGG Toplantı Planlama: Toplantı gündemi, katılımcılar, tarih.
    *   Girdi Verilerinin Toplanması: Önceki YGG kararları, iç/dış denetim sonuçları, müşteri geri bildirimleri, süreç performansı, DÖF durumu, riskler ve fırsatlar, iyileştirme önerileri vb.
    *   Toplantı Kayıtları ve Kararları: Toplantıda görüşülen konular, alınan kararlar ve sorumluların kaydedilmesi.
    *   Kararların Takibi: Alınan kararların uygulanma durumunun izlenmesi.

### 3.6. Risk ve Fırsat Yönetimi
*   **Amaç:** KYS hedeflerine ulaşmayı etkileyebilecek riskleri ve fırsatları belirlemek, analiz etmek, değerlendirmek ve ele almak.
*   **Temel Fonksiyonlar:**
    *   Risk ve Fırsat Tanımlama: Süreçler, hedefler, paydaş beklentileri doğrultusunda risklerin ve fırsatların belirlenmesi.
    *   Risk Analizi ve Değerlendirme: Risklerin olasılık ve etki açısından değerlendirilmesi, risk seviyelerinin belirlenmesi.
    *   Risk İşleme Planları: Belirlenen riskler için kontrol faaliyetleri (azaltma, transfer etme, kaçınma, kabul etme) planlama ve uygulama.
    *   Fırsatları Değerlendirme ve Ele Alma Planları.
    *   İzleme ve Gözden Geçirme: Risk ve fırsatların ve uygulanan faaliyetlerin etkinliğinin periyodik olarak izlenmesi.

### 3.7. Eğitim ve Yetkinlik Yönetimi
*   **Amaç:** Çalışanların KYS'nin etkin uygulanması için gerekli bilgi, beceri ve yetkinliklere sahip olmasını sağlamak.
*   **Temel Fonksiyonlar:**
    *   Yetkinlik Matrisi Oluşturma: Pozisyonlar için gerekli yetkinliklerin tanımlanması.
    *   Eğitim İhtiyaç Analizi: Çalışanların mevcut yetkinlikleri ile pozisyon için gerekli yetkinlikler arasındaki farkların belirlenmesi.
    *   Eğitim Planlama ve Organizasyonu: İç ve dış eğitimlerin planlanması, bütçelenmesi ve organize edilmesi.
    *   Eğitim Kayıtları: Çalışanların katıldığı eğitimler, tarihleri, süreleri, eğitmen bilgileri, başarı durumları, sertifikalar.
    *   Eğitim Etkinliğinin Değerlendirilmesi: Verilen eğitimlerin iş performansına etkisinin değerlendirilmesi.
    *   Oryantasyon Programları: Yeni işe başlayan çalışanlar için KYS ve görevleriyle ilgili oryantasyon.

### 3.8. Müşteri İlişkileri Yönetimi (Şikayetler ve Geri Bildirimler)
*   **Amaç:** Müşteri beklentilerini anlamak, müşteri memnuniyetini ölçmek, şikayetleri etkin bir şekilde ele almak ve müşteri geri bildirimlerini iyileştirme için kullanmak.
*   **Temel Fonksiyonlar:**
    *   Müşteri Şikayetlerinin Kaydedilmesi ve Takibi: Şikayetin alınması, kaydedilmesi, sorumlu atanması, çözüm süreci ve müşteriye geri bildirim.
    *   Müşteri Memnuniyeti Anketleri: Periyodik olarak müşteri memnuniyetini ölçmek için anketler tasarlama, uygulama ve analiz etme.
    *   Müşteri Geri Bildirimlerinin Toplanması: Farklı kanallardan (anket, e-posta, görüşme vb.) gelen geri bildirimlerin toplanması ve değerlendirilmesi.
    *   Şikayet ve Geri Bildirimlerin DÖF ve İyileştirme Süreçlerine Aktarılması.

### 3.9. Tedarikçi Yönetimi ve Değerlendirme
*   **Amaç:** Kuruluşun kalite hedeflerine ulaşmasında kritik rol oynayan tedarikçilerin seçilmesi, performanslarının izlenmesi ve değerlendirilmesi.
*   **Temel Fonksiyonlar:**
    *   Tedarikçi Bilgi Yönetimi: Tedarikçi iletişim bilgileri, sözleşmeler, ürün/hizmet katalogları.
    *   Tedarikçi Seçme Kriterleri ve Onay Süreci.
    *   Tedarikçi Performans İzleme: Teslimat zamanlaması, ürün/hizmet kalitesi, fiyat uygunluğu gibi kriterlere göre performans takibi.
    *   Periyodik Tedarikçi Değerlendirme: Belirlenen kriterlere göre tedarikçilerin düzenli olarak değerlendirilmesi ve puanlanması.
    *   Onaylı Tedarikçi Listesi Yönetimi.
    *   Tedarikçi DÖF'leri: Tedarikçi kaynaklı uygunsuzluklar için DÖF başlatma.

### 3.10. Kalibrasyon ve Bakım Yönetimi (Ekipman Yönetimi)
*   **Amaç:** Ürün veya hizmet kalitesini etkileyen ölçüm ekipmanlarının doğruluğunu sağlamak (kalibrasyon) ve üretim/hizmet süreçlerinde kullanılan ekipmanların düzenli çalışmasını sağlamak (bakım).
*   **Temel Fonksiyonlar (Kalibrasyon):**
    *   Ölçüm Ekipmanı Envanteri: Kalibrasyona tabi tüm ekipmanların listesi, kimlik numaraları, lokasyonları.
    *   Kalibrasyon Planı ve Takvimi: Her ekipman için kalibrasyon periyotları, sonraki kalibrasyon tarihleri.
    *   Kalibrasyon Kayıtları: Yapılan kalibrasyonlar, sonuçları, sertifikaları, yapan kuruluş/kişi.
    *   Kalibrasyon Durumu Takibi (Geçerli, Süresi Dolmuş, Kalibrasyon Dışı).
    *   Sapma Durumunda Yapılacaklar.
*   **Temel Fonksiyonlar (Bakım):**
    *   Ekipman Envanteri: Bakıma tabi tüm ekipmanların listesi.
    *   Periyodik Bakım Planları: Ekipmanlar için önleyici bakım planları, bakım periyotları, yapılacak işlemler.
    *   Arıza Bakım Kayıtları: Oluşan arızaların kaydedilmesi, yapılan müdahaleler, kullanılan yedek parçalar, harcanan süre.
    *   Bakım Geçmişi Takibi.
    *   Yedek Parça Yönetimi (isteğe bağlı entegrasyon).

### 3.11. Ürün/Hizmet Gerçekleştirme ve Kontrolü (Giriş, Proses, Son Kontrol)
*   **Amaç:** Ürün veya hizmetin müşteri ve KYS şartlarına uygun olarak gerçekleştirilmesini ve doğrulanmasını sağlamak.
*   **Temel Fonksiyonlar:**
    *   Girdi Kontrolü (Malzeme Kabul): Tedarikçilerden gelen hammadde, malzeme veya hizmetlerin belirlenen şartlara uygunluğunun kontrolü ve kaydı.
    *   Proses Kontrolü: Üretim/hizmet gerçekleştirme aşamalarında kritik kontrol noktalarının belirlenmesi, parametrelerin izlenmesi ve kaydedilmesi.
    *   Son Kontrol ve Testler: Nihai ürün veya hizmetin müşteri şartlarına ve spesifikasyonlara uygunluğunun doğrulanması.
    *   Uygun Olmayan Ürün/Hizmet Yönetimi: Şartlara uymayan ürün/hizmetin tanımlanması, ayrılması, değerlendirilmesi (yeniden işleme, hurda, şartlı kabul vb.) ve ilgili kayıtların tutulması.
    *   İzlenebilirlik: Ürün/hizmetin geriye dönük olarak takip edilebilmesi için gerekli kayıtların tutulması (parti no, seri no vb.).

### 3.12. Sürekli İyileştirme Yönetimi
*   **Amaç:** KYS'nin etkinliğini ve verimliliğini sürekli olarak artırmak için fırsatların belirlenmesi ve iyileştirme projelerinin yönetilmesi.
*   **Temel Fonksiyonlar:**
    *   İyileştirme Önerileri Toplama: Çalışanlardan, müşterilerden, denetimlerden vb. gelen iyileştirme önerilerinin toplanması.
    *   İyileştirme Projeleri Tanımlama ve Yönetme: Önerilerin değerlendirilmesi, proje olarak tanımlanması, hedeflerin belirlenmesi, sorumluların atanması, kaynakların planlanması ve projelerin takibi.
    *   Performans Göstergeleri (KPI) Takibi: KYS süreçlerinin performansını ölçmek için anahtar performans göstergelerinin belirlenmesi, izlenmesi ve analiz edilmesi.
    *   Veri Analizi: Süreçlerden ve KYS uygulamalarından elde edilen verilerin analiz edilerek iyileştirme alanlarının belirlenmesi.

### 3.13. Bildirimler ve Görev Yönetimi
*   **Amaç:** Kullanıcılara kendilerine atanan görevler, yaklaşan terminler, onay bekleyen dokümanlar gibi konularda zamanında bilgi vermek.
*   **Temel Fonksiyonlar:**
    *   Kullanıcı Bazlı Bildirimler: DÖF ataması, doküman onay talebi, eğitim ataması, denetim görevi vb.
    *   Hatırlatıcılar: Yaklaşan kalibrasyon, bakım, denetim, doküman gözden geçirme tarihleri.
    *   Görev Listesi: Kullanıcının kendisine atanmış tüm açık görevleri görebileceği bir arayüz.

### 3.14. Raporlama ve Analiz
*   **Amaç:** KYS performansı hakkında yönetime ve ilgili kişilere bilgi sunmak, karar verme süreçlerini desteklemek.
*   **Temel Fonksiyonlar:**
    *   Modül Bazlı Raporlar: DÖF istatistikleri, denetim bulguları, eğitim tamamlama oranları, müşteri şikayet trendleri vb.
    *   Özelleştirilebilir Raporlar: Kullanıcıların kendi ihtiyaçlarına göre raporlar oluşturabilmesi.
    *   Grafiksel Gösterimler: Verilerin daha anlaşılır olması için grafikler ve dashboard'lar.
    *   Performans Göstergeleri (KPI) Raporları.

### 3.15. Kullanıcı Yönetimi ve Yetkilendirme
*   **Amaç:** Sisteme erişecek kullanıcıların tanımlanması, rollerinin belirlenmesi ve modül/fonksiyon bazında erişim yetkilerinin yönetilmesi.
*   **Temel Fonksiyonlar:**
    *   Kullanıcı Tanımlama: Kullanıcı adı, şifre, e-posta, departman, pozisyon vb.
    *   Rol Tanımlama: Farklı kullanıcı grupları için roller oluşturma (örn. Admin, Kalite Yöneticisi, Departman Sorumlusu, Denetçi, Kullanıcı).
    *   Yetki Atama: Rollere veya doğrudan kullanıcılara modül ve fonksiyon bazında (okuma, yazma, silme, onaylama vb.) yetki atama.
    *   Şifre Politikaları ve Güvenlik Ayarları.
    *   Kullanıcı Aktivite Logları (İz Kayıtları).

### 3.16. Yapay Zeka (AI) Asistanı Entegrasyonu
*   **Amaç:** KYS süreçlerinde verimliliği artırmak, kullanıcılara destek olmak ve veri analizini kolaylaştırmak.
*   **Potansiyel Senaryolar (Kullanıcının talebi üzerine):
    *   Doküman Analizi ve Özetleme: Uzun dokümanların anahtar noktalarını çıkarma.
    *   Risk Değerlendirme Desteği: Belirli senaryolar için potansiyel riskleri ve etkilerini analiz etme.
    *   DÖF Kök Neden Analizi Desteği: Uygunsuzluk tanımlarına göre olası kök nedenler hakkında fikir verme.
    *   Uygunsuzluk Trend Analizi: Kaydedilen uygunsuzluk verilerinden anlamlı desenler ve trendler çıkarma.
    *   Prosedür Yazım Desteği: Belirli bir süreç için standart prosedür taslağı oluşturma.
    *   Doğal Dil ile Sorgulama: Kullanıcıların sistemdeki verilere doğal dil ile sorular sorarak erişebilmesi.

## 4. Teknoloji Bağımsız Veritabanı Yapısı İçin Temel Varlıklar (Entities)

Meta-prompt'ta detaylandırılacak veritabanı yapısı için temel varlıklar ve aralarındaki ilişkiler şunlar olabilir (Bu kısım daha sonra detaylı şema olarak sunulacaktır):

*   Kullanıcılar (Users)
*   Roller (Roles)
*   Yetkiler (Permissions)
*   Dokümanlar (Documents)
*   Doküman Kategorileri (DocumentCategories)
*   Doküman Versiyonları/Revizyonları (DocumentRevisions)
*   DÖF Kayıtları (CorrectiveActions)
*   Uygunsuzluk Kaynakları (NonconformitySources)
*   Denetim Programları (AuditPrograms)
*   Denetim Planları (AuditPlans)
*   Denetimler (Audits)
*   Denetim Bulguları (AuditFindings)
*   Denetim Soru Listeleri (AuditChecklists)
*   Ekipmanlar (Equi
(Content truncated due to size limit. Use line ranges to read in chunks)