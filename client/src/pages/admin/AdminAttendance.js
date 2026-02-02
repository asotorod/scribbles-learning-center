import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './AdminAttendance.css';

const AdminAttendance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    expected: 0,
    present: 0,
    absent: 0,
    pending: 0,
  });
  const [checkIns, setCheckIns] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const [todayRes, absencesRes] = await Promise.all([
        api.get('/attendance/today').catch(() => null),
        api.get('/attendance/absences').catch(() => null),
      ]);

      // Extract data from API response (API returns { data: { stats, recentCheckins, absences } })
      const todayData = todayRes?.data?.data || {};
      const absencesList = absencesRes?.data?.data?.absences;
      const absencesData = Array.isArray(absencesList) ? absencesList : [];

      setStats({
        expected: todayData.stats?.expected || 0,
        present: todayData.stats?.checkedIn || 0,
        absent: todayData.stats?.absent || 0,
        pending: absencesData.filter(a => a.status === 'pending').length,
      });

      // API returns recentCheckins, not checkIns
      const checkins = Array.isArray(todayData.recentCheckins) ? todayData.recentCheckins : [];
      setCheckIns(checkins);
      setAbsences(absencesData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (absenceId) => {
    try {
      await api.put(`/attendance/absences/${absenceId}/acknowledge`);
    } catch (error) {
      console.error('Error acknowledging:', error);
    }
    // Update local state
    setAbsences(prev =>
      prev.map(a => a.id === absenceId ? { ...a, status: 'acknowledged' } : a)
    );
    setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
  };

  const tabs = [
    { id: 'overview', label: "Today's Overview" },
    { id: 'checkins', label: 'Check-in Log' },
    { id: 'absences', label: 'Reported Absences' },
  ];

  const checkInColumns = [
    {
      key: 'child',
      title: 'Child',
      render: (_, row) => (
        <div className="child-cell">
          <div className="child-avatar">{row.child_name?.charAt(0)}</div>
          <div>
            <span className="child-name">{row.child_name}</span>
            <span className="child-program">{row.program}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'check_in_time',
      title: 'Check In',
      render: (val) => val ? formatTime(val) : <span className="cell-muted">-</span>,
    },
    {
      key: 'check_out_time',
      title: 'Check Out',
      render: (val) => val ? formatTime(val) : <span className="cell-muted">-</span>,
    },
    {
      key: 'checked_in_by',
      title: 'Checked In By',
      render: (val) => val || <span className="cell-muted">-</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (val) => (
        <span className={`status-badge status-${val}`}>
          {val === 'checked_in' ? 'Present' : val === 'checked_out' ? 'Gone Home' : 'Not Arrived'}
        </span>
      ),
    },
  ];

  const absenceColumns = [
    {
      key: 'child',
      title: 'Child',
      render: (_, row) => (
        <div className="child-cell">
          <div className="child-avatar">{row.child_name?.charAt(0)}</div>
          <span className="child-name">{row.child_name}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      title: 'Date(s)',
      render: (_, row) => {
        const start = new Date(row.start_date).toLocaleDateString();
        const end = row.end_date ? new Date(row.end_date).toLocaleDateString() : null;
        return end && end !== start ? `${start} - ${end}` : start;
      },
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (val) => val || 'Not specified',
    },
    {
      key: 'reported_by',
      title: 'Reported By',
      render: (val) => val || 'Parent',
    },
    {
      key: 'status',
      title: 'Status',
      render: (val) => (
        <span className={`status-badge status-${val}`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '140px',
      render: (_, row) => (
        <div className="action-buttons">
          {row.status === 'pending' && (
            <Button
              variant="primary"
              size="small"
              onClick={() => handleAcknowledge(row.id)}
            >
              Acknowledge
            </Button>
          )}
          {row.status === 'acknowledged' && (
            <span className="acknowledged-text">Acknowledged</span>
          )}
        </div>
      ),
    },
  ];

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="admin-attendance">
      <div className="admin-page-header">
        <div>
          <h1>Attendance</h1>
          <p>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="attendance-stats">
        <StatCard icon="👶" value={stats.expected} label="Expected Today" />
        <StatCard icon="✅" value={stats.present} label="Present" variant="success" />
        <StatCard icon="🏠" value={stats.absent} label="Absent" />
        <StatCard
          icon="⏳"
          value={stats.pending}
          label="Pending Acknowledgment"
          variant={stats.pending > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Tabs */}
      <div className="attendance-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'absences' && stats.pending > 0 && (
              <span className="tab-badge">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-section">
              <h3>Present Children ({checkIns.filter(c => c.status === 'checked_in').length})</h3>
              <div className="children-grid">
                {checkIns.filter(c => c.status === 'checked_in').map(child => (
                  <div key={child.id} className="child-overview-card present">
                    <div className="child-avatar">{child.child_name?.charAt(0)}</div>
                    <div>
                      <span className="child-name">{child.child_name}</span>
                      <span className="child-time">In: {formatTime(child.check_in_time)}</span>
                    </div>
                  </div>
                ))}
                {checkIns.filter(c => c.status === 'checked_in').length === 0 && (
                  <p className="empty-message">No children checked in yet</p>
                )}
              </div>
            </div>

            <div className="overview-section">
              <h3>Not Yet Arrived ({checkIns.filter(c => c.status === 'not_arrived').length})</h3>
              <div className="children-grid">
                {checkIns.filter(c => c.status === 'not_arrived').map(child => (
                  <div key={child.id} className="child-overview-card not-arrived">
                    <div className="child-avatar">{child.child_name?.charAt(0)}</div>
                    <span className="child-name">{child.child_name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h3>Reported Absent ({absences.filter(a => a.status !== 'cancelled').length})</h3>
              <div className="children-grid">
                {absences.filter(a => a.status !== 'cancelled').map(absence => (
                  <div key={absence.id} className="child-overview-card absent">
                    <div className="child-avatar">{absence.child_name?.charAt(0)}</div>
                    <div>
                      <span className="child-name">{absence.child_name}</span>
                      <span className="child-reason">{absence.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="table-container">
            <Table
              columns={checkInColumns}
              data={checkIns}
              emptyMessage="No check-ins recorded today"
            />
          </div>
        )}

        {activeTab === 'absences' && (
          <div className="table-container">
            <Table
              columns={absenceColumns}
              data={absences}
              emptyMessage="No absences reported"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendance;
