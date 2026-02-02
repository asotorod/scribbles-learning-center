import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/ui/Card';
import { attendanceAPI } from '../../services/api';
import './AdminReports.css';

const AdminReports = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getReport(date);
      const data = response?.data?.data;
      if (data) {
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateDisplay = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading report...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      {/* Header - hidden in print, replaced by print header */}
      <div className="admin-page-header reports-header no-print">
        <div>
          <h1>Reports</h1>
          <p>View and print attendance reports</p>
        </div>
        <div className="report-actions">
          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
          <button className="btn-print" onClick={handlePrint}>
            <span>🖨️</span> Print / PDF
          </button>
        </div>
      </div>

      {/* Print Header - only visible when printing */}
      <div className="print-header print-only">
        <h1>Scribbles Learning Center</h1>
        <h2>Attendance Report</h2>
        <p className="print-date">{formatDateDisplay(selectedDate)}</p>
        <p className="print-generated">
          Generated: {new Date().toLocaleString('en-US')}
        </p>
      </div>

      {!reportData ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No report data available</h3>
          <p>Select a date to view the attendance report.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="report-stats no-print">
            <StatCard
              icon="👶"
              value={reportData.stats.expected}
              label="Expected"
            />
            <StatCard
              icon="✅"
              value={reportData.stats.totalAttended}
              label="Total Attended"
              variant="success"
            />
            <StatCard
              icon="🏠"
              value={reportData.stats.absent}
              label="Absent"
            />
            <StatCard
              icon="👋"
              value={reportData.stats.checkedOut}
              label="Checked Out"
            />
          </div>

          {/* Print Stats */}
          <div className="print-stats print-only">
            <div className="print-stat">
              <span className="print-stat-value">{reportData.stats.expected}</span>
              <span className="print-stat-label">Expected</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-value">{reportData.stats.totalAttended}</span>
              <span className="print-stat-label">Attended</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-value">{reportData.stats.absent}</span>
              <span className="print-stat-label">Absent</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-value">{reportData.stats.checkedOut}</span>
              <span className="print-stat-label">Checked Out</span>
            </div>
          </div>

          {/* Date banner */}
          <div className="report-date-banner no-print">
            <h2>
              {isToday ? "Today's Report" : formatDateDisplay(selectedDate)}
            </h2>
          </div>

          {/* Program Breakdown */}
          {reportData.byProgram && reportData.byProgram.length > 0 && (
            <div className="report-section">
              <h3>Attendance by Program</h3>
              <div className="program-breakdown">
                {reportData.byProgram.map((prog) => (
                  <div key={prog.id} className="program-row">
                    <div className="program-name">
                      <span
                        className="program-dot"
                        style={{ background: prog.color || '#6B7280' }}
                      />
                      {prog.name}
                    </div>
                    <div className="program-counts">
                      <span className="count-item">
                        <strong>{prog.checkedIn + prog.checkedOut}</strong> attended
                      </span>
                      <span className="count-sep">/</span>
                      <span className="count-item">{prog.enrolled} enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attended Children */}
          <div className="report-section">
            <h3>
              Children Who Attended ({reportData.checkins.length})
            </h3>
            {reportData.checkins.length === 0 ? (
              <p className="empty-message">No check-ins recorded for this date.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Child Name</th>
                    <th>Program</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Checked In By</th>
                    <th className="no-print">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.checkins.map((checkin, idx) => (
                    <tr key={checkin.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="child-cell">
                          <div className="child-avatar-sm">
                            {checkin.childName?.charAt(0) || '?'}
                          </div>
                          <span>{checkin.childName}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="program-tag"
                          style={{
                            background: checkin.programColor
                              ? `${checkin.programColor}20`
                              : '#f3f4f6',
                            color: checkin.programColor || '#6B7280',
                          }}
                        >
                          {checkin.programName || '-'}
                        </span>
                      </td>
                      <td>{formatTime(checkin.checkInTime)}</td>
                      <td>{formatTime(checkin.checkOutTime)}</td>
                      <td>{checkin.checkedInBy || '-'}</td>
                      <td className="no-print">
                        <span
                          className={`status-badge status-${checkin.status}`}
                        >
                          {checkin.status === 'checked_in'
                            ? 'Present'
                            : 'Checked Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Absent Children */}
          <div className="report-section">
            <h3>
              Absent Children ({reportData.absences.length})
            </h3>
            {reportData.absences.length === 0 ? (
              <p className="empty-message">No absences reported for this date.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Child Name</th>
                    <th>Reason</th>
                    <th>Reported By</th>
                    <th>Notes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.absences.map((absence, idx) => (
                    <tr key={absence.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="child-cell">
                          <div className="child-avatar-sm absent">
                            {absence.childName?.charAt(0) || '?'}
                          </div>
                          <span>{absence.childName}</span>
                        </div>
                      </td>
                      <td>{absence.reasonName || 'Not specified'}</td>
                      <td>{absence.reportedBy || 'Parent'}</td>
                      <td>{absence.notes || '-'}</td>
                      <td>
                        <span
                          className={`status-badge status-${absence.status}`}
                        >
                          {absence.status === 'acknowledged'
                            ? 'Acknowledged'
                            : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Print Footer */}
          <div className="print-footer print-only">
            <p>Scribbles Learning Center - Confidential</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
