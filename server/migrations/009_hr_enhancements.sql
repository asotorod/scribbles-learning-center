-- =============================================
-- HR ENHANCEMENTS: Lunch Breaks, Admin Adjustments, Employee Reports
-- =============================================

-- Add entry_type to distinguish shift vs lunch break entries
ALTER TABLE employee_timeclock
  ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) DEFAULT 'shift'
    CHECK (entry_type IN ('shift', 'lunch_break'));

-- Add admin adjustment tracking
ALTER TABLE employee_timeclock
  ADD COLUMN IF NOT EXISTS adjusted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS adjusted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Add index for faster date-based queries on timeclock
CREATE INDEX IF NOT EXISTS idx_timeclock_clock_in_date ON employee_timeclock(DATE(clock_in));
CREATE INDEX IF NOT EXISTS idx_timeclock_entry_type ON employee_timeclock(entry_type);

-- Add employment_type to employees for FT/PT tracking
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time', 'temporary', 'contractor'));
