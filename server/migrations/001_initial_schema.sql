-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff', 'parent')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PROGRAMS
-- =============================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    age_range VARCHAR(50),
    description TEXT,
    features JSONB,
    image_url VARCHAR(500),
    color VARCHAR(10),
    capacity INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CHILDREN
-- =============================================

CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    photo_url VARCHAR(500),
    program_id UUID REFERENCES programs(id),
    allergies TEXT,
    medical_notes TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    enrollment_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PARENTS
-- =============================================

CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pin_code VARCHAR(10),
    address TEXT,
    employer VARCHAR(200),
    work_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parent_children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    is_primary_contact BOOLEAN DEFAULT false,
    is_authorized_pickup BOOLEAN DEFAULT true,
    UNIQUE(parent_id, child_id)
);

CREATE TABLE authorized_pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20),
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ATTENDANCE & ABSENCES
-- =============================================

CREATE TABLE absence_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100),
    category VARCHAR(50),
    requires_notes BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES parents(id),
    start_date DATE NOT NULL,
    end_date DATE,
    reason_id UUID REFERENCES absence_reasons(id),
    notes TEXT,
    expected_return_date DATE,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'cancelled'))
);

CREATE TABLE child_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    checked_in_by_parent_id UUID REFERENCES parents(id),
    checked_in_by_name VARCHAR(200),
    checked_out_by_parent_id UUID REFERENCES parents(id),
    checked_out_by_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EMPLOYEES & HR
-- =============================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    pin_code VARCHAR(10),
    hourly_rate DECIMAL(10,2),
    photo_url VARCHAR(500),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issued_date DATE,
    expiry_date DATE,
    document_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_timeclock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    total_minutes INTEGER,
    notes TEXT,
    edited_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    employment_type VARCHAR(50),
    salary_range VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID REFERENCES job_postings(id),
    applicant_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url VARCHAR(500),
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CMS CONTENT
-- =============================================

CREATE TABLE site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_en TEXT,
    content_es TEXT,
    content_type VARCHAR(20) DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page, section, content_key)
);

CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption_en VARCHAR(500),
    caption_es VARCHAR(500),
    category VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_en TEXT NOT NULL,
    quote_es TEXT,
    author_name VARCHAR(200),
    author_role VARCHAR(100),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    photo_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FUTURE TABLES
-- =============================================

CREATE TABLE fire_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drill_date TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    children_count INTEGER,
    staff_count INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id),
    incident_date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT,
    parent_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DEFAULT DATA
-- =============================================

INSERT INTO absence_reasons (name, name_es, category, sort_order) VALUES
('Sick - Fever', 'Enfermo - Fiebre', 'sick', 1),
('Sick - Cold/Flu', 'Enfermo - Resfriado/Gripe', 'sick', 2),
('Sick - Stomach/Vomiting', 'Enfermo - Estomago/Vomitos', 'sick', 3),
('Sick - Other', 'Enfermo - Otro', 'sick', 4),
('Doctor Appointment', 'Cita Medica', 'medical', 5),
('Dentist Appointment', 'Cita con Dentista', 'medical', 6),
('Family Emergency', 'Emergencia Familiar', 'personal', 7),
('Vacation/Travel', 'Vacaciones/Viaje', 'personal', 8),
('Weather Related', 'Relacionado al Clima', 'other', 9),
('Personal Day', 'Dia Personal', 'personal', 10),
('Other', 'Otro', 'other', 11);

INSERT INTO programs (name, slug, age_range, color, sort_order) VALUES
('Infant Care', 'infant', '6 weeks - 18 months', '#FFB3B3', 1),
('Toddler Program', 'toddler', '18 months - 3 years', '#A8E6E2', 2),
('Preschool', 'preschool', '3 - 5 years', '#FFE66D', 3),
('Summer Camp', 'summer-camp', 'Up to 5 years', '#C4B5FD', 4);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_children_program ON children(program_id);
CREATE INDEX idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX idx_parent_children_child ON parent_children(child_id);
CREATE INDEX idx_absences_child ON absences(child_id);
CREATE INDEX idx_absences_dates ON absences(start_date, end_date);
CREATE INDEX idx_checkins_child ON child_checkins(child_id);
CREATE INDEX idx_checkins_date ON child_checkins(checkin_date);
CREATE INDEX idx_timeclock_employee ON employee_timeclock(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
