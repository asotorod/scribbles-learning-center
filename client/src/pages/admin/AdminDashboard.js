import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    enrolled: 0,
    present: 0,
    absent: 0,
    pendingAbsences: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingAbsences, setPendingAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [childrenRes, attendanceRes, absencesRes] = await Promise.all([
        api.get('/children').catch(() => ({ data: { data: [] } })),
        api.get('/attendance/today').catch(() => ({ data: { data: { present: [], absent: [] } } })),
        api.get('/attendance/absences?status=pending').catch(() => ({ data: { data: [] } })),
      ]);

      const children = Array.isArray(childrenRes.data?.data?.children) ? childrenRes.data.data.children : [];
      const attendance = attendanceRes.data?.data || {};
      const absences = Array.isArray(absencesRes.data?.data?.absences) ? absencesRes.data.data.absences : [];

      setStats({
        enrolled: children.length || 0,
        present: attendance.stats?.checkedIn || 0,
        absent: attendance.stats?.absent || 0,
        pendingAbsences: absences.length || 0,
      });

      setPendingAbsences(absences.slice(0, 5));

      // Build recent activity from real check-in data
      const recentCheckins = Array.isArray(attendance.recentCheckins) ? attendance.recentCheckins : [];
      const activity = recentCheckins.slice(0, 5).map((checkin, idx) => {
        const name = checkin.childName || checkin.child_name || 'Child';
        const isCheckedOut = !!checkin.checkOutTime;
        const time = isCheckedOut ? checkin.checkOutTime : checkin.checkInTime || checkin.check_in_time;
        return {
          id: checkin.id || idx,
          type: isCheckedOut ? 'checkout' : 'checkin',
          message: `${name} checked ${isCheckedOut ? 'out' : 'in'}`,
          time: time
            ? new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : '',
          icon: isCheckedOut ? '👋' : '✅',
        };
      });
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (absenceId) => {
    try {
      await api.put(`/attendance/absences/${absenceId}/acknowledge`);
      setPendingAbsences(prev => prev.filter(a => a.id !== absenceId));
      setStats(prev => ({ ...prev, pendingAbsences: prev.pendingAbsences - 1 }));
    } catch (error) {
      console.error('Error acknowledging absence:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>{getGreeting()}, {user?.first_name || user?.name || 'Admin'}!</h1>
        <p>Here's what's happening at Scribbles today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon="👶"
          value={stats.enrolled}
          label="Enrolled Children"
        />
        <StatCard
          icon="✅"
          value={stats.present}
          label="Present Today"
          variant="success"
        />
        <StatCard
          icon="🏠"
          value={stats.absent}
          label="Absent Today"
        />
        <StatCard
          icon="⏳"
          value={stats.pendingAbsences}
          label="Pending Absences"
          variant={stats.pendingAbsences > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="dashboard-grid">
        {/* Pending Absences */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Pending Absences</h2>
            <Link to="/admin/attendance" className="view-all">View All</Link>
          </div>
          <div className="dashboard-card-body">
            {pendingAbsences.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>No pending absences to acknowledge</p>
              </div>
            ) : (
              <div className="absence-list">
                {(pendingAbsences || []).map((absence) => (
                  <div key={absence.id} className="absence-item">
                    <div className="absence-info">
                      <h4>{absence.child_name || 'Child Name'}</h4>
                      <p>{absence.reason || 'Sick - Fever'}</p>
                      <span className="absence-date">
                        {new Date(absence.start_date || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleAcknowledge(absence.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="dashboard-card-body">
            {(!recentActivity || recentActivity.length === 0) ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <div className="activity-content">
                      <p>{activity.message}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="dashboard-card-body">
          <div className="quick-actions-grid">
            <Link to="/admin/children" className="quick-action">
              <span className="quick-action-icon">👶</span>
              <span className="quick-action-label">Add Child</span>
            </Link>
            <Link to="/admin/parents" className="quick-action">
              <span className="quick-action-icon">👨‍👩‍👧</span>
              <span className="quick-action-label">Add Parent</span>
            </Link>
            <Link to="/admin/attendance" className="quick-action">
              <span className="quick-action-icon">📋</span>
              <span className="quick-action-label">View Attendance</span>
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="quick-action">
              <span className="quick-action-icon">🌐</span>
              <span className="quick-action-label">View Website</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
