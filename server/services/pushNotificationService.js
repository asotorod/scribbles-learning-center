const { Expo } = require('expo-server-sdk');
const db = require('../config/database');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to specific Expo push tokens
 * @param {string[]} pushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendPushNotifications = async (pushTokens, title, body, data = {}) => {
  // Filter out invalid tokens
  const validTokens = pushTokens.filter(token => token && Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('No valid push tokens to send to');
    return { sent: 0, failed: 0 };
  }

  // Create messages for each token
  const messages = validTokens.map(pushToken => ({
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  }));

  // Chunk messages (Expo recommends sending in batches)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);

      // Count successes and failures
      ticketChunk.forEach(ticket => {
        if (ticket.status === 'ok') {
          sent++;
        } else {
          failed++;
          console.error('Push notification error:', ticket.message);
        }
      });
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
      failed += chunk.length;
    }
  }

  console.log(`Push notifications sent: ${sent} success, ${failed} failed`);
  return { sent, failed, tickets };
};

/**
 * Send check-in notification to all parents of a child
 * @param {string} childId - The child's ID
 * @param {string} childName - The child's full name
 * @param {string} checkInTime - Formatted check-in time
 */
const sendCheckInNotification = async (childId, childName, checkInTime) => {
  try {
    console.log(`[PUSH] Sending check-in notification for child: ${childName} (${childId})`);

    // Get all parent push tokens for this child
    const result = await db.query(`
      SELECT DISTINCT u.id, u.email, u.expo_push_token
      FROM users u
      JOIN parents p ON p.user_id = u.id
      JOIN parent_children pc ON pc.parent_id = p.id
      WHERE pc.child_id = $1
        AND u.is_active = true
    `, [childId]);

    console.log(`[PUSH] Found ${result.rows.length} parent(s) for child ${childName}:`);
    result.rows.forEach(r => {
      console.log(`[PUSH]   - ${r.email}: token=${r.expo_push_token ? 'YES' : 'NO'}`);
    });

    const pushTokens = result.rows
      .filter(r => r.expo_push_token)
      .map(r => r.expo_push_token);

    if (pushTokens.length === 0) {
      console.log(`[PUSH] No push tokens found for child ${childId} - parents have no tokens registered`);
      return { sent: 0, failed: 0 };
    }

    console.log(`[PUSH] Sending to ${pushTokens.length} token(s)`);

    return await sendPushNotifications(
      pushTokens,
      'Child Checked In',
      `${childName} has been checked in at ${checkInTime}`,
      {
        type: 'check_in',
        childId,
        childName,
        time: checkInTime,
      }
    );
  } catch (error) {
    console.error('Error sending check-in notification:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
};

/**
 * Send check-out notification to all parents of a child
 * @param {string} childId - The child's ID
 * @param {string} childName - The child's full name
 * @param {string} checkOutTime - Formatted check-out time
 */
const sendCheckOutNotification = async (childId, childName, checkOutTime) => {
  try {
    console.log(`[PUSH] Sending check-out notification for child: ${childName} (${childId})`);

    // Get all parent push tokens for this child
    const result = await db.query(`
      SELECT DISTINCT u.id, u.email, u.expo_push_token
      FROM users u
      JOIN parents p ON p.user_id = u.id
      JOIN parent_children pc ON pc.parent_id = p.id
      WHERE pc.child_id = $1
        AND u.is_active = true
    `, [childId]);

    console.log(`[PUSH] Found ${result.rows.length} parent(s) for child ${childName}:`);
    result.rows.forEach(r => {
      console.log(`[PUSH]   - ${r.email}: token=${r.expo_push_token ? 'YES' : 'NO'}`);
    });

    const pushTokens = result.rows
      .filter(r => r.expo_push_token)
      .map(r => r.expo_push_token);

    if (pushTokens.length === 0) {
      console.log(`[PUSH] No push tokens found for child ${childId} - parents have no tokens registered`);
      return { sent: 0, failed: 0 };
    }

    console.log(`[PUSH] Sending to ${pushTokens.length} token(s)`);

    return await sendPushNotifications(
      pushTokens,
      'Child Checked Out',
      `${childName} has been checked out at ${checkOutTime}`,
      {
        type: 'check_out',
        childId,
        childName,
        time: checkOutTime,
      }
    );
  } catch (error) {
    console.error('Error sending check-out notification:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
};

/**
 * Save a user's Expo push token
 * @param {string} userId - The user's ID
 * @param {string} pushToken - The Expo push token
 */
const savePushToken = async (userId, pushToken) => {
  console.log(`[PUSH] Saving push token for user ${userId}: ${pushToken}`);

  if (!Expo.isExpoPushToken(pushToken)) {
    console.log(`[PUSH] Invalid token format: ${pushToken}`);
    throw new Error('Invalid Expo push token format');
  }

  const result = await db.query(
    'UPDATE users SET expo_push_token = $1 WHERE id = $2 RETURNING email',
    [pushToken, userId]
  );

  console.log(`[PUSH] Token saved successfully for user: ${result.rows[0]?.email || userId}`);
};

/**
 * Remove a user's Expo push token
 * @param {string} userId - The user's ID
 */
const removePushToken = async (userId) => {
  await db.query(
    'UPDATE users SET expo_push_token = NULL WHERE id = $1',
    [userId]
  );
};

module.exports = {
  sendPushNotifications,
  sendCheckInNotification,
  sendCheckOutNotification,
  savePushToken,
  removePushToken,
};
