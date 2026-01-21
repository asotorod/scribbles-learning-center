# Scribbles Learning Center - Complete Project Specification v2.0
## Domain: scribbles-learning.com

---

## PROJECT OVERVIEW

**Client:** Scribbles Learning Center  
**Location:** 725 River Rd Suite 103, Edgewater, NJ 07020  
**Phone:** (201) 945-9445  
**Capacity:** 45 children  
**In Business Since:** 2008  
**Unique Advantage:** Located in same building as pediatric doctor and dentist (Healthcare Network)

---

## TECH STACK

| Component | Technology | Notes |
|-----------|------------|-------|
| **Frontend (Web)** | React 18 + React Router | Vercel deployment |
| **Admin Portal** | React 18 | Same codebase, role-based views |
| **Parent Portal** | React 18 | Same codebase, role-based views |
| **Kiosk** | React 18 (PWA) | Fullscreen touch-optimized view |
| **Backend API** | Node.js + Express | Railway deployment |
| **Database** | PostgreSQL | Railway managed |
| **File Storage** | AWS S3 | Images, resumes, documents |
| **Authentication** | JWT + Refresh Tokens | Mobile-app ready |
| **Email** | AWS SES or SendGrid | Notifications |
| **PDF Generation** | PDFKit | Reports |
| **Future Mobile** | React Native | Shared API backend |

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────┐  │
│   │  Public  │  │  Admin   │  │  Parent  │  │ Kiosk  │  │Future │  │
│   │  Website │  │  Portal  │  │  Portal  │  │ (PWA)  │  │Mobile │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  └───┬───┘  │
│        │             │             │            │            │       │
│        └─────────────┴─────────────┴────────────┴────────────┘       │
│                                    │                                 │
│              ┌─────────────────────┴─────────────────────┐          │
│              │         React Frontend (Vercel)            │          │
│              │      Role-based routing & components       │          │
│              └─────────────────────┬─────────────────────┘          │
│                                    │                                 │
└────────────────────────────────────┼─────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │       REST API (Railway)        │
                    │    Node.js + Express + JWT      │
                    │         /api/v1/...             │
                    └────────────────┬────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
   ┌───────┴───────┐        ┌───────┴───────┐        ┌───────┴───────┐
   │   PostgreSQL  │        │    AWS S3     │        │   SendGrid    │
   │   (Railway)   │        │   (Files)     │        │   (Email)     │
   └───────────────┘        └───────────────┘        └───────────────┘
```

### Why This Architecture?

1. **API-First Design** - All features built as APIs, so mobile app uses same backend
2. **JWT + Refresh Tokens** - Works on web AND mobile (stateless auth)
3. **Role-Based Access** - Same codebase, different views based on user role
4. **PostgreSQL on Railway** - Reliable, affordable, easy to scale
5. **AWS S3** - Industry standard for file storage, cheap, reliable
6. **Kiosk as PWA** - Runs on any tablet browser, no app store needed

---

## USER ROLES & ACCESS

| Role | Access | Description |
|------|--------|-------------|
| **Super Admin** | Full | Owner - everything |
| **Admin** | High | Managers - CMS, reports, HR, all children |
| **Staff** | Medium | Teachers - kiosk clock-in, view assigned room |
| **Parent** | Portal | Parent portal - own children, absences |

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW (Web + Mobile Ready)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. User submits email + password                                   │
│      POST /api/v1/auth/login                                        │
│                                                                      │
│   2. Server validates credentials                                    │
│      → If valid, generates:                                         │
│        • Access Token (JWT, 15 min expiry)                          │
│        • Refresh Token (JWT, 7 days expiry)                         │
│                                                                      │
│   3. Response:                                                       │
│      {                                                               │
│        accessToken: "eyJhbG...",                                    │
│        refreshToken: "eyJhbG...",                                   │
│        user: { id, email, role, name }                              │
│      }                                                               │
│                                                                      │
│   4. Client stores tokens:                                           │
│      • Web: httpOnly cookies or localStorage                        │
│      • Mobile: Secure storage                                        │
│                                                                      │
│   5. API calls include:                                              │
│      Header: Authorization: Bearer <accessToken>                    │
│                                                                      │
│   6. When access token expires:                                      │
│      POST /api/v1/auth/refresh                                      │
│      Body: { refreshToken }                                         │
│      → Returns new token pair                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN PORTAL STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN PORTAL                                  │
│                    (Super Admin + Admin)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📊 DASHBOARD                                                        │
│     ├── Today's Stats (enrolled, present, absent)                   │
│     ├── Recent Check-ins                                            │
│     ├── Pending Absences to Acknowledge                             │
│     ├── Expiring Certifications Alert                               │
│     └── Quick Actions                                                │
│                                                                      │
│  📝 CONTENT (CMS)                                                    │
│     ├── Pages (edit text, images per page)                          │
│     ├── Programs                                                     │
│     ├── Gallery (upload to S3)                                       │
│     ├── Testimonials                                                 │
│     ├── Media (intro video, hero video)                             │
│     └── Translations (EN/ES toggle)                                  │
│                                                                      │
│  👶 CHILDREN                                                         │
│     ├── All Children (list, search, filter by program)              │
│     ├── Add New Child                                                │
│     ├── Child Profile                                                │
│     │   ├── Basic Info                                              │
│     │   ├── Medical/Allergies                                       │
│     │   ├── Linked Parents                                          │
│     │   ├── Authorized Pickups                                      │
│     │   └── Attendance History                                      │
│     └── Classrooms/Programs Assignment                               │
│                                                                      │
│  👨‍👩‍👧 PARENTS                                                          │
│     ├── All Parents (list, search)                                   │
│     ├── Add New Parent (creates login account)                      │
│     ├── Parent Profile                                               │
│     │   ├── Contact Info                                            │
│     │   ├── Linked Children                                         │
│     │   └── PIN Code Management                                     │
│     └── Authorized Pickups (non-parent)                              │
│                                                                      │
│  📋 ATTENDANCE                                                       │
│     ├── Today's Overview                                             │
│     │   ├── Expected (enrolled - absences)                          │
│     │   ├── Checked In                                              │
│     │   ├── Checked Out                                             │
│     │   └── Reported Absent                                         │
│     ├── Check-in Log (all check-ins with times)                     │
│     ├── Reported Absences ◄── FROM PARENT PORTAL                    │
│     │   ├── View reason, notes                                      │
│     │   ├── Acknowledge                                             │
│     │   └── Contact parent                                          │
│     ├── Manual Check-in/out (admin override)                        │
│     └── Calendar View                                                │
│                                                                      │
│  👥 HR (Human Resources)                                             │
│     ├── Employees                                                    │
│     │   ├── All Employees                                           │
│     │   ├── Add/Edit Employee                                       │
│     │   ├── PIN Management                                          │
│     │   └── Certifications (track expiry)                           │
│     ├── Time Clock                                                   │
│     │   ├── Today's Punches                                         │
│     │   ├── Edit Time Entry                                         │
│     │   └── Weekly Timesheets                                       │
│     ├── Job Postings                                                 │
│     │   ├── Active Postings                                         │
│     │   └── Add/Edit Posting                                        │
│     └── Applications                                                 │
│         ├── New Applications                                        │
│         ├── Update Status                                           │
│         └── Download Resume                                          │
│                                                                      │
│  📈 REPORTS                                                          │
│     ├── Attendance Reports                                           │
│     │   ├── Daily                                                   │
│     │   ├── Weekly                                                  │
│     │   ├── Monthly                                                 │
│     │   └── Custom Range                                            │
│     ├── Absence Reports                                              │
│     │   ├── By Child                                                │
│     │   ├── By Reason                                               │
│     │   └── Date Range                                              │
│     ├── Employee Time Reports                                        │
│     │   ├── Timesheets                                              │
│     │   ├── Overtime                                                │
│     │   └── Pay Period                                              │
│     └── Export: PDF / Print / CSV                                    │
│                                                                      │
│  📬 MESSAGES                                                         │
│     ├── Contact Form Submissions                                     │
│     ├── Mark Read/Unread                                            │
│     └── Reply (opens email)                                          │
│                                                                      │
│  ⚙️ SETTINGS                                                         │
│     ├── Admin Users (manage logins)                                  │
│     ├── Absence Reasons (customize dropdown)                        │
│     ├── Programs/Classrooms                                          │
│     ├── Business Hours                                               │
│     └── Email Settings                                               │
│                                                                      │
│  🔮 FUTURE (Greyed out tabs)                                         │
│     ├── Fire Drills                                                  │
│     ├── PNS (Parent Notification System)                            │
│     └── Incidents                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PARENT PORTAL STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PARENT PORTAL                                  │
│              (Web now, Mobile app later - same API)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🏠 DASHBOARD                                                        │
│     ├── Welcome, [Parent Name]!                                     │
│     ├── My Children (cards with photos)                             │
│     │   └── Each child shows:                                       │
│     │       • Photo + Name                                          │
│     │       • Program/Classroom                                     │
│     │       • Today's Status (Not checked in / Checked in / Out)    │
│     ├── Quick Actions                                                │
│     │   ├── [Report Absence] ★                                      │
│     │   └── [Update My Info]                                        │
│     └── Announcements (future - from PNS)                           │
│                                                                      │
│  👶 MY CHILDREN                                                      │
│     ├── Child 1 Card                                                 │
│     │   ├── Profile View (photo, DOB, program)                      │
│     │   ├── Attendance History (calendar view)                      │
│     │   └── Emergency Contacts (view/update)                        │
│     └── Child 2 Card...                                              │
│                                                                      │
│  📝 REPORT ABSENCE ★★★ KEY FEATURE ★★★                              │
│     │                                                                │
│     │  Select Child → Select Dates → Select Reason → Add Notes      │
│     │                                                                │
│     │  REASON OPTIONS:                                               │
│     │  • Sick - Fever                                                │
│     │  • Sick - Cold/Flu                                             │
│     │  • Sick - Stomach/Vomiting                                     │
│     │  • Sick - Other                                                │
│     │  • Doctor Appointment                                          │
│     │  • Dentist Appointment                                         │
│     │  • Family Emergency                                            │
│     │  • Vacation/Travel                                             │
│     │  • Weather Related                                             │
│     │  • Personal Day                                                │
│     │  • Other (requires notes)                                      │
│     │                                                                │
│     └── On Submit:                                                   │
│         → Saves to database                                         │
│         → Admin sees in Attendance > Reported Absences              │
│         → Email notification to admin (if enabled)                  │
│         → Confirmation shown to parent                               │
│                                                                      │
│  📅 ABSENCE HISTORY                                                  │
│     ├── Upcoming Absences                                            │
│     │   └── [Edit] [Cancel] options                                 │
│     ├── Past Absences                                                │
│     │   └── View only                                               │
│     └── Calendar view                                                │
│                                                                      │
│  ⚙️ MY ACCOUNT                                                       │
│     ├── Update Contact Info                                          │
│     ├── Change Password                                              │
│     ├── Authorized Pickups                                           │
│     └── Notification Preferences (future)                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## KIOSK INTERFACE

- **URL:** /kiosk (not in navigation)
- **Parent Flow:** Enter PIN → Select children → Check In/Out
- **Employee Flow:** Enter PIN → Clock In/Out
- Touch-friendly, fullscreen interface

---

## DATABASE SCHEMA (PostgreSQL - Railway)

```sql
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
('Sick - Stomach/Vomiting', 'Enfermo - Estómago/Vómitos', 'sick', 3),
('Sick - Other', 'Enfermo - Otro', 'sick', 4),
('Doctor Appointment', 'Cita Médica', 'medical', 5),
('Dentist Appointment', 'Cita con Dentista', 'medical', 6),
('Family Emergency', 'Emergencia Familiar', 'personal', 7),
('Vacation/Travel', 'Vacaciones/Viaje', 'personal', 8),
('Weather Related', 'Relacionado al Clima', 'other', 9),
('Personal Day', 'Día Personal', 'personal', 10),
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
```

---

## AWS S3 STRUCTURE

```
scribbles-learning-bucket/
├── images/
│   ├── gallery/
│   │   └── {uuid}.jpg
│   ├── children/
│   │   └── {child_id}.jpg
│   ├── employees/
│   │   └── {employee_id}.jpg
│   ├── parents/
│   │   └── {parent_id}.jpg
│   └── content/
│       └── hero-image.jpg
├── videos/
│   ├── intro-video.mp4
│   └── hero-video.mp4
├── documents/
│   ├── resumes/
│   │   └── {application_id}.pdf
│   └── certifications/
│       └── {cert_id}.pdf
└── temp/
```

---

## DEVELOPMENT PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Railway PostgreSQL setup
- [ ] AWS S3 bucket setup
- [ ] Express API with JWT auth
- [ ] Database migrations

### Phase 2: Frontend Updates (Week 2-3)
- [ ] Summer Camp program (replace After School)
- [ ] Fix founding year (2008)
- [ ] Scribbles Difference page
- [ ] NJ Requirements section
- [ ] Healthcare Network section
- [ ] Testimonials page
- [ ] Careers page

### Phase 3: Admin CMS (Week 3-4)
- [ ] Admin login/dashboard
- [ ] Content management
- [ ] Gallery (S3 upload)
- [ ] Testimonials CRUD
- [ ] Video management

### Phase 4: Children & Parents (Week 4-5)
- [ ] Children CRUD
- [ ] Parents CRUD
- [ ] Parent-child linking
- [ ] PIN management

### Phase 5: Kiosk (Week 5-6)
- [ ] Kiosk UI
- [ ] PIN verification
- [ ] Check-in/out flow
- [ ] Employee clock-in

### Phase 6: Parent Portal (Week 6-7)
- [ ] Parent login
- [ ] Dashboard
- [ ] Report Absence ★
- [ ] Absence history

### Phase 7: HR (Week 7-8)
- [ ] Employee management
- [ ] Time clock
- [ ] Job postings
- [ ] Applications

### Phase 8: Reports (Week 8-9)
- [ ] Attendance reports
- [ ] Employee reports
- [ ] PDF generation

### Phase 9: Spanish + Email (Week 9-10)
- [ ] Translation system
- [ ] Language toggle
- [ ] Email notifications

### Phase 10: Launch (Week 10-11)
- [ ] Testing
- [ ] Training
- [ ] Deploy

---

## PRICING

**Total: $16,500**
- 50% upfront: $8,250
- 25% midpoint: $4,125
- 25% completion: $4,125

**Monthly hosting: ~$30-60 (client pays)**
**Monthly maintenance: $150-250 (optional)**

---

## MOBILE APP READINESS ✅

- REST API with JWT (works on mobile)
- Refresh tokens (handles token expiry)
- Parent portal endpoints ready
- Absence reporting API ready
- All files on S3 (accessible via URLs)

**Future mobile app: $8,000 - $15,000 (React Native)**

---

**Version:** 2.0  
**Last Updated:** January 21, 2026

*Reference this document at the start of each development session.*
