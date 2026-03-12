import DOMPurify from 'dompurify';

// Configure DOMPurify - strict for chat messages
const config = {
  ALLOWED_TAGS: [], // No HTML allowed in chat
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true // Keep text content
};

export const sanitizeHTML = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, config);
};

export const sanitizeText = (text) => {
  if (!text) return '';
  // Remove all HTML tags and scripts
  let cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  // Remove potential XSS attempts
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  return cleaned.trim();
};

// Block external links in messages (optional safety feature)
export const blockLinks = (text) => {
  if (!text) return '';
  // Remove URLs but keep the text
  return text.replace(/https?:\/\/[^\s]+/gi, '[link removed for safety]');
};

// Detect potentially harmful content
export const containsHarmfulContent = (text) => {
  const harmful = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i
  ];
  return harmful.some(pattern => pattern.test(text));
};

export const validateInput = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  phone: (phone) => {
    const regex = /^\+?[\d\s-()]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },
  
  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  length: (text, min = 1, max = 1000) => {
    const length = text?.length || 0;
    return length >= min && length <= max;
  },
  
  noSpam: (text) => {
    // Check for repeated characters or words
    const repeatedChars = /(.)\1{10,}/;
    const repeatedWords = /(\b\w+\b)(?:\s+\1){5,}/i;
    return !repeatedChars.test(text) && !repeatedWords.test(text);
  }
};

export const rateLimiter = (key, limit = 10, windowMs = 60000) => {
  const storage = window.localStorage;
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;
  
  let data = JSON.parse(storage.getItem(storageKey) || '{"attempts": [], "blocked": false}');
  
  // Remove old attempts outside window
  data.attempts = data.attempts.filter(timestamp => now - timestamp < windowMs);
  
  // Check if blocked
  if (data.attempts.length >= limit) {
    data.blocked = true;
    storage.setItem(storageKey, JSON.stringify(data));
    return false;
  }
  
  // Add new attempt
  data.attempts.push(now);
  data.blocked = false;
  storage.setItem(storageKey, JSON.stringify(data));
  
  return true;
};