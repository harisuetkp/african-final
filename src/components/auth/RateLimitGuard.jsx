import { base44 } from '@/api/base44Client';

// Client-side rate limiting helper
export const checkRateLimit = async (action, identifier) => {
  try {
    const response = await base44.functions.invoke('rateLimitAuth', {
      action,
      identifier
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      return {
        allowed: false,
        error: error.response.data.error || 'Too many attempts. Please try again later.'
      };
    }
    // Allow if rate limit check fails (fail open)
    console.warn('Rate limit check failed:', error);
    return { allowed: true };
  }
};

// Get client IP (approximate)
export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return 'unknown';
  }
};

// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Phone validation
export const validatePhone = (phone) => {
  const re = /^\+\d{10,15}$/;
  return re.test(phone);
};

// Password strength validation
export const validatePassword = (password) => {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain a number' };
  return { valid: true };
};