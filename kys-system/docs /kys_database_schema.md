## Bölüm 4: Detaylı Veritabanı Yapısı ve Şeması

Bu bölümde, Kalite Yönetim Sistemi (KYS) için önerilen detaylı veritabanı yapısı ve tablo şemaları sunulmaktadır. Bu şemalar, teknoloji bağımsız bir şekilde tasarlanmış olup, herhangi bir ilişkisel veritabanı yönetim sistemine (RDBMS) uyarlanabilir.

### 4.1. Veritabanı Tasarım Felsefesi

*   **Normalizasyon:** Veri tekrarını en aza indirmek ve veri bütünlüğünü sağlamak için genellikle 3. Normal Form (3NF) hedeflenmiştir.
*   **İlişkisel Bütünlük:** Yabancı anahtarlar (Foreign Keys) kullanılarak tablolar arası ilişkisel bütünlük sağlanacaktır.
*   **Adlandırma Kuralları:** Tablo adları çoğul (örn: `Users`, `Documents`), sütun adları ise küçük harf ve alt çizgi ile (snake_case, örn: `user_name`, `creation_date`) belirtilmiştir.
*   **Benzersiz Tanımlayıcılar:** Her ana tablo için genellikle `id` adında otomatik artan bir birincil anahtar (Primary Key) kullanılmıştır.
*   **Zaman Damgaları:** Birçok tabloda kayıt oluşturma (`created_at`) ve son güncelleme (`updated_at`) zamanlarını tutmak için zaman damgası sütunları eklenmiştir.
*   **Yumuşak Silme (Soft Delete):** Bazı tablolarda kayıtların fiziksel olarak silinmesi yerine `is_deleted` veya `status` gibi bir alanla işaretlenerek pasif hale getirilmesi düşünülebilir (bu şemada genel olarak belirtilmemiştir, ancak implementasyonda değerlendirilebilir).

### 4.2. Varlık-İlişki Diyagramı (ERD - Kavramsal Açıklama)

Kapsamlı bir ERD, tüm varlıkları ve aralarındaki ilişkileri (bir-bir, bir-çok, çok-çok) görsel olarak ifade eder. Bu meta-prompt kapsamında, her tablo şemasında ilişkiler metinsel olarak açıklanacaktır. Temel varlık grupları şunlardır:

*   **Kullanıcı ve Yetkilendirme Varlıkları:** Kullanıcılar, Roller, Yetkiler.
*   **Temel KYS Varlıkları:** Dokümanlar, DÖFler, Denetimler, Riskler, Eğitimler vb.
*   **Destekleyici Varlıklar:** Kategoriler, Tipler, Durumlar gibi ana varlıkları sınıflandırmak veya detaylandırmak için kullanılan tablolar.
*   **İlişki Tabloları:** Çok-çok ilişkileri çözmek için kullanılan ara tablolar (örn: `UserRoles`, `DocumentApprovers`).

### 4.3. Tablo Şemaları




#### 4.3.1. Kullanıcı ve Yetkilendirme Tabloları

**Tablo Adı: Users**
*   Açıklama: Sistemdeki tüm kullanıcıların bilgilerini tutar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz kullanıcı tanımlayıcı)
    *   `username` (VARCHAR(100), NOT NULL, UNIQUE, Kullanıcının sisteme giriş için kullanacağı kullanıcı adı)
    *   `password_hash` (VARCHAR(255), NOT NULL, Kullanıcının şifresinin güvenli hashlenmiş hali)
    *   `email` (VARCHAR(255), NOT NULL, UNIQUE, Kullanıcının e-posta adresi)
    *   `full_name` (VARCHAR(255), Kullanıcının tam adı)
    *   `department_id` (INTEGER, FOREIGN KEY (Departments.id), Kullanıcının bağlı olduğu departman (isteğe bağlı))
    *   `position` (VARCHAR(150), Kullanıcının pozisyonu/unvanı)
    *   `is_active` (BOOLEAN, DEFAULT TRUE, Kullanıcının aktif olup olmadığını belirtir)
    *   `is_system_admin` (BOOLEAN, DEFAULT FALSE, Kullanıcının sistem admini olup olmadığını belirtir)
    *   `last_login_at` (TIMESTAMP, NULLABLE, Kullanıcının son giriş yaptığı zaman)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP, Kaydın oluşturulma zamanı)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, Kaydın son güncellenme zamanı)
*   İlişkiler:
    *   `Departments` tablosu ile `department_id` üzerinden (isteğe bağlı).
    *   `UserRoles` tablosu ile (çok-çok ilişki için ara tablo).

**Tablo Adı: Roles**
*   Açıklama: Sistemdeki kullanıcı rollerini tanımlar (örn: Admin, Kalite Yöneticisi, Denetçi).
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz rol tanımlayıcı)
    *   `role_name` (VARCHAR(100), NOT NULL, UNIQUE, Rolün adı)
    *   `description` (TEXT, NULLABLE, Rolün açıklaması)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
*   İlişkiler:
    *   `UserRoles` tablosu ile (çok-çok ilişki için ara tablo).
    *   `RolePermissions` tablosu ile (çok-çok ilişki için ara tablo).

**Tablo Adı: UserRoles** (Ara Tablo)
*   Açıklama: Kullanıcılar ve Roller arasındaki çok-çok ilişkiyi yönetir.
*   Sütunlar:
    *   `user_id` (INTEGER, PRIMARY KEY, FOREIGN KEY (Users.id))
    *   `role_id` (INTEGER, PRIMARY KEY, FOREIGN KEY (Roles.id))
    *   `assigned_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Tablo Adı: Permissions**
*   Açıklama: Sistemdeki farklı eylemler veya kaynaklar için izinleri tanımlar (örn: dokuman_olustur, kullanici_sil).
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz izin tanımlayıcı)
    *   `permission_name` (VARCHAR(150), NOT NULL, UNIQUE, İzin adı/kodu, örn: `document_create`, `user_view`)
    *   `description` (TEXT, NULLABLE, İznin açıklaması)
    *   `module_name` (VARCHAR(100), NULLABLE, İznin ait olduğu modül)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
*   İlişkiler:
    *   `RolePermissions` tablosu ile (çok-çok ilişki için ara tablo).

**Tablo Adı: RolePermissions** (Ara Tablo)
*   Açıklama: Roller ve İzinler arasındaki çok-çok ilişkiyi yönetir.
*   Sütunlar:
    *   `role_id` (INTEGER, PRIMARY KEY, FOREIGN KEY (Roles.id))
    *   `permission_id` (INTEGER, PRIMARY KEY, FOREIGN KEY (Permissions.id))
    *   `assigned_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

#### 4.3.2. Doküman Yönetimi Tabloları

**Tablo Adı: DocumentCategories**
*   Açıklama: Dokümanların sınıflandırıldığı kategorileri tutar (örn: Prosedürler, Talimatlar, Formlar).
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz kategori tanımlayıcı)
    *   `category_name` (VARCHAR(150), NOT NULL, UNIQUE, Kategori adı)
    *   `description` (TEXT, NULLABLE, Kategori açıklaması)
    *   `parent_category_id` (INTEGER, NULLABLE, FOREIGN KEY (DocumentCategories.id), Hiyerarşik kategoriler için üst kategori)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**Tablo Adı: Documents**
*   Açıklama: KYS kapsamındaki tüm kontrollü dokümanların ana bilgilerini tutar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz doküman tanımlayıcı)
    *   `document_code` (VARCHAR(50), NOT NULL, UNIQUE, Dokümanın benzersiz kodu)
    *   `title` (VARCHAR(255), NOT NULL, Dokümanın başlığı)
    *   `category_id` (INTEGER, NOT NULL, FOREIGN KEY (DocumentCategories.id), Dokümanın ait olduğu kategori)
    *   `current_revision_id` (INTEGER, NULLABLE, FOREIGN KEY (DocumentRevisions.id), Dokümanın güncel aktif revizyonu)
    *   `status` (VARCHAR(50), NOT NULL, Dokümanın durumu, örn: Taslak, Onay Bekliyor, Yayınlandı, Arşivlendi)
    *   `created_by_user_id` (INTEGER, NOT NULL, FOREIGN KEY (Users.id), Dokümanı oluşturan kullanıcı)
    *   `publication_date` (DATE, NULLABLE, Dokümanın yayınlanma tarihi)
    *   `next_review_date` (DATE, NULLABLE, Dokümanın bir sonraki gözden geçirme tarihi)
    *   `access_level` (VARCHAR(50), DEFAULT 'restricted', Erişim seviyesi, örn: public, internal, restricted)
    *   `keywords` (TEXT, NULLABLE, Arama için anahtar kelimeler)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
*   İlişkiler:
    *   `DocumentCategories` tablosu ile `category_id` üzerinden.
    *   `DocumentRevisions` tablosu ile `current_revision_id` üzerinden (güncel revizyonu işaret eder).
    *   `Users` tablosu ile `created_by_user_id` üzerinden.

**Tablo Adı: DocumentRevisions**
*   Açıklama: Dokümanların her bir revizyonunun detaylarını ve içeriğini tutar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz revizyon tanımlayıcı)
    *   `document_id` (INTEGER, NOT NULL, FOREIGN KEY (Documents.id), Ait olduğu doküman)
    *   `revision_number` (VARCHAR(20), NOT NULL, Revizyon numarası, örn: 1.0, 1.1, A)
    *   `content_type` (VARCHAR(50), NOT NULL, İçerik türü, örn: text, file_path, external_link)
    *   `content_text` (TEXT, NULLABLE, Eğer içerik metin ise)
    *   `file_path` (VARCHAR(512), NULLABLE, Eğer içerik dosya ise dosya yolu)
    *   `file_name` (VARCHAR(255), NULLABLE, Dosya adı)
    *   `file_mime_type` (VARCHAR(100), NULLABLE, Dosya MIME türü)
    *   `change_description` (TEXT, NOT NULL, Bu revizyonda yapılan değişikliklerin açıklaması)
    *   `prepared_by_user_id` (INTEGER, NOT NULL, FOREIGN KEY (Users.id), Revizyonu hazırlayan kullanıcı)
    *   `preparation_date` (DATE, NOT NULL, Hazırlanma tarihi)
    *   `approval_status` (VARCHAR(50), DEFAULT 'Pending', Onay durumu, örn: Pending, Approved, Rejected)
    *   `approved_by_user_id` (INTEGER, NULLABLE, FOREIGN KEY (Users.id), Revizyonu onaylayan kullanıcı)
    *   `approval_date` (TIMESTAMP, NULLABLE, Onay tarihi)
    *   `is_active_revision` (BOOLEAN, DEFAULT FALSE, Bu revizyonun dokümanın aktif revizyonu olup olmadığı)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
*   İlişkiler:
    *   `Documents` tablosu ile `document_id` üzerinden.
    *   `Users` tablosu ile `prepared_by_user_id` ve `approved_by_user_id` üzerinden.

**Tablo Adı: DocumentApprovalWorkflows** (İsteğe Bağlı/Gelişmiş)
*   Açıklama: Farklı doküman türleri veya kategorileri için özel onay akışlarını tanımlar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
    *   `workflow_name` (VARCHAR(150), NOT NULL, UNIQUE)
    *   `document_category_id` (INTEGER, NULLABLE, FOREIGN KEY (DocumentCategories.id), Belirli bir kategori içinse)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Tablo Adı: DocumentApprovalSteps** (İsteğe Bağlı/Gelişmiş)
*   Açıklama: Bir onay akışındaki adımları ve onaylayıcı rollerini/kullanıcılarını tanımlar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
    *   `workflow_id` (INTEGER, NOT NULL, FOREIGN KEY (DocumentApprovalWorkflows.id))
    *   `step_order` (INTEGER, NOT NULL, Onay sırası)
    *   `approver_role_id` (INTEGER, NULLABLE, FOREIGN KEY (Roles.id), Onaylayıcı rolü)
    *   `approver_user_id` (INTEGER, NULLABLE, FOREIGN KEY (Users.id), Belirli bir onaylayıcı kullanıcı)
    *   `is_mandatory` (BOOLEAN, DEFAULT TRUE)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Tablo Adı: DocumentRevisionApprovals** (İsteğe Bağlı/Gelişmiş)
*   Açıklama: Bir doküman revizyonunun onay akışındaki her bir adımdaki onay durumunu kaydeder.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
    *   `revision_id` (INTEGER, NOT NULL, FOREIGN KEY (DocumentRevisions.id))
    *   `approval_step_id` (INTEGER, NOT NULL, FOREIGN KEY (DocumentApprovalSteps.id))
    *   `approver_user_id` (INTEGER, NOT NULL, FOREIGN KEY (Users.id), Onayı veren/reddeden kullanıcı)
    *   `status` (VARCHAR(50), NOT NULL, örn: Approved, Rejected, Pending)
    *   `comments` (TEXT, NULLABLE)
    *   `action_date` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)



#### 4.3.3. Düzeltici ve Önleyici Faaliyetler (DÖF/CAPA) Tabloları

**Tablo Adı: NonconformitySources**
*   Açıklama: Uygunsuzlukların tespit edildiği kaynakları tanımlar (örn: İç Denetim, Müşteri Şikayeti, Proses Hatası).
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz kaynak tanımlayıcı)
    *   `source_name` (VARCHAR(150), NOT NULL, UNIQUE, Kaynak adı)
    *   `description` (TEXT, NULLABLE, Kaynak açıklaması)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Tablo Adı: CorrectiveActions (CAPA_Records)**
*   Açıklama: Düzeltici ve önleyici faaliyet kayıtlarını tutar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz DÖF tanımlayıcı)
    *   `capa_code` (VARCHAR(50), NOT NULL, UNIQUE, DÖF için benzersiz kod)
    *   `nonconformity_description` (TEXT, NOT NULL, Uygunsuzluğun veya potansiyel uygunsuzluğun detaylı tanımı)
    *   `nonconformity_source_id` (INTEGER, NULLABLE, FOREIGN KEY (NonconformitySources.id), Uygunsuzluğun kaynağı)
    *   `detection_date` (DATE, NOT NULL, Uygunsuzluğun tespit edildiği tarih)
    *   `reported_by_user_id` (INTEGER, FOREIGN KEY (Users.id), Uygunsuzluğu raporlayan kullanıcı)
    *   `capa_type` (VARCHAR(50), NOT NULL, Faaliyet türü, örn: Düzeltici, Önleyici)
    *   `status` (VARCHAR(50), NOT NULL, DÖF'ün güncel durumu, örn: Açık, Kök Neden Analizi, Faaliyet Planlandı, Uygulamada, Doğrulama Bekliyor, Kapalı, Reddedildi)
    *   `immediate_action_taken` (TEXT, NULLABLE, Alınan acil düzeltme faaliyetleri)
    *   `root_cause_analysis` (TEXT, NULLABLE, Yapılan kök neden analizi sonucu)
    *   `planned_corrective_actions` (TEXT, NULLABLE, Planlanan düzeltici/önleyici faaliyetler)
    *   `assigned_to_user_id` (INTEGER, FOREIGN KEY (Users.id), Faaliyetlerden sorumlu kullanıcı)
    *   `due_date` (DATE, NULLABLE, Faaliyetlerin tamamlanması için son tarih)
    *   `completion_date` (DATE, NULLABLE, Faaliyetlerin tamamlandığı tarih)
    *   `effectiveness_verification_notes` (TEXT, NULLABLE, Etkinlik doğrulama notları)
    *   `effectiveness_verification_date` (DATE, NULLABLE, Etkinlik doğrulama tarihi)
    *   `verified_by_user_id` (INTEGER, NULLABLE, FOREIGN KEY (Users.id), Etkinliği doğrulayan kullanıcı)
    *   `related_document_id` (INTEGER, NULLABLE, FOREIGN KEY (Documents.id), İlgili doküman)
    *   `related_audit_finding_id` (INTEGER, NULLABLE, FOREIGN KEY (AuditFindings.id), İlgili denetim bulgusu)
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
*   İlişkiler:
    *   `NonconformitySources` tablosu ile `nonconformity_source_id` üzerinden.
    *   `Users` tablosu ile `reported_by_user_id`, `assigned_to_user_id`, `verified_by_user_id` üzerinden.
    *   `Documents` tablosu ile `related_document_id` üzerinden.
    *   `AuditFindings` tablosu ile `related_audit_finding_id` üzerinden.

#### 4.3.4. Denetim Yönetimi Tabloları

**Tablo Adı: AuditPrograms**
*   Açıklama: Yıllık veya belirli periyotlar için denetim programlarını tanımlar.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz program tanımlayıcı)
    *   `program_name` (VARCHAR(255), NOT NULL, Denetim programının adı, örn: "2024 Yılı İç Denetim Programı")
    *   `year` (INTEGER, NOT NULL, Programın ait olduğu yıl)
    *   `status` (VARCHAR(50), NOT NULL, örn: Planlandı, Devam Ediyor, Tamamlandı)
    *   `prepared_by_user_id` (INTEGER, FOREIGN KEY (Users.id))
    *   `approved_by_user_id` (INTEGER, NULLABLE, FOREIGN KEY (Users.id))
    *   `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    *   `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**Tablo Adı: AuditPlans**
*   Açıklama: Bir denetim programı kapsamındaki her bir spesifik denetimin planını detaylandırır.
*   Sütunlar:
    *   `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT, Benzersiz denetim planı tanımlayıcı)
    *   `audit_program_id` (INTEGER, NULLABLE, FOREIGN KEY (AuditPrograms.id), Ait olduğu denetim programı)
    *   `audit_title` (VARCHAR(255), NOT NULL, Denetimin başlığı/konusu)
    *   `audit_type` (VARCHAR(50), NOT NULL, örn: İç Denetim, Tedarikçi Denetimi, Sertifikasyon Denetimi)
    *   `scope` (TEXT, NOT NULL, Denetimin kapsamı)
    *   `criteria` (TEXT, NOT NULL, Denetim kriterleri, örn: ISO 9001:2015, Şirket Prosedürleri)
    *   `department_to_be_audited` (VARCHAR(255), NULLABLE, Denetlenecek departman/birim)
    *   `supplier_to_be_audited_id` (INTEGER, NULLABLE, FOREIGN KEY (Suppliers.id), Denetlenecek tedarikçi)
    *   `planned_start_date` (DATE, NOT NULL)
    *   `planned_end_date` (DATE, NOT NULL)
    *   `lead_auditor_user_id` (INTEGER, NOT NULL, FOREIGN KEY (Users.id), Baş denetçi)
    *   `status` (VARCHAR(50), NOT NULL, örn: Planlandı, Devam Ediyor, Tamamlandı, İptal Edildi)
    *   `create
(Content truncated due to size limit. Use line ranges to read in chunks)