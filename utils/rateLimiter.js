/**
 * Rate Limiter for SMMS
 * Prevents brute-force attacks on authentication endpoints
 * SMMS-SR-003: Security - Brute force protection
 */

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * Track login attempt
 */
function trackLoginAttempt(identifier) {
  const now = Date.now();
  
  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lockedUntil: null,
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  const record = loginAttempts.get(identifier);

  // Check if currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      locked: true,
      remainingMinutes: remainingTime,
      message: `Too many failed attempts. Please try again in ${remainingTime} minute(s).`,
    };
  }

  // Reset if attempt window has passed
  if (now - record.firstAttempt > ATTEMPT_WINDOW) {
    record.attempts = 1;
    record.firstAttempt = now;
    record.lockedUntil = null;
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Increment attempts
  record.attempts++;

  // Lock if max attempts exceeded
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION;
    const remainingTime = Math.ceil(LOCKOUT_DURATION / 1000 / 60);
    return {
      allowed: false,
      locked: true,
      remainingMinutes: remainingTime,
      message: `Too many failed attempts. Account locked for ${remainingTime} minutes.`,
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - record.attempts,
  };
}

/**
 * Reset login attempts on successful login
 */
function resetLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

/**
 * Check if identifier is currently locked out
 */
function isLockedOut(identifier) {
  const record = loginAttempts.get(identifier);
  if (!record || !record.lockedUntil) return false;
  
  const now = Date.now();
  if (now >= record.lockedUntil) {
    // Lockout period expired, reset
    loginAttempts.delete(identifier);
    return false;
  }
  
  return true;
}

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [identifier, record] of loginAttempts.entries()) {
    if (
      (!record.lockedUntil && now - record.firstAttempt > ATTEMPT_WINDOW) ||
      (record.lockedUntil && now > record.lockedUntil)
    ) {
      loginAttempts.delete(identifier);
    }
  }
}, 60 * 1000); // Clean up every minute

module.exports = {
  trackLoginAttempt,
  resetLoginAttempts,
  isLockedOut,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION,
};
