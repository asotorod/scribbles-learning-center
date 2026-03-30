import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Programs from './pages/Programs';
import Curriculum from './pages/Curriculum';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ParentApp from './pages/ParentApp';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import {
  AdminLayout,
  AdminLogin,
  AdminDashboard,
  AdminChildren,
  AdminParents,
  AdminAttendance,
  AdminReports,
  AdminHR,
  AdminCMS,
  AdminSettings,
  AdminAuditLog,
} from './pages/admin';
import { KioskHome, KioskParent, KioskEmployee } from './pages/kiosk';
import {
  ParentLayout,
  ParentDashboard,
  MyChildren,
  ReportAbsence,
  AbsenceHistory,
  Messages,
  MyAccount,
} from './pages/parent';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Kiosk Routes - Standalone, no header/footer */}
        <Route path="/kiosk" element={<KioskHome />} />
        <Route path="/kiosk/parent" element={<KioskParent />} />
        <Route path="/kiosk/employee" element={<KioskEmployee />} />

        {/* Public Routes */}
        <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        <Route path="/programs" element={<><Navbar /><Programs /><Footer /></>} />
        <Route path="/curriculum" element={<><Navbar /><Curriculum /><Footer /></>} />
        <Route path="/about" element={<><Navbar /><About /><Footer /></>} />
        <Route path="/gallery" element={<><Navbar /><Gallery /><Footer /></>} />
        <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
        <Route path="/careers" element={<><Navbar /><Careers /><Footer /></>} />
        <Route path="/privacy-policy" element={<><Navbar /><PrivacyPolicy /><Footer /></>} />
        <Route path="/terms-of-service" element={<><Navbar /><TermsOfService /><Footer /></>} />
        <Route path="/app" element={<><Navbar /><ParentApp /><Footer /></>} />

        {/* Parent Portal Login */}
        <Route path="/login" element={<Login />} />

        {/* Parent Portal Routes */}
        <Route path="/parent" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<MyChildren />} />
          <Route path="report-absence" element={<ReportAbsence />} />
          <Route path="absences" element={<AbsenceHistory />} />
          <Route path="messages" element={<Messages />} />
          <Route path="account" element={<MyAccount />} />
        </Route>

        {/* Admin Login (public) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Portal Routes (protected) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="children" element={<AdminChildren />} />
          <Route path="parents" element={<AdminParents />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="hr" element={<AdminHR />} />
          <Route path="content" element={<AdminCMS />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

// Placeholder component for upcoming pages
const PlaceholderPage = ({ title, description }) => (
  <div className="placeholder-page">
    <div className="admin-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    <div className="placeholder-content">
      <div className="placeholder-icon">🚧</div>
      <h3>Coming Soon</h3>
      <p>This feature is under development.</p>
    </div>
  </div>
);

export default App;
