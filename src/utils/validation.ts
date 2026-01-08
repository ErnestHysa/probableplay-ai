/**
 * Validation Utilities
 *
 * Input validation and sanitization functions.
 */

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string, maxLength = 100): string => {
  if (typeof input !== 'string') return '';
  // Remove potentially dangerous characters
  let sanitized = input.trim().slice(0, maxLength);
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string;
} => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  const strengthMap = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return {
    score,
    feedback: score <= 2 ? feedback.join(', ') : strengthMap[score],
  };
};

/**
 * Validate prediction probabilities sum to ~100%
 */
export const validateProbabilities = (probabilities: {
  homeWin: number;
  draw: number;
  awayWin: number;
}): { valid: boolean; sum: number; normalized?: typeof probabilities } => {
  const sum = probabilities.homeWin + probabilities.draw + probabilities.awayWin;

  // Allow 10% tolerance
  if (Math.abs(sum - 1.0) <= 0.1) {
    return { valid: true, sum };
  }

  // Normalize to sum to 1
  return {
    valid: false,
    sum,
    normalized: {
      homeWin: probabilities.homeWin / sum,
      draw: probabilities.draw / sum,
      awayWin: probabilities.awayWin / sum,
    },
  };
};

export default {
  sanitizeInput,
  isValidEmail,
  getPasswordStrength,
  validateProbabilities,
};
