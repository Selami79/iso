-- Document Management Tables for KYS System

-- Create enum types if they don't exist
CREATE TYPE document_status AS ENUM ('draft', 'pending_approval', 'approved', 'published', 'archived', 'obsolete');
CREATE TYPE access_level AS ENUM ('public', 'internal', 'restricted', 'confidential');
CREATE TYPE document_type AS ENUM ('policy', 'procedure', 'work_instruction', 'form', 'record', 'external');
CREATE TYPE content_type AS ENUM ('text', 'file', 'url');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'superseded');
CREATE TYPE access_action AS ENUM ('view', 'download', 'print', 'share');

-- Document Categories Table
CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES document_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    document_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES document_categories(id),
    current_revision_id INTEGER UNIQUE,
    status document_status DEFAULT 'draft',
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    publication_date DATE,
    next_review_date DATE,
    review_frequency_months INTEGER DEFAULT 12,
    access_level access_level DEFAULT 'internal',
    keywords TEXT,
    is_controlled BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'tr',
    document_type document_type DEFAULT 'procedure',
    retention_period_years INTEGER DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Revisions Table
CREATE TABLE IF NOT EXISTS document_revisions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    revision_number VARCHAR(20) NOT NULL,
    content_type content_type DEFAULT 'file',
    content_text TEXT,
    file_path VARCHAR(512),
    file_name VARCHAR(255),
    file_size BIGINT,
    file_mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    change_description TEXT NOT NULL,
    prepared_by_user_id INTEGER NOT NULL REFERENCES users(id),
    preparation_date DATE NOT NULL,
    approval_status approval_status DEFAULT 'pending',
    approved_by_user_id INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    approval_comments TEXT,
    is_active_revision BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, revision_number)
);

-- Document Access Logs Table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    revision_id INTEGER REFERENCES document_revisions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action access_action NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for current_revision_id
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_current_revision 
FOREIGN KEY (current_revision_id) 
REFERENCES document_revisions(id);

-- Create indexes for better performance
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_by ON documents(created_by_user_id);
CREATE INDEX idx_document_revisions_document_id ON document_revisions(document_id);
CREATE INDEX idx_document_revisions_approval_status ON document_revisions(approval_status);
CREATE INDEX idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user_id ON document_access_logs(user_id);

-- Insert default document categories
INSERT INTO document_categories (category_name, description, sort_order) VALUES
('Politikalar', 'Kuruluş politika dokümanları', 1),
('Prosedürler', 'Süreç prosedürleri', 2),
('Talimatlar', 'İş talimatları', 3),
('Formlar', 'Kalite formları', 4),
('Kayıtlar', 'Kalite kayıtları', 5),
('Dış Kaynaklı', 'Dış kaynaklı dokümanlar', 6)
ON CONFLICT (category_name) DO NOTHING;

-- Insert document management permissions
INSERT INTO permissions (permission_name, description, module_name, resource, action) VALUES
('document_create', 'Doküman oluşturma yetkisi', 'document', 'document', 'create'),
('document_view', 'Doküman görüntüleme yetkisi', 'document', 'document', 'view'),
('document_edit', 'Doküman düzenleme yetkisi', 'document', 'document', 'edit'),
('document_delete', 'Doküman silme yetkisi', 'document', 'document', 'delete'),
('document_approve', 'Doküman onaylama yetkisi', 'document', 'document', 'approve'),
('document_download', 'Doküman indirme yetkisi', 'document', 'document', 'download'),
('document_category_manage', 'Doküman kategorileri yönetimi', 'document', 'category', 'manage')
ON CONFLICT (permission_name) DO NOTHING;

-- Grant document permissions to QUALITY_MANAGER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.role_name = 'QUALITY_MANAGER' 
AND p.module_name = 'document'
ON CONFLICT DO NOTHING;

-- Grant basic document viewing to EMPLOYEE role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.role_name = 'EMPLOYEE' 
AND p.permission_name IN ('document_view', 'document_download')
ON CONFLICT DO NOTHING;