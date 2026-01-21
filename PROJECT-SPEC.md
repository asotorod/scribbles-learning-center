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

---

## ADMIN PORTAL TABS

- 📊 **Dashboard** - Stats, alerts, recent activity
- 📝 **Content (CMS)** - Pages, Programs, Gallery, Testimonials, Videos, Translations
- 👶 **Children** - All children, profiles, medical info, linked parents
- 👨‍👩‍👧 **Parents** - All parents, profiles, PIN management, authorized pickups
- 📋 **Attendance** - Today's overview, check-in log, reported absences (from parents)
- 👥 **HR** - Employees, time clock, job postings, applications
- 📈 **Reports** - Attendance, absence, employee time reports + PDF export
- 📬 **Messages** - Contact form submissions
- ⚙️ **Settings** - Admin users, absence reasons, programs
- 🔮 **Future** - Fire Drills, PNS, Incidents (greyed out)

---

## PARENT PORTAL FEATURES

- 🏠 **Dashboard** - My children cards, today's status, quick actions
- 👶 **My Children** - Profile view, attendance history
- 📝 **Report Absence** ★ - Select child, dates, reason dropdown, notes
- 📅 **Absence History** - View/edit/cancel upcoming, view past
- ⚙️ **My Account** - Update contact info, password, authorized pickups

### Absence Reason Dropdown Options:
- Sick - Fever
- Sick - Cold/Flu
- Sick - Stomach/Vomiting
- Sick - Other
- Doctor Appointment
- Dentist Appointment
- Family Emergency
- Vacation/Travel
- Weather Related
- Personal Day
- Other (requires notes)

---

## KIOSK SYSTEM

- **URL:** /kiosk (not in navigation)
- **Parent Flow:** Enter PIN → Select children → Check In/Out
- **Employee Flow:** Enter PIN → Clock In/Out
- Touch-friendly, fullscreen interface

---

## DATABASE (PostgreSQL - Railway)

### Core Tables:
- users, refresh_tokens
- programs
- children
- parents, parent_children, authorized_pickups
- absence_reasons, absences, child_checkins
- employees, employee_certifications, employee_timeclock
- job_postings, job_applications
- site_content, gallery_images, testimonials
- contact_inquiries, site_settings
- fire_drills, incidents, notifications (future)

---

## AWS S3 STRUCTURE

```
scribbles-learning-bucket/
├── images/ (gallery, children, employees, parents, content)
├── videos/ (intro-video.mp4, hero-video.mp4)
├── documents/ (resumes, certifications)
└── temp/
```

---

## DEVELOPMENT PHASES

1. **Foundation** (Week 1-2) - Railway, S3, API, Auth
2. **Frontend Updates** (Week 2-3) - Programs, pages, content
3. **Admin CMS** (Week 3-4) - Content management, gallery, videos
4. **Children & Parents** (Week 4-5) - CRUD, linking, PINs
5. **Kiosk** (Week 5-6) - Check-in/out, employee clock
6. **Parent Portal** (Week 6-7) - Dashboard, absence reporting ★
7. **HR** (Week 7-8) - Employees, time clock, jobs
8. **Reports** (Week 8-9) - PDF generation
9. **Spanish + Email** (Week 9-10) - Translations, notifications
10. **Launch** (Week 10-11) - Testing, training, deploy

---

## PRICING

**Total: $16,500**
- 50% upfront: $8,250
- 25% midpoint: $4,125
- 25% completion: $4,125

**Monthly hosting: ~$30-60 (client pays)**
**Monthly maintenance: $150-250 (optional)**
**Future mobile app: $8,000 - $15,000**

---

## MOBILE APP READINESS ✅

- REST API with JWT (works on mobile)
- Refresh tokens (handles token expiry)
- Parent portal endpoints ready
- Absence reporting API ready
- All files on S3 (accessible via URLs)

---

**Version:** 2.0  
**Created:** December 21, 2024

*Reference this document at the start of each development session.*
