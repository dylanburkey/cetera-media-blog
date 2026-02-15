import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types
interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'editor' | 'author';
  created_at: string;
  last_login?: string;
}

interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// Mock auth service
class AuthService {
  private users: Map<number, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private nextUserId = 1;
  private sessionTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Mock password hashing (in reality would use bcrypt/argon2)
  async hashPassword(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return `hashed_${password}` === hash;
  }

  generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }

    return { valid: errors.length === 0, errors };
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'editor' | 'author';
  }): Promise<User> {
    if (!this.validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Check for duplicate email
    for (const user of this.users.values()) {
      if (user.email === data.email) {
        throw new Error('Email already exists');
      }
    }

    const user: User = {
      id: this.nextUserId++,
      email: data.email,
      password_hash: await this.hashPassword(data.password),
      name: data.name,
      role: data.role || 'author',
      created_at: new Date().toISOString()
    };

    this.users.set(user.id, user);
    return user;
  }

  async login(email: string, password: string, meta?: { ip?: string; userAgent?: string }): Promise<{
    user: Omit<User, 'password_hash'>;
    session: Session;
  }> {
    let user: User | undefined;
    for (const u of this.users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await this.verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date().toISOString();

    // Create session
    const session: Session = {
      id: this.generateSessionId(),
      user_id: user.id,
      expires_at: new Date(Date.now() + this.sessionTTL).toISOString(),
      created_at: new Date().toISOString(),
      ip_address: meta?.ip,
      user_agent: meta?.userAgent
    };

    this.sessions.set(session.id, session);

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, session };
  }

  async logout(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return this.users.get(session.user_id) || null;
  }

  async refreshSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.expires_at = new Date(Date.now() + this.sessionTTL).toISOString();
    return session;
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const valid = await this.verifyPassword(oldPassword, user.password_hash);
    if (!valid) throw new Error('Current password is incorrect');

    const validation = this.validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    user.password_hash = await this.hashPassword(newPassword);
    return true;
  }

  hasPermission(user: User, action: string): boolean {
    const permissions: Record<string, string[]> = {
      admin: ['create', 'read', 'update', 'delete', 'publish', 'manage_users'],
      editor: ['create', 'read', 'update', 'delete', 'publish'],
      author: ['create', 'read', 'update']
    };

    return permissions[user.role]?.includes(action) || false;
  }

  clear(): void {
    this.users.clear();
    this.sessions.clear();
    this.nextUserId = 1;
  }
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(service.validateEmail('test@example.com')).toBe(true);
      expect(service.validateEmail('user.name@domain.org')).toBe(true);
      expect(service.validateEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(service.validateEmail('invalid')).toBe(false);
      expect(service.validateEmail('no@domain')).toBe(false);
      expect(service.validateEmail('@example.com')).toBe(false);
      expect(service.validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = service.validatePassword('SecurePass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = service.validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should require uppercase', () => {
      const result = service.validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain an uppercase letter');
    });

    it('should require lowercase', () => {
      const result = service.validatePassword('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain a lowercase letter');
    });

    it('should require numbers', () => {
      const result = service.validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain a number');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const user = await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      });

      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('author'); // default
    });

    it('should hash the password', async () => {
      const user = await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      });

      expect(user.password_hash).not.toBe('SecurePass123');
      expect(user.password_hash).toBe('hashed_SecurePass123');
    });

    it('should reject invalid email', async () => {
      await expect(
        service.createUser({
          email: 'invalid',
          password: 'SecurePass123',
          name: 'Test'
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject weak password', async () => {
      await expect(
        service.createUser({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test'
        })
      ).rejects.toThrow();
    });

    it('should reject duplicate email', async () => {
      await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test'
      });

      await expect(
        service.createUser({
          email: 'test@example.com',
          password: 'AnotherPass123',
          name: 'Test 2'
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      });
    });

    it('should login with valid credentials', async () => {
      const result = await service.login('test@example.com', 'SecurePass123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.session.id).toBeDefined();
      expect(result.session.user_id).toBe(result.user.id);
    });

    it('should not expose password hash', async () => {
      const result = await service.login('test@example.com', 'SecurePass123');
      expect((result.user as any).password_hash).toBeUndefined();
    });

    it('should reject invalid email', async () => {
      await expect(
        service.login('wrong@example.com', 'SecurePass123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      await expect(
        service.login('test@example.com', 'WrongPass123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should store session metadata', async () => {
      const result = await service.login('test@example.com', 'SecurePass123', {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(result.session.ip_address).toBe('192.168.1.1');
      expect(result.session.user_agent).toBe('Mozilla/5.0');
    });
  });

  describe('validateSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test'
      });
      const result = await service.login('test@example.com', 'SecurePass123');
      sessionId = result.session.id;
    });

    it('should validate active session', async () => {
      const user = await service.validateSession(sessionId);
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should reject invalid session', async () => {
      const user = await service.validateSession('invalid');
      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should invalidate session', async () => {
      await service.createUser({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test'
      });
      const result = await service.login('test@example.com', 'SecurePass123');
      
      await service.logout(result.session.id);
      
      const user = await service.validateSession(result.session.id);
      expect(user).toBeNull();
    });
  });

  describe('changePassword', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await service.createUser({
        email: 'test@example.com',
        password: 'OldPass123',
        name: 'Test'
      });
      userId = user.id;
    });

    it('should change password with valid old password', async () => {
      const result = await service.changePassword(userId, 'OldPass123', 'NewPass123');
      expect(result).toBe(true);

      // Should be able to login with new password
      await expect(
        service.login('test@example.com', 'NewPass123')
      ).resolves.toBeDefined();
    });

    it('should reject incorrect old password', async () => {
      await expect(
        service.changePassword(userId, 'WrongOld123', 'NewPass123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      await expect(
        service.changePassword(userId, 'OldPass123', 'weak')
      ).rejects.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should grant all permissions to admin', () => {
      const admin: User = {
        id: 1,
        email: 'admin@example.com',
        password_hash: 'hash',
        name: 'Admin',
        role: 'admin',
        created_at: new Date().toISOString()
      };

      expect(service.hasPermission(admin, 'create')).toBe(true);
      expect(service.hasPermission(admin, 'delete')).toBe(true);
      expect(service.hasPermission(admin, 'publish')).toBe(true);
      expect(service.hasPermission(admin, 'manage_users')).toBe(true);
    });

    it('should grant limited permissions to editor', () => {
      const editor: User = {
        id: 1,
        email: 'editor@example.com',
        password_hash: 'hash',
        name: 'Editor',
        role: 'editor',
        created_at: new Date().toISOString()
      };

      expect(service.hasPermission(editor, 'create')).toBe(true);
      expect(service.hasPermission(editor, 'publish')).toBe(true);
      expect(service.hasPermission(editor, 'manage_users')).toBe(false);
    });

    it('should grant basic permissions to author', () => {
      const author: User = {
        id: 1,
        email: 'author@example.com',
        password_hash: 'hash',
        name: 'Author',
        role: 'author',
        created_at: new Date().toISOString()
      };

      expect(service.hasPermission(author, 'create')).toBe(true);
      expect(service.hasPermission(author, 'read')).toBe(true);
      expect(service.hasPermission(author, 'update')).toBe(true);
      expect(service.hasPermission(author, 'delete')).toBe(false);
      expect(service.hasPermission(author, 'publish')).toBe(false);
    });
  });
});
