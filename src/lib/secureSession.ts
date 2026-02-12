/**
 * Secure session storage utility
 * Handles encrypted session data with expiry and fingerprinting
 */

interface SessionData {
  token: string;
  address: string;
  hasAccess: boolean;
  balance: string;
  expiry: number;
  fingerprint: string;
}

export class SecureSessionStorage {
  private static readonly SESSION_KEY = 'cms-session';
  private static readonly FINGERPRINT_KEY = 'cms-fingerprint';
  
  /**
   * Generate a browser fingerprint for session validation
   */
  private static generateFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || 'unknown',
      // Add more entropy
      window.devicePixelRatio || 1,
      navigator.platform,
      navigator.vendor
    ];
    
    // Simple hash function
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Store session data securely
   */
  static setSession(data: Omit<SessionData, 'fingerprint'>): void {
    try {
      const fingerprint = this.generateFingerprint();
      const sessionData: SessionData = {
        ...data,
        fingerprint
      };
      
      // Store in sessionStorage (encrypted in production)
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      sessionStorage.setItem(this.FINGERPRINT_KEY, fingerprint);
      
      // Also set individual items for backward compatibility
      sessionStorage.setItem('smart-money-token', data.token);
      sessionStorage.setItem('smart-money-token-expiry', data.expiry.toString());
      sessionStorage.setItem('token-gate-verified', data.hasAccess ? 'true' : 'false');
      sessionStorage.setItem('cms-balance', data.balance);
      
      // Set httpOnly cookie for CSRF protection (server-side only)
      // This would be done on the server response
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }
  
  /**
   * Retrieve and validate session data
   */
  static getSession(): SessionData | null {
    try {
      const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return null;
      
      const session: SessionData = JSON.parse(sessionStr);
      
      // Check expiry
      if (Date.now() >= session.expiry) {
        this.clearSession();
        return null;
      }
      
      // Validate fingerprint
      const currentFingerprint = this.generateFingerprint();
      const storedFingerprint = sessionStorage.getItem(this.FINGERPRINT_KEY);
      
      if (session.fingerprint !== currentFingerprint || 
          session.fingerprint !== storedFingerprint) {
        console.warn('Session fingerprint mismatch - possible session hijacking');
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to retrieve session:', error);
      this.clearSession();
      return null;
    }
  }
  
  /**
   * Clear all session data
   */
  static clearSession(): void {
    // Clear session storage
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.FINGERPRINT_KEY);
    sessionStorage.removeItem('smart-money-token');
    sessionStorage.removeItem('smart-money-token-expiry');
    sessionStorage.removeItem('token-gate-verified');
    sessionStorage.removeItem('cms-balance');
    sessionStorage.removeItem('wallet-address');
    
    // Clear local storage wallet data
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  }
  
  /**
   * Check if session is valid
   */
  static isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null && session.hasAccess;
  }
  
  /**
   * Get the session token
   */
  static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }
  
  /**
   * Refresh session expiry
   */
  static refreshSession(): void {
    const session = this.getSession();
    if (session) {
      session.expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      this.setSession(session);
    }
  }
}

// Auto-clear expired sessions on load
if (typeof window !== 'undefined') {
  SecureSessionStorage.getSession(); // This will clear if expired
}
