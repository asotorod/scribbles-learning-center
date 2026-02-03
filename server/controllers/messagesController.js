const db = require('../config/database');

// ============================================
// ADMIN: Send message to a parent
// POST /api/v1/parents/:id/messages
// ============================================
const sendMessage = async (req, res) => {
  try {
    const { id: recipientParentId } = req.params;
    const { subject, body } = req.body;

    // Look up the parent's user_id from the parents table
    const parentResult = await db.query(
      `SELECT p.id, p.user_id, u.first_name, u.last_name
       FROM parents p JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [recipientParentId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }

    const parent = parentResult.rows[0];

    const result = await db.query(`
      INSERT INTO messages (sender_id, sender_role, recipient_id, recipient_role, subject, body)
      VALUES ($1, $2, $3, 'parent', $4, $5)
      RETURNING *
    `, [req.user.id, req.user.role, parent.user_id, subject, body]);

    const message = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        message: {
          id: message.id,
          recipientName: `${parent.first_name} ${parent.last_name}`,
          subject: message.subject,
          body: message.body,
          createdAt: message.created_at,
        },
        statusMessage: 'Message sent successfully',
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// ============================================
// ADMIN: List sent messages (paginated)
// GET /api/v1/parents/messages/sent
// ============================================
const getSentMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT m.id, m.subject, m.body, m.read_at, m.created_at,
             u.first_name, u.last_name
      FROM messages m
      JOIN users u ON m.recipient_id = u.id
      WHERE m.sender_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM messages WHERE sender_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        messages: result.rows.map(m => ({
          id: m.id,
          recipientName: `${m.first_name} ${m.last_name}`,
          subject: m.subject,
          body: m.body,
          isRead: !!m.read_at,
          readAt: m.read_at,
          createdAt: m.created_at,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent messages' });
  }
};

// ============================================
// PORTAL: Get parent's inbox (paginated)
// GET /api/v1/portal/messages
// ============================================
const getInbox = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT m.id, m.subject, m.body, m.read_at, m.created_at,
             m.sender_role,
             u.first_name AS sender_first_name, u.last_name AS sender_last_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.recipient_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM messages WHERE recipient_id = $1',
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        messages: result.rows.map(m => ({
          id: m.id,
          subject: m.subject,
          body: m.body,
          senderName: `${m.sender_first_name} ${m.sender_last_name}`,
          senderRole: m.sender_role,
          isRead: !!m.read_at,
          readAt: m.read_at,
          createdAt: m.created_at,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

// ============================================
// PORTAL: Mark message as read
// PUT /api/v1/portal/messages/:id/read
// ============================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE messages SET read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [id, req.user.id]
    );

    res.json({ success: true, data: { message: 'Message marked as read' } });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark message as read' });
  }
};

// ============================================
// PORTAL: Get unread message count
// GET /api/v1/portal/messages/unread-count
// ============================================
const getUnreadMessageCount = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM messages WHERE recipient_id = $1 AND read_at IS NULL',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { unreadCount: parseInt(result.rows[0].count) },
    });
  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};

module.exports = {
  sendMessage,
  getSentMessages,
  getInbox,
  markAsRead,
  getUnreadMessageCount,
};
