/**
 * Authentication utilities for admin users
 */

/**
 * Hash a password using Web Crypto API
 * Uses PBKDF2 with SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Convert to base64 for storage
  const hashArray = new Uint8Array(hash);
  const saltAndHash = new Uint8Array(salt.length + hashArray.length);
  saltAndHash.set(salt);
  saltAndHash.set(hashArray, salt.length);
  
  return btoa(String.fromCharCode(...saltAndHash));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const saltAndHash = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    const salt = saltAndHash.slice(0, 16);
    const storedHash = saltAndHash.slice(16);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const testHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const testHashArray = new Uint8Array(testHash);
    
    // Compare arrays
    if (storedHash.length !== testHashArray.length) return false;
    
    for (let i = 0; i < storedHash.length; i++) {
      if (storedHash[i] !== testHashArray[i]) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated(Astro: any): Promise<{ authenticated: boolean; user?: any }> {
  try {
    // Check for session cookie
    const sessionToken = Astro.cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      return { authenticated: false };
    }
    
    
    // Verify session in database
    const db = Astro.locals.runtime.env.DB;
    const session = await db.prepare(`
      SELECT u.* 
      FROM admin_users u
      JOIN admin_sessions s ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first();
    
    if (session) {
      return { 
        authenticated: true, 
        user: session 
      };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('Authentication check error:', error);
    return { authenticated: false };
  }
}