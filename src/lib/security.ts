/**
 * Security utilities for TechTrendi
 * Protects against XSS, SQL injection, and other common attacks
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize HTML content - removes dangerous tags and attributes
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') return '';

  // Remove script tags and content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: URLs
  clean = clean.replace(/javascript\s*:/gi, '');

  // Remove data: URLs (can contain scripts)
  clean = clean.replace(/data\s*:/gi, '');

  // Remove iframe, object, embed tags
  clean = clean.replace(/<(iframe|object|embed|form)[^>]*>.*?<\/\1>/gi, '');
  clean = clean.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '');

  return clean;
}

/**
 * Validate and sanitize URL to prevent open redirects and XSS
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url, window.location.origin);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    // Block javascript: protocol
    if (parsed.href.toLowerCase().includes('javascript:')) {
      return '';
    }

    return parsed.href;
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitize SQL-like input (for client-side validation before sending to Supabase)
 */
export function sanitizeForQuery(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b)/gi,
    /(--)/g,
    /(;)/g,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
  ];

  let clean = input;
  sqlPatterns.forEach(pattern => {
    clean = clean.replace(pattern, '');
  });

  return clean.trim();
}

/**
 * Rate limiter for client-side rate limiting
 */
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.timestamps.get(key) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.timestamps.set(key, validTimestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.timestamps.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  reset(key: string): void {
    this.timestamps.delete(key);
  }
}

// Export singleton rate limiters for different purposes
export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 auth attempts per 5 minutes
export const toolsRateLimiter = new RateLimiter(20, 60000); // 20 tool uses per minute

/**
 * Generate a secure random string (for CSRF tokens, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Avoid repeated characters');
  }

  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score--;
    feedback.push('Avoid common patterns');
  }

  return { score: Math.max(0, Math.min(5, score)), feedback };
}

/**
 * Content Security Policy nonce generator
 */
export function generateCSPNonce(): string {
  return generateSecureToken(16);
}
