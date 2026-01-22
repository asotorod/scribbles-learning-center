const db = require('../config/database');
const { validationResult } = require('express-validator');

// ==================== JOB POSTINGS ====================

// GET /api/v1/hr/jobs - List job postings
const getJobs = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id,
        title,
        employment_type,
        description,
        requirements,
        salary_range,
        is_active,
        created_at,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_posting_id = job_postings.id) as application_count
      FROM job_postings
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status === 'active') {
      query += ` AND is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND is_active = false`;
    }

    // Get count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM job_postings WHERE 1=1` +
      (status === 'active' ? ' AND is_active = true' : '') +
      (status === 'inactive' ? ' AND is_active = false' : ''),
      []
    );

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        jobs: result.rows.map(job => ({
          id: job.id,
          title: job.title,
          employmentType: job.employment_type,
          description: job.description,
          requirements: job.requirements,
          salaryRange: job.salary_range,
          isActive: job.is_active,
          applicationCount: parseInt(job.application_count),
          createdAt: job.created_at
        })),
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job postings'
    });
  }
};

// POST /api/v1/hr/jobs - Create job posting
const createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      title,
      employmentType,
      description,
      requirements,
      salaryRange,
      isActive = true
    } = req.body;

    const result = await db.query(`
      INSERT INTO job_postings (
        title, employment_type, description,
        requirements, salary_range, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      title,
      employmentType,
      description,
      requirements,
      salaryRange,
      isActive
    ]);

    const job = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          employmentType: job.employment_type,
          description: job.description,
          requirements: job.requirements,
          salaryRange: job.salary_range,
          isActive: job.is_active,
          createdAt: job.created_at
        },
        message: 'Job posting created successfully'
      }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job posting'
    });
  }
};

// PUT /api/v1/hr/jobs/:id - Update job posting
const updateJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const {
      title,
      employmentType,
      description,
      requirements,
      salaryRange,
      isActive
    } = req.body;

    // Check job exists
    const existingJob = await db.query(
      'SELECT id FROM job_postings WHERE id = $1',
      [id]
    );

    if (existingJob.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (employmentType !== undefined) {
      updateFields.push(`employment_type = $${paramIndex++}`);
      updateValues.push(employmentType);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (requirements !== undefined) {
      updateFields.push(`requirements = $${paramIndex++}`);
      updateValues.push(requirements);
    }
    if (salaryRange !== undefined) {
      updateFields.push(`salary_range = $${paramIndex++}`);
      updateValues.push(salaryRange);
    }
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateValues.push(id);

    const result = await db.query(
      `UPDATE job_postings SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    const job = result.rows[0];

    res.json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
          employmentType: job.employment_type,
          description: job.description,
          requirements: job.requirements,
          salaryRange: job.salary_range,
          isActive: job.is_active,
          createdAt: job.created_at
        },
        message: 'Job posting updated successfully'
      }
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job posting'
    });
  }
};

// DELETE /api/v1/hr/jobs/:id - Delete job posting
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Check job exists
    const existingJob = await db.query(
      'SELECT id FROM job_postings WHERE id = $1',
      [id]
    );

    if (existingJob.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found'
      });
    }

    // Check for applications
    const appCount = await db.query(
      'SELECT COUNT(*) FROM job_applications WHERE job_posting_id = $1',
      [id]
    );

    if (parseInt(appCount.rows[0].count) > 0) {
      // Soft delete by deactivating
      await db.query(
        'UPDATE job_postings SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return res.json({
        success: true,
        data: {
          message: 'Job posting deactivated (has applications)'
        }
      });
    }

    // Hard delete if no applications
    await db.query('DELETE FROM job_postings WHERE id = $1', [id]);

    res.json({
      success: true,
      data: {
        message: 'Job posting deleted successfully'
      }
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job posting'
    });
  }
};

// ==================== APPLICATIONS ====================

// GET /api/v1/hr/applications - List applications
const getApplications = async (req, res) => {
  try {
    const { jobId, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        ja.id,
        ja.job_posting_id,
        jp.title as job_title,
        ja.applicant_name,
        ja.email,
        ja.phone,
        ja.resume_url,
        ja.cover_letter,
        ja.status,
        ja.notes,
        ja.created_at
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (jobId) {
      query += ` AND ja.job_posting_id = $${paramIndex++}`;
      params.push(jobId);
    }

    if (status) {
      query += ` AND ja.status = $${paramIndex++}`;
      params.push(status);
    }

    // Get count
    let countQuery = `SELECT COUNT(*) FROM job_applications ja WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (jobId) {
      countQuery += ` AND ja.job_posting_id = $${countParamIndex++}`;
      countParams.push(jobId);
    }

    if (status) {
      countQuery += ` AND ja.status = $${countParamIndex++}`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);

    query += ` ORDER BY ja.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        applications: result.rows.map(app => ({
          id: app.id,
          jobPostingId: app.job_posting_id,
          jobTitle: app.job_title,
          applicantName: app.applicant_name,
          applicantEmail: app.email,
          applicantPhone: app.phone,
          resumeUrl: app.resume_url,
          coverLetter: app.cover_letter,
          status: app.status,
          notes: app.notes,
          createdAt: app.created_at
        })),
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
};

// GET /api/v1/hr/applications/:id - Single application
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        ja.id,
        ja.job_posting_id,
        jp.title as job_title,
        jp.employment_type as job_employment_type,
        ja.applicant_name,
        ja.email,
        ja.phone,
        ja.resume_url,
        ja.cover_letter,
        ja.status,
        ja.notes,
        ja.created_at
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      WHERE ja.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const app = result.rows[0];

    res.json({
      success: true,
      data: {
        application: {
          id: app.id,
          jobPosting: {
            id: app.job_posting_id,
            title: app.job_title,
            employmentType: app.job_employment_type
          },
          applicantName: app.applicant_name,
          applicantEmail: app.email,
          applicantPhone: app.phone,
          resumeUrl: app.resume_url,
          coverLetter: app.cover_letter,
          status: app.status,
          notes: app.notes,
          createdAt: app.created_at
        }
      }
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
};

// PUT /api/v1/hr/applications/:id - Update status
const updateApplication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check application exists
    const existingApp = await db.query(
      'SELECT id, status FROM job_applications WHERE id = $1',
      [id]
    );

    if (existingApp.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Build update
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateValues.push(id);

    const result = await db.query(`
      UPDATE job_applications SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    const app = result.rows[0];

    res.json({
      success: true,
      data: {
        application: {
          id: app.id,
          jobPostingId: app.job_posting_id,
          applicantName: app.applicant_name,
          applicantEmail: app.email,
          status: app.status,
          notes: app.notes,
          createdAt: app.created_at
        },
        message: 'Application updated successfully'
      }
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
};

module.exports = {
  // Jobs
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  // Applications
  getApplications,
  getApplicationById,
  updateApplication
};
