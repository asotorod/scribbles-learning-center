/**
 * Global XSS sanitization middleware
 * Strips HTML tags from all string values in request body
 */
const stripTags = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(stripTags);
  }
  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = stripTags(value[key]);
    }
    return cleaned;
  }
  return value;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripTags(req.body);
  }
  next();
};

module.exports = { sanitizeInputs };
