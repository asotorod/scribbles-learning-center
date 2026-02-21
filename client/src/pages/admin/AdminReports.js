import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/ui/Card';
import { attendanceAPI, timeclockAPI } from '../../services/api';
import './AdminReports.css';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return getLocalDateString(date);
};

const getWeekEnd = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? 0 : 7);
  date.setDate(diff);
  return getLocalDateString(date);
};

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [reportData, setReportData] = useState(null);
  const [employeeDailyData, setEmployeeDailyData] = useState(null);
  const [employeeWeeklyData, setEmployeeWeeklyData] = useState(null);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [weekEnd, setWeekEnd] = useState(getWeekEnd());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceReport(selectedDate);
    else if (activeTab === 'employee-daily') fetchEmployeeDailyReport(selectedDate);
    else if (activeTab === 'employee-weekly') fetchEmployeeWeeklyReport(weekStart, weekEnd);
  }, [activeTab, selectedDate, weekStart, weekEnd]);

  const fetchAttendanceReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const response = await attendanceAPI.getReport(date);
      setReportData(response?.data?.data || null);
    } catch (err) {
      console.error('Error:', err);
      setError('Could not load report. The server may still be deploying.');
      setReportData(null);
    } finally { setLoading(false); }
  };

  const fetchEmployeeDailyReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const response = await timeclockAPI.getDailyReport(date);
      setEmployeeDailyData(response?.data?.data || null);
    } catch (err) {
      console.error('Error:', err);
      setError('Could not load employee daily report.');
      setEmployeeDailyData(null);
    } finally { setLoading(false); }
  };

  const fetchEmployeeWeeklyReport = async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const response = await timeclockAPI.getWeeklyReport(start, end);
      setEmployeeWeeklyData(response?.data?.data || null);
    } catch (err) {
      console.error('Error:', err);
      setError('Could not load employee weekly report.');
      setEmployeeWeeklyData(null);
    } finally { setLoading(false); }
  };

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handlePrint = () => window.print();

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateDisplay = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const isToday = selectedDate === getLocalDateString();

  return (
    <div className="admin-reports">
      {/* Header */}
      <div className="admin-page-header reports-header no-print">
        <div>
          <h1>Reports</h1>
          <p>View and print attendance and employee reports</p>
        </div>
        <div className="report-actions">
          {(activeTab === 'attendance' || activeTab === 'employee-daily') && (
            <input type="date" className="date-picker" value={selectedDate} onChange={handleDateChange} max={getLocalDateString()} />
          )}
          {activeTab === 'employee-weekly' && (
            <div className="week-range-picker">
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
              <span>to</span>
              <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} />
            </div>
          )}
          <button className="btn-print" onClick={handlePrint}>
            <span>🖨️</span> Print / PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-header print-only">
        <h1>Scribbles Learning Center</h1>
        <h2>{activeTab === 'attendance' ? 'Attendance Report' : activeTab === 'employee-daily' ? 'Employee Daily Report' : 'Employee Weekly Report'}</h2>
        <p className="print-date">
          {activeTab === 'employee-weekly' ? `${formatDateDisplay(weekStart)} - ${formatDateDisplay(weekEnd)}` : formatDateDisplay(selectedDate)}
        </p>
        <p className="print-generated">Generated: {new Date().toLocaleString('en-US')}</p>
      </div>

      {/* Tabs */}
      <div className="report-tabs no-print">
        <button className={`report-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          📋 Attendance
        </button>
        <button className={`report-tab ${activeTab === 'employee-daily' ? 'active' : ''}`} onClick={() => setActiveTab('employee-daily')}>
          👤 Employee Daily
        </button>
        <button className={`report-tab ${activeTab === 'employee-weekly' ? 'active' : ''}`} onClick={() => setActiveTab('employee-weekly')}>
          📊 Employee Weekly
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loading-spinner" /><p>Loading report...</p></div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Unable to Load Report</h3>
          <p>{error}</p>
          <button className="btn-print" style={{ marginTop: '16px' }} onClick={() => {
            if (activeTab === 'attendance') fetchAttendanceReport(selectedDate);
            else if (activeTab === 'employee-daily') fetchEmployeeDailyReport(selectedDate);
            else fetchEmployeeWeeklyReport(weekStart, weekEnd);
          }}>Retry</button>
        </div>
      ) : (
        <>
          {/* ========== ATTENDANCE REPORT ========== */}
          {activeTab === 'attendance' && reportData && (
            <>
              <div className="report-stats no-print">
                <StatCard icon="👶" value={reportData.stats?.expected || 0} label="Expected" />
                <StatCard icon="✅" value={reportData.stats?.totalAttended || 0} label="Attended" variant="success" />
                <StatCard icon="🏠" value={reportData.stats?.absent || 0} label="Absent" />
                <StatCard icon="👋" value={reportData.stats?.checkedOut || 0} label="Checked Out" />
              </div>

              <div className="print-stats print-only">
                <div className="print-stat"><span className="print-stat-value">{reportData.stats?.expected || 0}</span><span className="print-stat-label">Expected</span></div>
                <div className="print-stat"><span className="print-stat-value">{reportData.stats?.totalAttended || 0}</span><span className="print-stat-label">Attended</span></div>
                <div className="print-stat"><span className="print-stat-value">{reportData.stats?.absent || 0}</span><span className="print-stat-label">Absent</span></div>
                <div className="print-stat"><span className="print-stat-value">{reportData.stats?.checkedOut || 0}</span><span className="print-stat-label">Checked Out</span></div>
              </div>

              <div className="report-date-banner no-print">
                <h2>{isToday ? "Today's Report" : formatDateDisplay(selectedDate)}</h2>
              </div>

              {reportData.byProgram && reportData.byProgram.length > 0 && (
                <div className="report-section">
                  <h3>Attendance by Program</h3>
                  <div className="program-breakdown">
                    {reportData.byProgram.map((prog) => (
                      <div key={prog.id} className="program-row">
                        <div className="program-name">
                          <span className="program-dot" style={{ background: prog.color || '#6B7280' }} />
                          {prog.name}
                        </div>
                        <div className="program-counts">
                          <span className="count-item"><strong>{prog.checkedIn + prog.checkedOut}</strong> attended</span>
                          <span className="count-sep">/</span>
                          <span className="count-item">{prog.enrolled} enrolled</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="report-section">
                <h3>Children Who Attended ({(reportData.checkins || []).length})</h3>
                {(reportData.checkins || []).length === 0 ? (
                  <p className="empty-message">No check-ins recorded for this date.</p>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Child Name</th><th>Program</th><th>Check In</th><th>Check Out</th><th>Checked In By</th><th className="no-print">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.checkins.map((checkin, idx) => (
                        <tr key={checkin.id}>
                          <td>{idx + 1}</td>
                          <td><div className="child-cell"><div className="child-avatar-sm">{checkin.childName?.charAt(0) || '?'}</div><span>{checkin.childName}</span></div></td>
                          <td><span className="program-tag" style={{ background: checkin.programColor ? `${checkin.programColor}20` : '#f3f4f6', color: checkin.programColor || '#6B7280' }}>{checkin.programName || '-'}</span></td>
                          <td>{formatTime(checkin.checkInTime)}</td>
                          <td>{formatTime(checkin.checkOutTime)}</td>
                          <td>{checkin.checkedInBy || '-'}</td>
                          <td className="no-print"><span className={`status-badge status-${checkin.status}`}>{checkin.status === 'checked_in' ? 'Present' : 'Checked Out'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="report-section">
                <h3>Absent Children ({(reportData.absences || []).length})</h3>
                {(reportData.absences || []).length === 0 ? (
                  <p className="empty-message">No absences reported for this date.</p>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr><th>#</th><th>Child Name</th><th>Reason</th><th>Reported By</th><th>Notes</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {reportData.absences.map((absence, idx) => (
                        <tr key={absence.id}>
                          <td>{idx + 1}</td>
                          <td><div className="child-cell"><div className="child-avatar-sm absent">{absence.childName?.charAt(0) || '?'}</div><span>{absence.childName}</span></div></td>
                          <td>{absence.reasonName || 'Not specified'}</td>
                          <td>{absence.reportedBy || 'Parent'}</td>
                          <td>{absence.notes || '-'}</td>
                          <td><span className={`status-badge status-${absence.status}`}>{absence.status === 'acknowledged' ? 'Acknowledged' : 'Pending'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'attendance' && !reportData && !error && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No report data available</h3>
              <p>Select a date to view the attendance report.</p>
            </div>
          )}

          {/* ========== EMPLOYEE DAILY REPORT ========== */}
          {activeTab === 'employee-daily' && employeeDailyData && (
            <>
              <div className="report-stats no-print">
                <StatCard icon="👥" value={employeeDailyData.stats?.totalEmployees || 0} label="Total Staff" />
                <StatCard icon="✅" value={employeeDailyData.stats?.employeesWorked || 0} label="Worked" variant="success" />
                <StatCard icon="🏠" value={employeeDailyData.stats?.employeesAbsent || 0} label="Absent" />
                <StatCard icon="⏱️" value={employeeDailyData.stats?.totalWorkHours || '0'} label="Total Hours" />
              </div>

              <div className="print-stats print-only">
                <div className="print-stat"><span className="print-stat-value">{employeeDailyData.stats?.totalEmployees || 0}</span><span className="print-stat-label">Total Staff</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeDailyData.stats?.employeesWorked || 0}</span><span className="print-stat-label">Worked</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeDailyData.stats?.employeesAbsent || 0}</span><span className="print-stat-label">Absent</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeDailyData.stats?.totalWorkHours || '0'}</span><span className="print-stat-label">Total Hours</span></div>
              </div>

              <div className="report-date-banner no-print">
                <h2>{isToday ? "Today's Employee Report" : `Employee Report - ${formatDateDisplay(selectedDate)}`}</h2>
              </div>

              {employeeDailyData.stats?.openPunches > 0 && (
                <div className="report-alert no-print">
                  ⚠️ {employeeDailyData.stats.openPunches} employee(s) have open punches that need attention
                </div>
              )}

              <div className="report-section">
                <h3>Employee Hours</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Employee</th><th>Position</th><th>First In</th><th>Last Out</th>
                      <th>Work Hours</th><th>Lunch</th><th>Punches</th><th className="no-print">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(employeeDailyData.employees || []).map((emp, idx) => (
                      <tr key={emp.employeeId} className={!emp.worked ? 'absent-row' : ''}>
                        <td>{idx + 1}</td>
                        <td><strong>{emp.firstName} {emp.lastName}</strong></td>
                        <td>{emp.position || '-'}</td>
                        <td>{formatTime(emp.firstIn)}</td>
                        <td>{formatTime(emp.lastOut)}</td>
                        <td><strong>{emp.workHours}h</strong></td>
                        <td>{emp.lunchMinutes > 0 ? `${emp.lunchHours}h` : '-'}</td>
                        <td>
                          {emp.punches.length === 0 ? '-' : (
                            <div className="punch-details">
                              {emp.punches.map((p, i) => (
                                <div key={i} className={`punch-detail ${p.entryType === 'lunch_break' ? 'lunch' : ''}`}>
                                  {p.entryType === 'lunch_break' ? '🍽️' : '⏱️'} {formatTime(p.clockIn)} → {formatTime(p.clockOut)}
                                  {p.wasAdjusted && <span className="adjusted-marker" title={p.adjustmentReason}>✎</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="no-print">
                          {!emp.worked ? (
                            <span className="status-badge status-absent">Absent</span>
                          ) : emp.hasOpenPunch ? (
                            <span className="status-badge status-warning">Open Punch</span>
                          ) : (
                            <span className="status-badge status-checked_out">Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'employee-daily' && !employeeDailyData && !error && (
            <div className="empty-state"><div className="empty-icon">👤</div><h3>No data available</h3><p>Select a date to view the employee daily report.</p></div>
          )}

          {/* ========== EMPLOYEE WEEKLY REPORT ========== */}
          {activeTab === 'employee-weekly' && employeeWeeklyData && (
            <>
              <div className="report-stats no-print">
                <StatCard icon="👥" value={employeeWeeklyData.summary?.totalEmployees || 0} label="Total Staff" />
                <StatCard icon="✅" value={employeeWeeklyData.summary?.employeesWithHours || 0} label="With Hours" variant="success" />
                <StatCard icon="⏱️" value={employeeWeeklyData.summary?.totalWorkHours || '0'} label="Total Hours" />
                <StatCard icon="⚠️" value={employeeWeeklyData.summary?.openPunches || 0} label="Open Punches" />
              </div>

              <div className="print-stats print-only">
                <div className="print-stat"><span className="print-stat-value">{employeeWeeklyData.summary?.totalEmployees || 0}</span><span className="print-stat-label">Total Staff</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeWeeklyData.summary?.employeesWithHours || 0}</span><span className="print-stat-label">With Hours</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeWeeklyData.summary?.totalWorkHours || '0'}</span><span className="print-stat-label">Total Hours</span></div>
                <div className="print-stat"><span className="print-stat-value">{employeeWeeklyData.summary?.openPunches || 0}</span><span className="print-stat-label">Open Punches</span></div>
              </div>

              <div className="report-date-banner no-print">
                <h2>Weekly Report: {formatDateDisplay(weekStart)} — {formatDateDisplay(weekEnd)}</h2>
              </div>

              <div className="report-section">
                <h3>Employee Summary</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Employee</th><th>Position</th><th>Department</th>
                      <th>Work Hours</th><th>Lunch Hours</th><th>Rate</th><th>Est. Pay</th><th className="no-print">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(employeeWeeklyData.employees || []).map((emp, idx) => (
                      <tr key={emp.employeeId}>
                        <td>{idx + 1}</td>
                        <td><strong>{emp.firstName} {emp.lastName}</strong></td>
                        <td>{emp.position || '-'}</td>
                        <td>{emp.department || '-'}</td>
                        <td><strong>{emp.workHours}h</strong></td>
                        <td>{emp.lunchMinutes > 0 ? `${(emp.lunchMinutes / 60).toFixed(1)}h` : '-'}</td>
                        <td>{emp.hourlyRate ? `$${emp.hourlyRate.toFixed(2)}` : '-'}</td>
                        <td>{emp.estimatedPay ? `$${emp.estimatedPay}` : '-'}</td>
                        <td className="no-print">
                          {emp.openPunches > 0 && <span className="status-badge status-warning">{emp.openPunches}</span>}
                        </td>
                      </tr>
                    ))}
                    {(employeeWeeklyData.employees || []).length > 0 && (
                      <tr className="total-row">
                        <td colSpan={4}><strong>TOTALS</strong></td>
                        <td><strong>{employeeWeeklyData.summary?.totalWorkHours || '0'}h</strong></td>
                        <td>{employeeWeeklyData.summary?.totalLunchMinutes > 0 ? `${(employeeWeeklyData.summary.totalLunchMinutes / 60).toFixed(1)}h` : '-'}</td>
                        <td>-</td>
                        <td><strong>
                          ${(employeeWeeklyData.employees || []).reduce((sum, emp) => sum + (parseFloat(emp.estimatedPay) || 0), 0).toFixed(2)}
                        </strong></td>
                        <td className="no-print"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(employeeWeeklyData.dailyBreakdown || []).length > 0 && (
                <div className="report-section">
                  <h3>Daily Breakdown</h3>
                  <table className="report-table">
                    <thead>
                      <tr><th>Date</th><th>Employees Worked</th><th>Work Hours</th><th>Lunch Hours</th></tr>
                    </thead>
                    <tbody>
                      {employeeWeeklyData.dailyBreakdown.map((day) => (
                        <tr key={day.date}>
                          <td>{formatDateDisplay(typeof day.date === 'string' ? day.date.split('T')[0] : day.date)}</td>
                          <td>{day.employeesWorked}</td>
                          <td>{day.workHours}h</td>
                          <td>{day.lunchMinutes > 0 ? `${(day.lunchMinutes / 60).toFixed(1)}h` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'employee-weekly' && !employeeWeeklyData && !error && (
            <div className="empty-state"><div className="empty-icon">📊</div><h3>No data available</h3><p>Select a date range to view the weekly report.</p></div>
          )}
        </>
      )}

      <div className="print-footer print-only">
        <p>Scribbles Learning Center - Confidential</p>
      </div>
    </div>
  );
};

export default AdminReports;
