import type { APIRoute } from 'astro';
import { verifyPassword, generateToken } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get database from Cloudflare runtime
    const db = (locals as any).runtime?.env?.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user by email
    const user = await db.prepare(
      'SELECT * FROM admin_users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.prepare(`
      INSERT INTO admin_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, token, expiresAt.toISOString()).run();

    // Set session cookie
    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt
    });

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An error occurred during login' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
