import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import IntroVideo from './components/IntroVideo';
import Home from './pages/Home';
import Programs from './pages/Programs';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <div className="App">
      {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        <Route path="/programs" element={<><Navbar /><Programs /><Footer /></>} />
        <Route path="/about" element={<><Navbar /><About /><Footer /></>} />
        <Route path="/gallery" element={<><Navbar /><Gallery /><Footer /></>} />
        <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
