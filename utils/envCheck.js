/**
 * Environment Configuration Check
 * Validates that all required environment variables are set
 */

const logger = require('./logger');

/**
 * Check if required environment variables are set
 */
function checkEnvironment() {
  const warnings = [];
  const errors = [];

  // Check critical settings
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'your-secret-key-change-in-production') {
    warnings.push('SESSION_SECRET not set or using default value. Please set a secure session secret.');
  }

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    warnings.push('SESSION_SECRET is too short. Use at least 32 characters for security.');
  }

  // Check production settings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FORCE_HTTPS || process.env.FORCE_HTTPS !== 'true') {
      warnings.push('FORCE_HTTPS not enabled in production mode.');
    }

    if (process.env.BCRYPT_ROUNDS && parseInt(process.env.BCRYPT_ROUNDS) < 12) {
      warnings.push('BCRYPT_ROUNDS should be at least 12 in production.');
    }
  }

  // Log warnings and errors
  if (warnings.length > 0) {
    logger.warn('Environment configuration warnings:');
    warnings.forEach(warning => {
      logger.warn(`  - ${warning}`);
      console.warn(`⚠ ${warning}`);
    });
  }

  if (errors.length > 0) {
    logger.error('Environment configuration errors:');
    errors.forEach(error => {
      logger.error(`  - ${error}`);
      console.error(`✗ ${error}`);
    });
    return false;
  }

  if (warnings.length === 0 && errors.length === 0) {
    logger.info('Environment configuration validated successfully');
    console.log('✓ Environment configuration is valid');
  }

  return true;
}

/**
 * Get configuration summary
 */
function getConfigSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    sessionTimeout: process.env.SESSION_TIMEOUT_MINUTES || 15,
    bcryptRounds: process.env.BCRYPT_ROUNDS || 12,
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS || 5,
    lockoutDuration: process.env.LOCKOUT_DURATION_MINUTES || 15,
    forceHttps: process.env.FORCE_HTTPS === 'true',
    uploadLimit: process.env.UPLOAD_LIMIT_MB || 5,
  };
}

module.exports = {
  checkEnvironment,
  getConfigSummary,
};
