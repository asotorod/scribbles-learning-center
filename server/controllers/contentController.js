const db = require('../config/database');
const { validationResult } = require('express-validator');

// ==================== SITE CONTENT ====================

// GET /api/v1/content - List all content by page
const getAllContent = async (req, res) => {
  try {
    const { page } = req.query;

    let query = `
      SELECT
        id,
        page,
        section,
        content_key,
        content_en,
        content_es,
        content_type,
        updated_at
      FROM site_content
    `;
    const params = [];

    if (page) {
      query += ` WHERE page = $1`;
      params.push(page);
    }

    query += ` ORDER BY page, section, content_key`;

    const result = await db.query(query, params);

    // Group by page and section
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.page]) {
        grouped[row.page] = {};
      }
      if (!grouped[row.page][row.section]) {
        grouped[row.page][row.section] = {};
      }
      grouped[row.page][row.section][row.content_key] = {
        id: row.id,
        en: row.content_en,
        es: row.content_es,
        type: row.content_type,
        updatedAt: row.updated_at
      };
    }

    res.json({
      success: true,
      data: {
        content: grouped
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content'
    });
  }
};

// GET /api/v1/content/:page - Get content for specific page
const getPageContent = async (req, res) => {
  try {
    const { page } = req.params;

    const result = await db.query(`
      SELECT
        id,
        section,
        content_key,
        content_en,
        content_es,
        content_type,
        updated_at
      FROM site_content
      WHERE page = $1
      ORDER BY section, content_key
    `, [page]);

    // Group by section
    const sections = {};
    for (const row of result.rows) {
      if (!sections[row.section]) {
        sections[row.section] = {};
      }
      sections[row.section][row.content_key] = {
        id: row.id,
        en: row.content_en,
        es: row.content_es,
        type: row.content_type,
        updatedAt: row.updated_at
      };
    }

    res.json({
      success: true,
      data: {
        page,
        sections
      }
    });
  } catch (error) {
    console.error('Get page content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page content'
    });
  }
};

// PUT /api/v1/content/:page/:section/:key - Update content (en/es)
const updateContent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { page, section, key } = req.params;
    const { en, es, type } = req.body;

    // Check if content exists
    const existing = await db.query(
      'SELECT id FROM site_content WHERE page = $1 AND section = $2 AND content_key = $3',
      [page, section, key]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      const updateFields = ['updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [];
      let paramIndex = 1;

      if (en !== undefined) {
        updateFields.push(`content_en = $${paramIndex++}`);
        updateValues.push(en);
      }
      if (es !== undefined) {
        updateFields.push(`content_es = $${paramIndex++}`);
        updateValues.push(es);
      }
      if (type !== undefined) {
        updateFields.push(`content_type = $${paramIndex++}`);
        updateValues.push(type);
      }

      updateValues.push(page, section, key);

      result = await db.query(`
        UPDATE site_content SET ${updateFields.join(', ')}
        WHERE page = $${paramIndex} AND section = $${paramIndex + 1} AND content_key = $${paramIndex + 2}
        RETURNING *
      `, updateValues);
    } else {
      // Insert new
      result = await db.query(`
        INSERT INTO site_content (page, section, content_key, content_en, content_es, content_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [page, section, key, en || '', es || '', type || 'text']);
    }

    const content = result.rows[0];

    res.json({
      success: true,
      data: {
        content: {
          id: content.id,
          page: content.page,
          section: content.section,
          key: content.content_key,
          en: content.content_en,
          es: content.content_es,
          type: content.content_type,
          updatedAt: content.updated_at
        },
        message: 'Content updated successfully'
      }
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content'
    });
  }
};

// ==================== PROGRAMS ====================

// GET /api/v1/programs - List all programs (public)
const getPrograms = async (req, res) => {
  try {
    const { active = 'true' } = req.query;

    let query = `
      SELECT
        id,
        name,
        slug,
        age_range,
        description,
        features,
        image_url,
        color,
        capacity,
        sort_order,
        is_active,
        created_at
      FROM programs
    `;

    if (active === 'true') {
      query += ` WHERE is_active = true`;
    }

    query += ` ORDER BY sort_order, name`;

    const result = await db.query(query);

    res.json({
      success: true,
      data: {
        programs: result.rows.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          ageRange: p.age_range,
          description: p.description,
          features: p.features,
          imageUrl: p.image_url,
          color: p.color,
          capacity: p.capacity,
          sortOrder: p.sort_order,
          isActive: p.is_active,
          createdAt: p.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch programs'
    });
  }
};

// PUT /api/v1/programs/:id - Update program (admin)
const updateProgram = async (req, res) => {
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
      name,
      slug,
      ageRange,
      description,
      features,
      imageUrl,
      color,
      capacity,
      sortOrder,
      isActive
    } = req.body;

    // Check program exists
    const existing = await db.query('SELECT id FROM programs WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      updateValues.push(slug);
    }
    if (ageRange !== undefined) {
      updateFields.push(`age_range = $${paramIndex++}`);
      updateValues.push(ageRange);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (features !== undefined) {
      updateFields.push(`features = $${paramIndex++}`);
      updateValues.push(JSON.stringify(features));
    }
    if (imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      updateValues.push(imageUrl);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      updateValues.push(color);
    }
    if (capacity !== undefined) {
      updateFields.push(`capacity = $${paramIndex++}`);
      updateValues.push(capacity);
    }
    if (sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sortOrder);
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

    const result = await db.query(`
      UPDATE programs SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    const program = result.rows[0];

    res.json({
      success: true,
      data: {
        program: {
          id: program.id,
          name: program.name,
          slug: program.slug,
          ageRange: program.age_range,
          description: program.description,
          features: program.features,
          imageUrl: program.image_url,
          color: program.color,
          capacity: program.capacity,
          sortOrder: program.sort_order,
          isActive: program.is_active
        },
        message: 'Program updated successfully'
      }
    });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update program'
    });
  }
};

// ==================== GALLERY ====================

// GET /api/v1/gallery - List images (public, filterable by category)
const getGalleryImages = async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;

    let query = `
      SELECT
        id,
        image_url,
        thumbnail_url,
        caption_en,
        caption_es,
        category,
        sort_order,
        is_active,
        created_at
      FROM gallery_images
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (active === 'true') {
      query += ` AND is_active = true`;
    }

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    query += ` ORDER BY sort_order, created_at DESC`;

    const result = await db.query(query, params);

    // Get unique categories
    const categoriesResult = await db.query(`
      SELECT DISTINCT category FROM gallery_images WHERE category IS NOT NULL ORDER BY category
    `);

    res.json({
      success: true,
      data: {
        images: result.rows.map(img => ({
          id: img.id,
          imageUrl: img.image_url,
          thumbnailUrl: img.thumbnail_url,
          captionEn: img.caption_en,
          captionEs: img.caption_es,
          category: img.category,
          sortOrder: img.sort_order,
          isActive: img.is_active,
          createdAt: img.created_at
        })),
        categories: categoriesResult.rows.map(r => r.category)
      }
    });
  } catch (error) {
    console.error('Get gallery images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery images'
    });
  }
};

// POST /api/v1/gallery - Add image (admin)
const addGalleryImage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      imageUrl,
      thumbnailUrl,
      captionEn,
      captionEs,
      category,
      sortOrder = 0
    } = req.body;

    const result = await db.query(`
      INSERT INTO gallery_images (image_url, thumbnail_url, caption_en, caption_es, category, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [imageUrl, thumbnailUrl, captionEn, captionEs, category, sortOrder]);

    const image = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        image: {
          id: image.id,
          imageUrl: image.image_url,
          thumbnailUrl: image.thumbnail_url,
          captionEn: image.caption_en,
          captionEs: image.caption_es,
          category: image.category,
          sortOrder: image.sort_order,
          isActive: image.is_active,
          createdAt: image.created_at
        },
        message: 'Image added successfully'
      }
    });
  } catch (error) {
    console.error('Add gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add image'
    });
  }
};

// PUT /api/v1/gallery/:id - Update image caption/category
const updateGalleryImage = async (req, res) => {
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
      imageUrl,
      thumbnailUrl,
      captionEn,
      captionEs,
      category,
      sortOrder,
      isActive
    } = req.body;

    // Check image exists
    const existing = await db.query('SELECT id FROM gallery_images WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      updateValues.push(imageUrl);
    }
    if (thumbnailUrl !== undefined) {
      updateFields.push(`thumbnail_url = $${paramIndex++}`);
      updateValues.push(thumbnailUrl);
    }
    if (captionEn !== undefined) {
      updateFields.push(`caption_en = $${paramIndex++}`);
      updateValues.push(captionEn);
    }
    if (captionEs !== undefined) {
      updateFields.push(`caption_es = $${paramIndex++}`);
      updateValues.push(captionEs);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(category);
    }
    if (sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sortOrder);
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

    const result = await db.query(`
      UPDATE gallery_images SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    const image = result.rows[0];

    res.json({
      success: true,
      data: {
        image: {
          id: image.id,
          imageUrl: image.image_url,
          thumbnailUrl: image.thumbnail_url,
          captionEn: image.caption_en,
          captionEs: image.caption_es,
          category: image.category,
          sortOrder: image.sort_order,
          isActive: image.is_active
        },
        message: 'Image updated successfully'
      }
    });
  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update image'
    });
  }
};

// DELETE /api/v1/gallery/:id - Delete image
const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Check image exists
    const existing = await db.query('SELECT id FROM gallery_images WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    await db.query('DELETE FROM gallery_images WHERE id = $1', [id]);

    res.json({
      success: true,
      data: {
        message: 'Image deleted successfully'
      }
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
};

// PUT /api/v1/gallery/reorder - Update sort order
const reorderGalleryImages = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const client = await db.pool.connect();

  try {
    const { images } = req.body; // Array of { id, sortOrder }

    await client.query('BEGIN');

    for (const img of images) {
      await client.query(
        'UPDATE gallery_images SET sort_order = $1 WHERE id = $2',
        [img.sortOrder, img.id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        message: 'Gallery order updated successfully'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder gallery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder gallery'
    });
  } finally {
    client.release();
  }
};

// ==================== TESTIMONIALS ====================

// GET /api/v1/testimonials - List testimonials (public, featured first)
const getTestimonials = async (req, res) => {
  try {
    const { active = 'true', featured } = req.query;

    let query = `
      SELECT
        id,
        quote_en,
        quote_es,
        author_name,
        author_role,
        rating,
        photo_url,
        is_featured,
        sort_order,
        is_active,
        created_at
      FROM testimonials
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (active === 'true') {
      query += ` AND is_active = true`;
    }

    if (featured === 'true') {
      query += ` AND is_featured = true`;
    }

    query += ` ORDER BY is_featured DESC, sort_order, created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        testimonials: result.rows.map(t => ({
          id: t.id,
          quoteEn: t.quote_en,
          quoteEs: t.quote_es,
          authorName: t.author_name,
          authorRole: t.author_role,
          rating: t.rating,
          photoUrl: t.photo_url,
          isFeatured: t.is_featured,
          sortOrder: t.sort_order,
          isActive: t.is_active,
          createdAt: t.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testimonials'
    });
  }
};

// POST /api/v1/testimonials - Add testimonial (admin)
const addTestimonial = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      quoteEn,
      quoteEs,
      authorName,
      authorRole,
      rating,
      photoUrl,
      isFeatured = false,
      sortOrder = 0
    } = req.body;

    const result = await db.query(`
      INSERT INTO testimonials (quote_en, quote_es, author_name, author_role, rating, photo_url, is_featured, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [quoteEn, quoteEs, authorName, authorRole, rating, photoUrl, isFeatured, sortOrder]);

    const testimonial = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        testimonial: {
          id: testimonial.id,
          quoteEn: testimonial.quote_en,
          quoteEs: testimonial.quote_es,
          authorName: testimonial.author_name,
          authorRole: testimonial.author_role,
          rating: testimonial.rating,
          photoUrl: testimonial.photo_url,
          isFeatured: testimonial.is_featured,
          sortOrder: testimonial.sort_order,
          isActive: testimonial.is_active,
          createdAt: testimonial.created_at
        },
        message: 'Testimonial added successfully'
      }
    });
  } catch (error) {
    console.error('Add testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add testimonial'
    });
  }
};

// PUT /api/v1/testimonials/:id - Update testimonial
const updateTestimonial = async (req, res) => {
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
      quoteEn,
      quoteEs,
      authorName,
      authorRole,
      rating,
      photoUrl,
      isFeatured,
      sortOrder,
      isActive
    } = req.body;

    // Check testimonial exists
    const existing = await db.query('SELECT id FROM testimonials WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (quoteEn !== undefined) {
      updateFields.push(`quote_en = $${paramIndex++}`);
      updateValues.push(quoteEn);
    }
    if (quoteEs !== undefined) {
      updateFields.push(`quote_es = $${paramIndex++}`);
      updateValues.push(quoteEs);
    }
    if (authorName !== undefined) {
      updateFields.push(`author_name = $${paramIndex++}`);
      updateValues.push(authorName);
    }
    if (authorRole !== undefined) {
      updateFields.push(`author_role = $${paramIndex++}`);
      updateValues.push(authorRole);
    }
    if (rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      updateValues.push(rating);
    }
    if (photoUrl !== undefined) {
      updateFields.push(`photo_url = $${paramIndex++}`);
      updateValues.push(photoUrl);
    }
    if (isFeatured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex++}`);
      updateValues.push(isFeatured);
    }
    if (sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sortOrder);
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

    const result = await db.query(`
      UPDATE testimonials SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    const testimonial = result.rows[0];

    res.json({
      success: true,
      data: {
        testimonial: {
          id: testimonial.id,
          quoteEn: testimonial.quote_en,
          quoteEs: testimonial.quote_es,
          authorName: testimonial.author_name,
          authorRole: testimonial.author_role,
          rating: testimonial.rating,
          photoUrl: testimonial.photo_url,
          isFeatured: testimonial.is_featured,
          sortOrder: testimonial.sort_order,
          isActive: testimonial.is_active
        },
        message: 'Testimonial updated successfully'
      }
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update testimonial'
    });
  }
};

// DELETE /api/v1/testimonials/:id - Delete testimonial
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    // Check testimonial exists
    const existing = await db.query('SELECT id FROM testimonials WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    await db.query('DELETE FROM testimonials WHERE id = $1', [id]);

    res.json({
      success: true,
      data: {
        message: 'Testimonial deleted successfully'
      }
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete testimonial'
    });
  }
};

// ==================== CONTACT ====================

// POST /api/v1/contact - Submit contact form (public)
const submitContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    const result = await db.query(`
      INSERT INTO contact_inquiries (name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, phone, subject, message]);

    res.status(201).json({
      success: true,
      data: {
        message: 'Your message has been received. We will get back to you soon!'
      }
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit message'
    });
  }
};

// GET /api/v1/contact - List inquiries (admin)
const getContactInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id,
        name,
        email,
        phone,
        subject,
        message,
        is_read,
        created_at
      FROM contact_inquiries
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status === 'read') {
      query += ` AND is_read = true`;
    } else if (status === 'unread') {
      query += ` AND is_read = false`;
    }

    // Get count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM contact_inquiries WHERE 1=1` +
      (status === 'read' ? ' AND is_read = true' : '') +
      (status === 'unread' ? ' AND is_read = false' : ''),
      []
    );

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        inquiries: result.rows.map(inq => ({
          id: inq.id,
          name: inq.name,
          email: inq.email,
          phone: inq.phone,
          subject: inq.subject,
          message: inq.message,
          isRead: inq.is_read,
          createdAt: inq.created_at
        })),
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get contact inquiries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inquiries'
    });
  }
};

// PUT /api/v1/contact/:id/read - Mark as read (admin)
const markInquiryRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;

    // Check inquiry exists
    const existing = await db.query('SELECT id FROM contact_inquiries WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }

    const result = await db.query(`
      UPDATE contact_inquiries SET is_read = $1
      WHERE id = $2
      RETURNING *
    `, [isRead, id]);

    const inquiry = result.rows[0];

    res.json({
      success: true,
      data: {
        inquiry: {
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          isRead: inquiry.is_read
        },
        message: isRead ? 'Marked as read' : 'Marked as unread'
      }
    });
  } catch (error) {
    console.error('Mark inquiry read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inquiry'
    });
  }
};

module.exports = {
  // Content
  getAllContent,
  getPageContent,
  updateContent,
  // Programs
  getPrograms,
  updateProgram,
  // Gallery
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
  // Testimonials
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  // Contact
  submitContact,
  getContactInquiries,
  markInquiryRead
};
