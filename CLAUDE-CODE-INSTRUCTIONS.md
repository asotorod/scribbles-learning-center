# Claude Code Instructions - Scribbles Learning Center

## Project Overview
Read `PROJECT-SPEC.md` for the complete specification. This is a daycare management system with:
- Public website (React)
- Admin portal (CMS, children, parents, HR, reports)
- Parent portal (view children, report absences)
- Kiosk system (check-in/out)
- Future mobile app (React Native - same API)

## Tech Stack
- **Frontend:** React 18 + React Router (Vercel)
- **Backend:** Node.js + Express (Railway)
- **Database:** PostgreSQL (Railway)
- **File Storage:** AWS S3
- **Auth:** JWT + Refresh Tokens
- **Email:** SendGrid

## Project Structure (Target)
```
scribbles-learning-center/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   │   ├── public/        # Public website pages
│   │   │   ├── admin/         # Admin portal pages
│   │   │   ├── parent/        # Parent portal pages
│   │   │   └── kiosk/         # Kiosk pages
│   │   ├── hooks/             # Custom hooks
│   │   ├── context/           # React context (auth, etc.)
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # Global styles
│   │   └── App.js
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Database, S3, email config
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, validation middleware
│   │   ├── models/            # Database queries/models
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js
│   │   │   ├── children.js
│   │   │   ├── parents.js
│   │   │   ├── attendance.js
│   │   │   ├── employees.js
│   │   │   ├── content.js
│   │   │   └── ...
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers
│   │   └── index.js           # Entry point
│   ├── migrations/            # SQL migration files
│   └── package.json
├── PROJECT-SPEC.md            # Full specification
├── CLAUDE-CODE-INSTRUCTIONS.md # This file
└── README.md
```

## Development Phases

### Phase 1: Foundation (START HERE)
1. Set up `server/` folder with Express
2. Configure PostgreSQL connection (Railway)
3. Create database migrations (see schema in PROJECT-SPEC.md)
4. Implement JWT authentication
5. Create basic auth routes (login, register, refresh)

### Phase 2: Frontend Setup
1. Set up `client/` folder with Create React App
2. Configure React Router
3. Create basic layout components
4. Set up auth context
5. Create login page

### Phase 3: Admin CMS
1. Admin dashboard
2. Content management pages
3. Gallery management (S3 upload)
4. Testimonials CRUD

### Phase 4: Children & Parents
1. Children CRUD endpoints + pages
2. Parents CRUD endpoints + pages
3. Parent-child linking
4. PIN code management

### Phase 5: Kiosk System
1. Kiosk PIN entry UI
2. Parent check-in/out flow
3. Employee clock in/out

### Phase 6: Parent Portal
1. Parent dashboard
2. My children view
3. **Report absence feature** (key feature!)
4. Absence history

### Phase 7: HR Module
1. Employee management
2. Time clock records
3. Job postings
4. Applications

### Phase 8: Reports
1. Attendance reports
2. Employee time reports
3. PDF generation

### Phase 9: Spanish + Email
1. Translation system
2. Language toggle
3. Email notifications

## Key API Endpoints to Build

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Children (Admin)
```
GET    /api/v1/children
POST   /api/v1/children
GET    /api/v1/children/:id
PUT    /api/v1/children/:id
DELETE /api/v1/children/:id
```

### Parents (Admin)
```
GET    /api/v1/parents
POST   /api/v1/parents
GET    /api/v1/parents/:id
PUT    /api/v1/parents/:id
POST   /api/v1/parents/:id/link-child
```

### Parent Portal
```
GET    /api/v1/portal/my-children
POST   /api/v1/portal/absences      # Report absence
GET    /api/v1/portal/absences
PUT    /api/v1/portal/absences/:id
DELETE /api/v1/portal/absences/:id
```

### Kiosk
```
POST   /api/v1/kiosk/verify-pin
POST   /api/v1/kiosk/checkin
POST   /api/v1/kiosk/checkout
POST   /api/v1/kiosk/employee/clockin
POST   /api/v1/kiosk/employee/clockout
```

### Attendance (Admin)
```
GET    /api/v1/attendance/today
GET    /api/v1/attendance/absences
PUT    /api/v1/attendance/absences/:id/acknowledge
```

## Environment Variables Needed

### Server (.env)
```
# Database (Railway)
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=scribbles-learning-bucket

# SendGrid
SENDGRID_API_KEY=

# App
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## Coding Standards

### Backend
- Use async/await for all async operations
- Use parameterized queries (prevent SQL injection)
- Validate all inputs with express-validator
- Use proper HTTP status codes
- Return consistent JSON responses: `{ success: true, data: {...} }`

### Frontend
- Use functional components with hooks
- Use React Context for global state (auth)
- Use custom hooks for data fetching
- Keep components small and focused
- Use CSS modules or styled-components

### Database
- Use UUIDs for all primary keys
- Use snake_case for column names
- Always include created_at, updated_at
- Use soft deletes (is_active flag) where appropriate

## Commands Reference

### Server
```bash
cd server
npm install
npm run dev          # Development with nodemon
npm run migrate      # Run migrations
npm start            # Production
```

### Client
```bash
cd client
npm install
npm start            # Development
npm run build        # Production build
```

## Important Notes

1. **Mobile-First API:** All features must be API endpoints first. The React frontend is just one consumer of the API. A future React Native app will use the same API.

2. **JWT Auth:** Use short-lived access tokens (15 min) + long-lived refresh tokens (7 days). This pattern works for both web and mobile.

3. **Parent Portal:** The "Report Absence" feature is critical. Parents need to select child, date(s), reason from dropdown, and add notes.

4. **Kiosk:** The /kiosk route should be fullscreen, touch-friendly, and not appear in the main navigation.

5. **Roles:** super_admin, admin, staff, parent - use middleware to protect routes.

## Getting Started Command

When starting work, run:
```bash
git pull origin main
```

Then start with Phase 1 if not yet done, or continue where we left off.

---

**Last Updated:** January 21, 2026
