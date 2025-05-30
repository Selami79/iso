-- KYS (Kalite Yönetim Sistemi) Database Schema
-- ISO 9001 Quality Management System Database Design
-- Created with full 3NF normalization and comprehensive audit trails

-- Drop existing database if exists
DROP DATABASE IF EXISTS kys_system;
CREATE DATABASE kys_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kys_system;

-- ============================================================================
-- 1. USER MANAGEMENT AND AUTHORIZATION TABLES
-- ============================================================================

-- Departments Table
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    manager_user_id INT,
    parent_department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department_name (department_name),
    INDEX idx_manager_user_id (manager_user_id),
    INDEX idx_parent_department_id (parent_department_id)
);

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department_id INT,
    position VARCHAR(150),
    phone VARCHAR(50),
    employee_number VARCHAR(50) UNIQUE,
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_system_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_url VARCHAR(512),
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    language VARCHAR(10) DEFAULT 'tr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_employee_number (employee_number),
    INDEX idx_department_id (department_id),
    INDEX idx_is_active (is_active)
);

-- Roles Table
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_name (role_name)
);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by_user_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);

-- Permissions Table
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    module_name VARCHAR(100),
    resource VARCHAR(100),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_permission_name (permission_name),
    INDEX idx_module_name (module_name)
);

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. DOCUMENT MANAGEMENT TABLES
-- ============================================================================

-- Document Categories
CREATE TABLE document_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    INDEX idx_category_name (category_name),
    INDEX idx_parent_category_id (parent_category_id)
);

-- Documents
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    current_revision_id INT,
    status ENUM('draft', 'pending_approval', 'approved', 'published', 'archived', 'obsolete') DEFAULT 'draft',
    created_by_user_id INT NOT NULL,
    publication_date DATE,
    next_review_date DATE,
    review_frequency_months INT DEFAULT 12,
    access_level ENUM('public', 'internal', 'restricted', 'confidential') DEFAULT 'internal',
    keywords TEXT,
    is_controlled BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'tr',
    document_type ENUM('policy', 'procedure', 'work_instruction', 'form', 'record', 'external') DEFAULT 'procedure',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    retention_period_years INT DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_document_code (document_code),
    INDEX idx_title (title),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_created_by_user_id (created_by_user_id),
    INDEX idx_publication_date (publication_date),
    INDEX idx_next_review_date (next_review_date),
    FULLTEXT idx_keywords (keywords, title)
);

-- Document Revisions
CREATE TABLE document_revisions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    revision_number VARCHAR(20) NOT NULL,
    content_type ENUM('text', 'file', 'url') DEFAULT 'file',
    content_text LONGTEXT,
    file_path VARCHAR(512),
    file_name VARCHAR(255),
    file_size BIGINT,
    file_mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    change_description TEXT NOT NULL,
    prepared_by_user_id INT NOT NULL,
    preparation_date DATE NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected', 'superseded') DEFAULT 'pending',
    approved_by_user_id INT,
    approval_date TIMESTAMP NULL,
    approval_comments TEXT,
    is_active_revision BOOLEAN DEFAULT FALSE,
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_path VARCHAR(512),
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (prepared_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_document_revision (document_id, revision_number),
    INDEX idx_document_id (document_id),
    INDEX idx_revision_number (revision_number),
    INDEX idx_approval_status (approval_status),
    INDEX idx_is_active_revision (is_active_revision)
);

-- Update foreign key for current_revision_id
ALTER TABLE documents ADD FOREIGN KEY (current_revision_id) REFERENCES document_revisions(id) ON DELETE SET NULL;

-- Document Access Logs
CREATE TABLE document_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    revision_id INT,
    user_id INT NOT NULL,
    action ENUM('view', 'download', 'print', 'share') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (revision_id) REFERENCES document_revisions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_document_id (document_id),
    INDEX idx_user_id (user_id),
    INDEX idx_accessed_at (accessed_at)
);

-- ============================================================================
-- 3. CAPA (CORRECTIVE AND PREVENTIVE ACTIONS) TABLES
-- ============================================================================

-- Nonconformity Sources
CREATE TABLE nonconformity_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_source_name (source_name)
);

-- CAPA Records
CREATE TABLE capa_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    capa_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    nonconformity_description TEXT NOT NULL,
    nonconformity_source_id INT,
    detection_date DATE NOT NULL,
    reported_by_user_id INT NOT NULL,
    department_id INT,
    capa_type ENUM('corrective', 'preventive', 'improvement') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'investigation', 'root_cause_analysis', 'action_planning', 'implementation', 'verification', 'closed', 'cancelled') DEFAULT 'open',
    immediate_action_taken TEXT,
    root_cause_analysis TEXT,
    root_cause_method VARCHAR(100),
    planned_actions TEXT,
    assigned_to_user_id INT,
    due_date DATE,
    completion_date DATE,
    actual_cost DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    effectiveness_verification_notes TEXT,
    effectiveness_verification_date DATE,
    verified_by_user_id INT,
    verification_method VARCHAR(100),
    related_document_id INT,
    related_audit_finding_id INT,
    related_customer_complaint_id INT,
    recurrence_prevention_measures TEXT,
    lessons_learned TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nonconformity_source_id) REFERENCES nonconformity_sources(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_capa_code (capa_code),
    INDEX idx_status (status),
    INDEX idx_capa_type (capa_type),
    INDEX idx_severity (severity),
    INDEX idx_assigned_to_user_id (assigned_to_user_id),
    INDEX idx_due_date (due_date),
    INDEX idx_detection_date (detection_date),
    FULLTEXT idx_description (title, nonconformity_description)
);

-- CAPA Action Items
CREATE TABLE capa_action_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    capa_id INT NOT NULL,
    action_description TEXT NOT NULL,
    assigned_to_user_id INT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'overdue', 'cancelled') DEFAULT 'pending',
    completion_date DATE,
    completion_notes TEXT,
    verification_required BOOLEAN DEFAULT FALSE,
    verified_by_user_id INT,
    verification_date DATE,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (capa_id) REFERENCES capa_records(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_capa_id (capa_id),
    INDEX idx_assigned_to_user_id (assigned_to_user_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- ============================================================================
-- 4. AUDIT MANAGEMENT TABLES
-- ============================================================================

-- Audit Programs
CREATE TABLE audit_programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_name VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    scope TEXT,
    objectives TEXT,
    prepared_by_user_id INT NOT NULL,
    approved_by_user_id INT,
    approval_date DATE,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prepared_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_year (year),
    INDEX idx_status (status)
);

-- Audit Plans
CREATE TABLE audit_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_program_id INT,
    audit_code VARCHAR(50) NOT NULL UNIQUE,
    audit_title VARCHAR(255) NOT NULL,
    audit_type ENUM('internal', 'supplier', 'certification', 'customer', 'regulatory') NOT NULL,
    scope TEXT NOT NULL,
    criteria TEXT NOT NULL,
    department_id INT,
    supplier_id INT,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    lead_auditor_user_id INT NOT NULL,
    status ENUM('planned', 'in_progress', 'completed', 'cancelled', 'postponed') DEFAULT 'planned',
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    audit_frequency_months INT DEFAULT 12,
    last_audit_date DATE,
    next_audit_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_program_id) REFERENCES audit_programs(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_auditor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_audit_code (audit_code),
    INDEX idx_audit_type (audit_type),
    INDEX idx_status (status),
    INDEX idx_planned_start_date (planned_start_date)
);

-- Audit Team Members
CREATE TABLE audit_team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_plan_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('lead_auditor', 'auditor', 'observer', 'technical_expert') NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_audit_member (audit_plan_id, user_id),
    INDEX idx_audit_plan_id (audit_plan_id),
    INDEX idx_user_id (user_id)
);

-- Audit Findings
CREATE TABLE audit_findings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_plan_id INT NOT NULL,
    finding_code VARCHAR(50) NOT NULL,
    finding_title VARCHAR(255) NOT NULL,
    finding_description TEXT NOT NULL,
    finding_type ENUM('nonconformity', 'observation', 'opportunity', 'positive') NOT NULL,
    severity ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    clause_reference VARCHAR(100),
    evidence TEXT,
    auditee_response TEXT,
    auditor_user_id INT NOT NULL,
    identified_date DATE NOT NULL,
    capa_required BOOLEAN DEFAULT FALSE,
    capa_id INT,
    status ENUM('open', 'closed', 'verified') DEFAULT 'open',
    closed_date DATE,
    closed_by_user_id INT,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (auditor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (capa_id) REFERENCES capa_records(id) ON DELETE SET NULL,
    FOREIGN KEY (closed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_plan_id (audit_plan_id),
    INDEX idx_finding_type (finding_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    FULLTEXT idx_description (finding_title, finding_description)
);

-- ============================================================================
-- 5. RISK MANAGEMENT TABLES
-- ============================================================================

-- Risk Categories
CREATE TABLE risk_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
);

-- Risk Registers
CREATE TABLE risk_registers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    risk_code VARCHAR(50) NOT NULL UNIQUE,
    risk_title VARCHAR(255) NOT NULL,
    risk_description TEXT NOT NULL,
    risk_category_id INT,
    department_id INT,
    identified_by_user_id INT NOT NULL,
    identified_date DATE NOT NULL,
    risk_owner_user_id INT NOT NULL,
    risk_source VARCHAR(255),
    potential_causes TEXT,
    potential_consequences TEXT,
    existing_controls TEXT,
    probability_before INT CHECK (probability_before BETWEEN 1 AND 5),
    impact_before INT CHECK (impact_before BETWEEN 1 AND 5),
    risk_score_before INT GENERATED ALWAYS AS (probability_before * impact_before) STORED,
    risk_level_before ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
    treatment_strategy ENUM('accept', 'avoid', 'mitigate', 'transfer') DEFAULT 'mitigate',
    planned_actions TEXT,
    action_owner_user_id INT,
    target_date DATE,
    probability_after INT CHECK (probability_after BETWEEN 1 AND 5),
    impact_after INT CHECK (impact_after BETWEEN 1 AND 5),
    risk_score_after INT GENERATED ALWAYS AS (probability_after * impact_after) STORED,
    risk_level_after ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
    status ENUM('identified', 'assessed', 'treatment_planned', 'treatment_implemented', 'monitored', 'closed') DEFAULT 'identified',
    review_frequency_months INT DEFAULT 6,
    next_review_date DATE,
    last_review_date DATE,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_category_id) REFERENCES risk_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (identified_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (risk_owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (action_owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_risk_code (risk_code),
    INDEX idx_status (status),
    INDEX idx_risk_level_before (risk_level_before),
    INDEX idx_next_review_date (next_review_date),
    FULLTEXT idx_description (risk_title, risk_description)
);

-- Opportunities
CREATE TABLE opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opportunity_code VARCHAR(50) NOT NULL UNIQUE,
    opportunity_title VARCHAR(255) NOT NULL,
    opportunity_description TEXT NOT NULL,
    department_id INT,
    identified_by_user_id INT NOT NULL,
    identified_date DATE NOT NULL,
    opportunity_owner_user_id INT NOT NULL,
    potential_benefits TEXT,
    required_resources TEXT,
    feasibility_assessment TEXT,
    impact_assessment INT CHECK (impact_assessment BETWEEN 1 AND 5),
    effort_required INT CHECK (effort_required BETWEEN 1 AND 5),
    priority_score INT GENERATED ALWAYS AS (impact_assessment - effort_required + 5) STORED,
    status ENUM('identified', 'evaluated', 'approved', 'implementation', 'implemented', 'monitored', 'closed') DEFAULT 'identified',
    planned_actions TEXT,
    target_date DATE,
    actual_completion_date DATE,
    benefits_realized TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (identified_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (opportunity_owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_opportunity_code (opportunity_code),
    INDEX idx_status (status),
    INDEX idx_priority_score (priority_score),
    FULLTEXT idx_description (opportunity_title, opportunity_description)
);

-- ============================================================================
-- 6. TRAINING AND COMPETENCY MANAGEMENT TABLES
-- ============================================================================

-- Competency Categories
CREATE TABLE competency_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
);

-- Competencies
CREATE TABLE competencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competency_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    competency_type ENUM('technical', 'behavioral', 'regulatory', 'safety') DEFAULT 'technical',
    proficiency_levels JSON, -- ["Beginner", "Intermediate", "Advanced", "Expert"]
    assessment_method ENUM('exam', 'practical', 'observation', 'certification', 'self_assessment') DEFAULT 'exam',
    validity_period_months INT DEFAULT 12,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES competency_categories(id) ON DELETE SET NULL,
    INDEX idx_competency_name (competency_name),
    INDEX idx_competency_type (competency_type)
);

-- Position Competency Requirements
CREATE TABLE position_competency_requirements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    position_name VARCHAR(255) NOT NULL,
    competency_id INT NOT NULL,
    required_level VARCHAR(50) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    UNIQUE KEY unique_position_competency (position_name, competency_id),
    INDEX idx_position_name (position_name),
    INDEX idx_competency_id (competency_id)
);

-- Training Courses
CREATE TABLE training_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    course_type ENUM('internal', 'external', 'online', 'on_the_job') DEFAULT 'internal',
    duration_hours DECIMAL(5,2),
    max_participants INT,
    course_materials TEXT,
    prerequisites TEXT,
    learning_objectives TEXT,
    assessment_method ENUM('exam', 'practical', 'observation', 'quiz', 'none') DEFAULT 'exam',
    passing_score DECIMAL(5,2),
    certificate_validity_months INT DEFAULT 12,
    instructor_requirements TEXT,
    cost_per_participant DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_code (course_code),
    INDEX idx_course_type (course_type),
    FULLTEXT idx_course_name (course_name, description)
);

-- Course Competency Mapping
CREATE TABLE course_competency_mapping (
    course_id INT NOT NULL,
    competency_id INT NOT NULL,
    competency_level_achieved VARCHAR(50) NOT NULL,
    PRIMARY KEY (course_id, competency_id),
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

-- Training Sessions
CREATE TABLE training_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    instructor_user_id INT,
    external_instructor_name VARCHAR(255),
    max_participants INT,
    status ENUM('planned', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    session_notes TEXT,
    materials_provided TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session_code (session_code),
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
);

-- Training Enrollments
CREATE TABLE training_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    enrollment_status ENUM('enrolled', 'confirmed', 'attended', 'completed', 'failed', 'cancelled') DEFAULT 'enrolled',
    attendance_status ENUM('present', 'absent', 'partial') DEFAULT 'present',
    completion_date DATE,
    score DECIMAL(5,2),
    passed BOOLEAN,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    certificate_expiry_date DATE,
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_enrollment (session_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_enrollment_status (enrollment_status)
);

-- User Competency Assessments
CREATE TABLE user_competency_assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    competency_id INT NOT NULL,
    assessment_date DATE NOT NULL,
    assessor_user_id INT NOT NULL,
    assessment_method ENUM('exam', 'practical', 'observation', 'certification', 'self_assessment') NOT NULL,
    achieved_level VARCHAR(50) NOT NULL,
    score DECIMAL(5,2),
    passed BOOLEAN NOT NULL,
    certificate_number VARCHAR(100),
    valid_until DATE,
    assessment_notes TEXT,
    evidence_documents TEXT,
    next_assessment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE,
    FOREIGN KEY (assessor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_competency_id (competency_id),
    INDEX idx_valid_until (valid_until)
);

-- ============================================================================
-- 7. CUSTOMER RELATIONS MANAGEMENT TABLES
-- ============================================================================

-- Customers
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    customer_type ENUM('individual', 'corporate', 'government', 'international') DEFAULT 'corporate',
    industry VARCHAR(100),
    registration_date DATE,
    status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active',
    credit_limit DECIMAL(12,2),
    payment_terms VARCHAR(100),
    quality_requirements TEXT,
    special_instructions TEXT,
    assigned_representative_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_representative_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_code (customer_code),
    INDEX idx_company_name (company_name),
    INDEX idx_status (status)
);

-- Customer Complaints
CREATE TABLE customer_complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    complaint_title VARCHAR(255) NOT NULL,
    complaint_description TEXT NOT NULL,
    complaint_type ENUM('product_quality', 'service_quality', 'delivery', 'billing', 'communication', 'other') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    complaint_source ENUM('phone', 'email', 'website', 'in_person', 'social_media', 'survey') NOT NULL,
    received_date DATE NOT NULL,
    received_by_user_id INT NOT NULL,
    assigned_to_user_id INT,
    status ENUM('received', 'acknowledged', 'investigating', 'resolved', 'closed', 'escalated') DEFAULT 'received',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    product_service_involved VARCHAR(255),
    order_number VARCHAR(100),
    delivery_date DATE,
    financial_impact DECIMAL(10,2),
    immediate_action_taken TEXT,
    investigation_findings TEXT,
    root_cause_analysis TEXT,
    corrective_actions_taken TEXT,
    customer_notification_sent BOOLEAN DEFAULT FALSE,
    customer_satisfaction_rating INT CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
    resolution_date DATE,
    closure_date DATE,
    related_capa_id INT,
    lessons_learned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_capa_id) REFERENCES capa_records(id) ON DELETE SET NULL,
    INDEX idx_complaint_code (complaint_code),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_severity (severity),
    INDEX idx_received_date (received_date),
    FULLTEXT idx_description (complaint_title, complaint_description)
);

-- Customer Feedback
CREATE TABLE customer_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    feedback_type ENUM('suggestion', 'compliment', 'general_feedback', 'survey_response') NOT NULL,
    feedback_title VARCHAR(255),
    feedback_description TEXT NOT NULL,
    feedback_category VARCHAR(100),
    received_date DATE NOT NULL,
    received_by_user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_assigned_to_user_id INT,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (follow_up_assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_received_date (received_date)
);

-- Customer Satisfaction Surveys
CREATE TABLE customer_satisfaction_surveys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    survey_name VARCHAR(255) NOT NULL,
    survey_description TEXT,
    survey_period_start DATE NOT NULL,
    survey_period_end DATE NOT NULL,
    target_customer_segment VARCHAR(100),
    survey_method ENUM('email', 'phone', 'in_person', 'online', 'mail') NOT NULL,
    total_sent INT DEFAULT 0,
    total_responses INT DEFAULT 0,
    response_rate DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN total_sent > 0 THEN (total_responses * 100.0 / total_sent) ELSE 0 END) STORED,
    average_satisfaction_score DECIMAL(3,2),
    status ENUM('planned', 'active', 'completed', 'cancelled') DEFAULT 'planned',
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_survey_period_start (survey_period_start),
    INDEX idx_status (status)
);

-- ============================================================================
-- 8. SUPPLIER MANAGEMENT TABLES
-- ============================================================================

-- Suppliers
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    supplier_type ENUM('material', 'service', 'equipment', 'subcontractor') NOT NULL,
    industry VARCHAR(100),
    registration_date DATE,
    status ENUM('potential', 'approved', 'active', 'inactive', 'suspended', 'terminated') DEFAULT 'potential',
    certification_iso9001 BOOLEAN DEFAULT FALSE,
    certification_iso14001 BOOLEAN DEFAULT FALSE,
    certification_iso45001 BOOLEAN DEFAULT FALSE,
    other_certifications TEXT,
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    quality_agreement_signed BOOLEAN DEFAULT FALSE,
    quality_agreement_date DATE,
    assigned_buyer_user_id INT,
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    business_volume_annual DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_buyer_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_supplier_code (supplier_code),
    INDEX idx_company_name (company_name),
    INDEX idx_status (status),
    INDEX idx_supplier_type (supplier_type)
);

-- Supplier Evaluations
CREATE TABLE supplier_evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,
    evaluator_user_id INT NOT NULL,
    evaluation_type ENUM('initial', 'periodic', 'special', 'audit') NOT NULL,
    quality_score INT CHECK (quality_score BETWEEN 1 AND 100),
    delivery_score INT CHECK (delivery_score BETWEEN 1 AND 100),
    price_competitiveness_score INT CHECK (price_competitiveness_score BETWEEN 1 AND 100),
    service_score INT CHECK (service_score BETWEEN 1 AND 100),
    technical_capability_score INT CHECK (technical_capability_score BETWEEN 1 AND 100),
    overall_score INT GENERATED ALWAYS AS ((quality_score + delivery_score + price_competitiveness_score + service_score + technical_capability_score) / 5) STORED,
    evaluation_grade ENUM('A', 'B', 'C', 'D', 'F'),
    strengths TEXT,
    weaknesses TEXT,
    improvement_recommendations TEXT,
    evaluation_notes TEXT,
    next_evaluation_date DATE,
    evaluation_status ENUM('draft', 'completed', 'approved') DEFAULT 'draft',
    approved_by_user_id INT,
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_evaluation_period_start (evaluation_period_start),
    INDEX idx_evaluation_type (evaluation_type),
    INDEX idx_overall_score (overall_score)
);

-- Supplier Nonconformities
CREATE TABLE supplier_nonconformities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    nonconformity_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    nonconformity_type ENUM('quality', 'delivery', 'documentation', 'service', 'communication') NOT NULL,
    severity ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    detected_date DATE NOT NULL,
    detected_by_user_id INT NOT NULL,
    product_service_affected VARCHAR(255),
    quantity_affected VARCHAR(100),
    financial_impact DECIMAL(10,2),
    supplier_notified_date DATE,
    supplier_response_due_date DATE,
    supplier_response_received_date DATE,
    supplier_response TEXT,
    corrective_action_required BOOLEAN DEFAULT TRUE,
    corrective_action_description TEXT,
    corrective_action_due_date DATE,
    corrective_action_completion_date DATE,
    verification_required BOOLEAN DEFAULT TRUE,
    verification_method VARCHAR(255),
    verification_date DATE,
    verification_result ENUM('satisfactory', 'unsatisfactory', 'pending') DEFAULT 'pending',
    verified_by_user_id INT,
    status ENUM('open', 'supplier_response_pending', 'corrective_action_pending', 'verification_pending', 'closed') DEFAULT 'open',
    related_capa_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (detected_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_capa_id) REFERENCES capa_records(id) ON DELETE SET NULL,
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_nonconformity_code (nonconformity_code),
    INDEX idx_status (status),
    INDEX idx_severity (severity)
);

-- ============================================================================
-- 9. EQUIPMENT MANAGEMENT TABLES
-- ============================================================================

-- Equipment Categories
CREATE TABLE equipment_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    requires_calibration BOOLEAN DEFAULT FALSE,
    requires_maintenance BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
);

-- Equipment
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    equipment_name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    purchase_date DATE,
    purchase_cost DECIMAL(12,2),
    supplier_id INT,
    location VARCHAR(255),
    department_id INT,
    responsible_user_id INT,
    equipment_status ENUM('active', 'inactive', 'maintenance', 'calibration', 'retired', 'disposed') DEFAULT 'active',
    criticality ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    requires_calibration BOOLEAN DEFAULT FALSE,
    calibration_frequency_months INT,
    next_calibration_date DATE,
    requires_maintenance BOOLEAN DEFAULT TRUE,
    maintenance_frequency_months INT,
    next_maintenance_date DATE,
    warranty_expiry_date DATE,
    insurance_expiry_date DATE,
    specifications TEXT,
    operating_instructions TEXT,
    safety_requirements TEXT,
    disposal_date DATE,
    disposal_method VARCHAR(255),
    replacement_equipment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (replacement_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    INDEX idx_equipment_code (equipment_code),
    INDEX idx_equipment_name (equipment_name),
    INDEX idx_equipment_status (equipment_status),
    INDEX idx_next_calibration_date (next_calibration_date),
    INDEX idx_next_maintenance_date (next_maintenance_date)
);

-- Calibration Records
CREATE TABLE calibration_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    calibration_code VARCHAR(50) NOT NULL UNIQUE,
    calibration_date DATE NOT NULL,
    calibration_type ENUM('internal', 'external') NOT NULL,
    calibrated_by_user_id INT,
    external_laboratory VARCHAR(255),
    certificate_number VARCHAR(100),
    calibration_standard VARCHAR(255),
    traceability_reference VARCHAR(255),
    measurement_range VARCHAR(255),
    uncertainty VARCHAR(255),
    environmental_conditions TEXT,
    calibration_results JSON, -- Store measurement points and values
    calibration_status ENUM('pass', 'fail', 'limited', 'adjusted') NOT NULL,
    adjustments_made TEXT,
    next_calibration_date DATE NOT NULL,
    calibration_cost DECIMAL(10,2),
    calibration_certificate_path VARCHAR(512),
    nonconformities_found TEXT,
    recommendations TEXT,
    approved_by_user_id INT,
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (calibrated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_calibration_code (calibration_code),
    INDEX idx_calibration_date (calibration_date),
    INDEX idx_next_calibration_date (next_calibration_date),
    INDEX idx_calibration_status (calibration_status)
);

-- Maintenance Records
CREATE TABLE maintenance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    maintenance_code VARCHAR(50) NOT NULL UNIQUE,
    maintenance_date DATE NOT NULL,
    maintenance_type ENUM('preventive', 'corrective', 'predictive', 'emergency') NOT NULL,
    performed_by_user_id INT,
    external_service_provider VARCHAR(255),
    maintenance_description TEXT NOT NULL,
    work_performed TEXT,
    parts_replaced TEXT,
    parts_cost DECIMAL(10,2),
    labor_hours DECIMAL(5,2),
    labor_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(parts_cost, 0) + COALESCE(labor_cost, 0)) STORED,
    downtime_hours DECIMAL(5,2),
    maintenance_status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    completion_date DATE,
    quality_check_performed BOOLEAN DEFAULT FALSE,
    quality_check_results TEXT,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    photos_attachments TEXT,
    approved_by_user_id INT,
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_maintenance_code (maintenance_code),
    INDEX idx_maintenance_date (maintenance_date),
    INDEX idx_maintenance_type (maintenance_type),
    INDEX idx_maintenance_status (maintenance_status)
);

-- ============================================================================
-- 10. MANAGEMENT REVIEW TABLES
-- ============================================================================

-- Management Review Meetings
CREATE TABLE management_review_meetings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meeting_code VARCHAR(50) NOT NULL UNIQUE,
    meeting_title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    location VARCHAR(255),
    chairman_user_id INT NOT NULL,
    secretary_user_id INT,
    meeting_duration_hours DECIMAL(3,1),
    meeting_status ENUM('planned', 'in_progress', 'completed', 'cancelled', 'postponed') DEFAULT 'planned',
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    agenda TEXT,
    objectives TEXT,
    previous_meeting_id INT,
    next_scheduled_date DATE,
    meeting_minutes TEXT,
    key_decisions TEXT,
    action_items_summary TEXT,
    overall_qms_effectiveness_rating INT CHECK (overall_qms_effectiveness_rating BETWEEN 1 AND 5),
    customer_satisfaction_trend ENUM('improving', 'stable', 'declining', 'unknown') DEFAULT 'unknown',
    process_performance_trend ENUM('improving', 'stable', 'declining', 'unknown') DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chairman_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (secretary_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (previous_meeting_id) REFERENCES management_review_meetings(id) ON DELETE SET NULL,
    INDEX idx_meeting_code (meeting_code),
    INDEX idx_meeting_date (meeting_date),
    INDEX idx_meeting_status (meeting_status)
);

-- Management Review Participants
CREATE TABLE management_review_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meeting_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(100),
    attendance_status ENUM('invited', 'confirmed', 'attended', 'absent', 'excused') DEFAULT 'invited',
    invitation_sent_date DATE,
    response_date DATE,
    contribution_notes TEXT,
    FOREIGN KEY (meeting_id) REFERENCES management_review_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_meeting_participant (meeting_id, user_id),
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_user_id (user_id)
);

-- Management Review Input Data
CREATE TABLE management_review_inputs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meeting_id INT NOT NULL,
    input_category ENUM('previous_actions', 'customer_feedback', 'process_performance', 'audit_results', 'supplier_performance', 'risk_opportunities', 'improvement_suggestions', 'resource_needs', 'policy_changes') NOT NULL,
    input_title VARCHAR(255) NOT NULL,
    input_description TEXT,
    input_data JSON, -- Structured data specific to category
    presented_by_user_id INT,
    supporting_documents TEXT,
    key_findings TEXT,
    recommendations TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES management_review_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (presented_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_input_category (input_category)
);

-- Management Review Action Items
CREATE TABLE management_review_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meeting_id INT NOT NULL,
    action_code VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    action_category ENUM('qms_improvement', 'resource_allocation', 'policy_change', 'training', 'infrastructure', 'process_improvement', 'customer_focus', 'other') NOT NULL,
    assigned_to_user_id INT NOT NULL,
    due_date DATE NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'completed', 'overdue', 'cancelled') DEFAULT 'open',
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completion_date DATE,
    completion_notes TEXT,
    effectiveness_review_required BOOLEAN DEFAULT FALSE,
    effectiveness_review_date DATE,
    effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
    lessons_learned TEXT,
    related_risk_id INT,
    related_opportunity_id INT,
    budget_allocated DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES management_review_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (related_risk_id) REFERENCES risk_registers(id) ON DELETE SET NULL,
    FOREIGN KEY (related_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL,
    UNIQUE KEY unique_meeting_action_code (meeting_id, action_code),
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_assigned_to_user_id (assigned_to_user_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- ============================================================================
-- 11. NOTIFICATION AND TASK MANAGEMENT TABLES
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_user_id INT NOT NULL,
    notification_type ENUM('task_assignment', 'due_date_reminder', 'approval_request', 'status_update', 'system_alert', 'general_announcement') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_required BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(512),
    related_entity_type VARCHAR(100), -- e.g., 'capa', 'document', 'audit'
    related_entity_id INT,
    sender_user_id INT,
    scheduled_send_time TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivery_method ENUM('in_app', 'email', 'sms', 'push') DEFAULT 'in_app',
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_recipient_user_id (recipient_user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_priority (priority)
);

-- Tasks
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('approval', 'review', 'action_item', 'assessment', 'follow_up', 'general') NOT NULL,
    assigned_to_user_id INT NOT NULL,
    assigned_by_user_id INT NOT NULL,
    delegated_from_user_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    due_date DATE,
    start_date DATE,
    completion_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completion_notes TEXT,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by_user_id INT,
    approval_date DATE,
    approval_notes TEXT,
    related_entity_type VARCHAR(100),
    related_entity_id INT,
    parent_task_id INT,
    recurrence_pattern VARCHAR(100), -- e.g., 'monthly', 'quarterly'
    next_recurrence_date DATE,
    attachments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (delegated_from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_task_code (task_code),
    INDEX idx_assigned_to_user_id (assigned_to_user_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority),
    FULLTEXT idx_title_description (title, description)
);

-- Task Comments
CREATE TABLE task_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    attachments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- 12. SYSTEM CONFIGURATION AND LOGS
-- ============================================================================

-- System Settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(100),
    description TEXT,
    is_user_configurable BOOLEAN DEFAULT FALSE,
    requires_restart BOOLEAN DEFAULT FALSE,
    last_modified_by_user_id INT,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (last_modified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Error Logs
CREATE TABLE error_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    error_level ENUM('info', 'warning', 'error', 'critical') DEFAULT 'error',
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    stack_trace TEXT,
    user_id INT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by_user_id INT,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_error_level (error_level),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_resolved (resolved)
);

-- ============================================================================
-- 13. KEY PERFORMANCE INDICATORS (KPI) TABLES
-- ============================================================================

-- KPI Definitions
CREATE TABLE kpi_definitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kpi_code VARCHAR(50) NOT NULL UNIQUE,
    kpi_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    measurement_unit VARCHAR(50),
    calculation_method TEXT,
    target_value DECIMAL(10,2),
    threshold_red DECIMAL(10,2),
    threshold_yellow DECIMAL(10,2),
    threshold_green DECIMAL(10,2),
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    responsible_user_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_kpi_code (kpi_code),
    INDEX idx_category (category),
    INDEX idx_frequency (frequency)
);

-- KPI Values
CREATE TABLE kpi_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kpi_id INT NOT NULL,
    measurement_date DATE NOT NULL,
    actual_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2),
    variance DECIMAL(10,2) GENERATED ALWAYS AS (actual_value - target_value) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_value = 0 THEN NULL 
            ELSE ((actual_value - target_value) / target_value * 100) 
        END
    ) STORED,
    status ENUM('red', 'yellow', 'green', 'unknown') DEFAULT 'unknown',
    notes TEXT,
    data_source VARCHAR(255),
    recorded_by_user_id INT NOT NULL,
    approved_by_user_id INT,
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_kpi_date (kpi_id, measurement_date),
    INDEX idx_kpi_id (kpi_id),
    INDEX idx_measurement_date (measurement_date),
    INDEX idx_status (status)
);

-- ============================================================================
-- INITIAL DATA INSERTION
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_user_configurable) VALUES
('company_name', 'Quality Management System', 'string', 'general', 'Company name', TRUE),
('default_language', 'tr', 'string', 'localization', 'Default system language', TRUE),
('default_timezone', 'Europe/Istanbul', 'string', 'localization', 'Default timezone', TRUE),
('session_timeout_minutes', '30', 'number', 'security', 'Session timeout in minutes', TRUE),
('password_min_length', '8', 'number', 'security', 'Minimum password length', TRUE),
('password_require_uppercase', 'true', 'boolean', 'security', 'Require uppercase in password', TRUE),
('password_require_numbers', 'true', 'boolean', 'security', 'Require numbers in password', TRUE),
('password_require_special', 'true', 'boolean', 'security', 'Require special characters in password', TRUE),
('document_retention_years', '7', 'number', 'compliance', 'Default document retention period', TRUE),
('backup_frequency_hours', '24', 'number', 'system', 'Backup frequency in hours', FALSE),
('max_file_upload_mb', '50', 'number', 'system', 'Maximum file upload size in MB', TRUE),
('email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', TRUE),
('audit_log_retention_days', '2555', 'number', 'compliance', 'Audit log retention period in days (7 years)', FALSE);

-- Insert default roles
INSERT INTO roles (role_name, description, is_system_role) VALUES
('System Administrator', 'Full system access and configuration', TRUE),
('Quality Manager', 'Quality management oversight and approvals', FALSE),
('Department Manager', 'Department-level management and approvals', FALSE),
('Auditor', 'Internal audit planning and execution', FALSE),
('Document Controller', 'Document management and version control', FALSE),
('Employee', 'Basic employee access to relevant information', FALSE),
('Guest', 'Limited read-only access for external users', FALSE);

-- Insert default permissions
INSERT INTO permissions (permission_name, description, module_name, resource, action) VALUES
-- User Management
('user_view', 'View user information', 'user_management', 'user', 'read'),
('user_create', 'Create new users', 'user_management', 'user', 'create'),
('user_edit', 'Edit user information', 'user_management', 'user', 'update'),
('user_delete', 'Delete users', 'user_management', 'user', 'delete'),
('role_manage', 'Manage user roles and permissions', 'user_management', 'role', 'manage'),

-- Document Management
('document_view', 'View documents', 'document_management', 'document', 'read'),
('document_create', 'Create new documents', 'document_management', 'document', 'create'),
('document_edit', 'Edit documents', 'document_management', 'document', 'update'),
('document_approve', 'Approve document revisions', 'document_management', 'document', 'approve'),
('document_publish', 'Publish approved documents', 'document_management', 'document', 'publish'),
('document_archive', 'Archive obsolete documents', 'document_management', 'document', 'archive'),

-- CAPA Management
('capa_view', 'View CAPA records', 'capa', 'capa', 'read'),
('capa_create', 'Create new CAPA records', 'capa', 'capa', 'create'),
('capa_edit', 'Edit CAPA records', 'capa', 'capa', 'update'),
('capa_close', 'Close CAPA records', 'capa', 'capa', 'close'),
('capa_verify', 'Verify CAPA effectiveness', 'capa', 'capa', 'verify'),

-- Audit Management
('audit_view', 'View audit information', 'audit', 'audit', 'read'),
('audit_plan', 'Plan audits', 'audit', 'audit', 'plan'),
('audit_execute', 'Execute audits', 'audit', 'audit', 'execute'),
('audit_report', 'Generate audit reports', 'audit', 'audit', 'report'),

-- Risk Management
('risk_view', 'View risk information', 'risk_management', 'risk', 'read'),
('risk_create', 'Create risk assessments', 'risk_management', 'risk', 'create'),
('risk_edit', 'Edit risk assessments', 'risk_management', 'risk', 'update'),
('risk_approve', 'Approve risk assessments', 'risk_management', 'risk', 'approve'),

-- Training Management
('training_view', 'View training information', 'training', 'training', 'read'),
('training_manage', 'Manage training programs', 'training', 'training', 'manage'),
('training_assign', 'Assign training to users', 'training', 'training', 'assign'),
('training_record', 'Record training completion', 'training', 'training', 'record'),

-- Equipment Management
('equipment_view', 'View equipment information', 'equipment', 'equipment', 'read'),
('equipment_manage', 'Manage equipment records', 'equipment', 'equipment', 'manage'),
('calibration_manage', 'Manage calibration records', 'equipment', 'calibration', 'manage'),
('maintenance_manage', 'Manage maintenance records', 'equipment', 'maintenance', 'manage'),

-- Customer Management
('customer_view', 'View customer information', 'customer', 'customer', 'read'),
('customer_manage', 'Manage customer records', 'customer', 'customer', 'manage'),
('complaint_handle', 'Handle customer complaints', 'customer', 'complaint', 'handle'),

-- Supplier Management
('supplier_view', 'View supplier information', 'supplier', 'supplier', 'read'),
('supplier_manage', 'Manage supplier records', 'supplier', 'supplier', 'manage'),
('supplier_evaluate', 'Evaluate supplier performance', 'supplier', 'supplier', 'evaluate'),

-- Reporting
('report_view', 'View reports', 'reporting', 'report', 'read'),
('report_generate', 'Generate reports', 'reporting', 'report', 'generate'),
('dashboard_view', 'View dashboards', 'reporting', 'dashboard', 'read'),

-- System Administration
('system_configure', 'Configure system settings', 'system', 'configuration', 'manage'),
('audit_log_view', 'View audit logs', 'system', 'audit_log', 'read'),
('backup_manage', 'Manage system backups', 'system', 'backup', 'manage');

-- Insert default document categories
INSERT INTO document_categories (category_name, description) VALUES
('Policies', 'Company policies and high-level documents'),
('Procedures', 'Step-by-step procedures and work instructions'),
('Forms', 'Forms and templates used in QMS processes'),
('Records', 'Quality records and documented evidence'),
('External Documents', 'Standards, regulations, and external reference documents'),
('Work Instructions', 'Detailed work instructions for specific tasks'),
('Manuals', 'User manuals and reference guides');

-- Insert default nonconformity sources
INSERT INTO nonconformity_sources (source_name, description) VALUES
('Internal Audit', 'Nonconformities identified during internal audits'),
('Customer Complaint', 'Issues raised by customers'),
('Process Monitoring', 'Deviations found during regular process monitoring'),
('Management Review', 'Issues identified during management review'),
('External Audit', 'Findings from external certification or customer audits'),
('Employee Report', 'Issues reported by employees'),
('Supplier Issue', 'Problems related to suppliers or purchased products'),
('Equipment Failure', 'Issues related to equipment malfunction'),
('Product Testing', 'Nonconformities found during product testing'),
('Document Review', 'Issues identified during document review');

-- Insert default risk categories
INSERT INTO risk_categories (category_name, description) VALUES
('Operational', 'Risks related to day-to-day operations'),
('Financial', 'Financial and economic risks'),
('Strategic', 'Strategic and business risks'),
('Compliance', 'Regulatory and compliance risks'),
('Technology', 'IT and technology-related risks'),
('Human Resources', 'People and competency risks'),
('Environmental', 'Environmental and sustainability risks'),
('Safety', 'Health and safety risks'),
('Reputation', 'Brand and reputation risks'),
('Supply Chain', 'Supplier and supply chain risks');

-- Insert default competency categories
INSERT INTO competency_categories (category_name, description) VALUES
('Technical Skills', 'Job-specific technical competencies'),
('Quality Management', 'QMS and quality-related competencies'),
('Leadership', 'Management and leadership skills'),
('Communication', 'Communication and interpersonal skills'),
('Safety', 'Health and safety competencies'),
('Regulatory', 'Compliance and regulatory knowledge'),
('Problem Solving', 'Analytical and problem-solving skills'),
('Project Management', 'Project planning and execution skills');

-- Insert default equipment categories
INSERT INTO equipment_categories (category_name, description, requires_calibration, requires_maintenance) VALUES
('Measuring Instruments', 'Calibrated measuring and testing equipment', TRUE, TRUE),
('Production Equipment', 'Manufacturing and production machinery', FALSE, TRUE),
('Safety Equipment', 'Safety and emergency equipment', FALSE, TRUE),
('IT Equipment', 'Computers, servers, and IT infrastructure', FALSE, TRUE),
('Office Equipment', 'General office equipment and furniture', FALSE, TRUE),
('Laboratory Equipment', 'Testing and laboratory instruments', TRUE, TRUE),
('Facilities', 'Building systems and infrastructure', FALSE, TRUE);

-- Insert default KPI definitions
INSERT INTO kpi_definitions (kpi_code, kpi_name, description, category, measurement_unit, target_value, threshold_red, threshold_yellow, threshold_green, frequency) VALUES
('CUST_SAT', 'Customer Satisfaction', 'Average customer satisfaction rating', 'Customer', 'Rating (1-5)', 4.5, 3.0, 3.5, 4.0, 'quarterly'),
('CAPA_CLOSE', 'CAPA Closure Rate', 'Percentage of CAPAs closed on time', 'Quality', 'Percentage', 95.0, 70.0, 80.0, 90.0, 'monthly'),
('AUDIT_FINDINGS', 'Audit Findings Trend', 'Number of audit findings per audit', 'Quality', 'Count', 5.0, 15.0, 10.0, 5.0, 'quarterly'),
('DOC_REVIEW', 'Document Review Compliance', 'Percentage of documents reviewed on time', 'Quality', 'Percentage', 100.0, 80.0, 90.0, 95.0, 'monthly'),
('TRAINING_COMP', 'Training Completion Rate', 'Percentage of required training completed', 'Training', 'Percentage', 95.0, 70.0, 80.0, 90.0, 'monthly'),
('SUPPLIER_PERF', 'Supplier Performance', 'Average supplier performance score', 'Supplier', 'Score (1-100)', 85.0, 60.0, 70.0, 80.0, 'quarterly'),
('EQUIP_AVAIL', 'Equipment Availability', 'Percentage of equipment available/operational', 'Equipment', 'Percentage', 98.0, 90.0, 95.0, 97.0, 'monthly'),
('RISK_MITIGATION', 'Risk Mitigation Rate', 'Percentage of high risks with mitigation plans', 'Risk', 'Percentage', 100.0, 70.0, 85.0, 95.0, 'monthly');

-- Create indexes for better performance
CREATE INDEX idx_users_full_name ON users(full_name);
CREATE INDEX idx_documents_title_keywords ON documents(title, keywords);
CREATE INDEX idx_capa_records_status_priority ON capa_records(status, priority);
CREATE INDEX idx_audit_findings_type_severity ON audit_findings(finding_type, severity);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_user_id, is_read);
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to_user_id, status);

-- Add foreign key constraints that were missing
ALTER TABLE departments ADD FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE departments ADD FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add triggers for audit logging (example for users table)
DELIMITER //

CREATE TRIGGER users_audit_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action, entity_type, entity_id, new_values, created_at)
    VALUES ('CREATE', 'user', NEW.id, JSON_OBJECT(
        'username', NEW.username,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'department_id', NEW.department_id,
        'position', NEW.position,
        'is_active', NEW.is_active
    ), NOW());
END//

CREATE TRIGGER users_audit_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values, created_at)
    VALUES ('UPDATE', 'user', NEW.id, 
    JSON_OBJECT(
        'username', OLD.username,
        'email', OLD.email,
        'full_name', OLD.full_name,
        'department_id', OLD.department_id,
        'position', OLD.position,
        'is_active', OLD.is_active
    ),
    JSON_OBJECT(
        'username', NEW.username,
        'email', NEW.email,
        'full_name', NEW.full_name,
        'department_id', NEW.department_id,
        'position', NEW.position,
        'is_active', NEW.is_active
    ), NOW());
END//

DELIMITER ;

-- Create views for commonly used queries
CREATE VIEW active_users AS
SELECT u.*, d.department_name, 
       GROUP_CONCAT(r.role_name) as roles
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.is_active = TRUE
GROUP BY u.id;

CREATE VIEW pending_approvals AS
SELECT 'document' as type, dr.id, d.title as item_title, 
       dr.prepared_by_user_id as requester_id, 
       u.full_name as requester_name,
       dr.preparation_date as request_date
FROM document_revisions dr
JOIN documents d ON dr.document_id = d.id
JOIN users u ON dr.prepared_by_user_id = u.id
WHERE dr.approval_status = 'pending'
UNION ALL
SELECT 'capa' as type, c.id, c.title as item_title,
       c.reported_by_user_id as requester_id,
       u.full_name as requester_name,
       c.detection_date as request_date
FROM capa_records c
JOIN users u ON c.reported_by_user_id = u.id
WHERE c.status = 'open';

CREATE VIEW overdue_tasks AS
SELECT t.*, u.full_name as assigned_to_name,
       DATEDIFF(CURRENT_DATE, t.due_date) as days_overdue
FROM tasks t
JOIN users u ON t.assigned_to_user_id = u.id
WHERE t.due_date < CURRENT_DATE 
AND t.status NOT IN ('completed', 'cancelled');

-- Performance optimization: Add composite indexes
CREATE INDEX idx_document_revisions_document_active ON document_revisions(document_id, is_active_revision);
CREATE INDEX idx_capa_records_assigned_status ON capa_records(assigned_to_user_id, status);
CREATE INDEX idx_audit_findings_audit_type ON audit_findings(audit_plan_id, finding_type);
CREATE INDEX idx_training_enrollments_user_status ON training_enrollments(user_id, enrollment_status);
CREATE INDEX idx_equipment_calibration_due ON equipment(next_calibration_date, requires_calibration);
CREATE INDEX idx_equipment_maintenance_due ON equipment(next_maintenance_date, requires_maintenance);

-- Add check constraints for data integrity
ALTER TABLE capa_records ADD CONSTRAINT chk_due_date_after_detection 
CHECK (due_date IS NULL OR due_date >= detection_date);

ALTER TABLE document_revisions ADD CONSTRAINT chk_approval_date_after_preparation 
CHECK (approval_date IS NULL OR approval_date >= preparation_date);

ALTER TABLE training_sessions ADD CONSTRAINT chk_end_time_after_start 
CHECK (end_time > start_time);

-- Final schema optimization
ANALYZE TABLE users, documents, capa_records, audit_plans, risk_registers, 
             training_courses, customers, suppliers, equipment, notifications, tasks;

-- Database schema creation completed successfully
SELECT 'KYS Database Schema Created Successfully!' as status;