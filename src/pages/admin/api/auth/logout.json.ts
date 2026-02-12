import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    const token = cookies.get('admin_session')?.value;
    
    if (token) {
      // Get database from Cloudflare runtime
      const db = (locals as any).runtime?.env?.DB;
      
      if (db) {
        // Delete session from database
        await db.prepare(
          'DELETE FROM admin_sessions WHERE token = ?'
        ).bind(token).run();
      }
      
      // Clear cookie
      cookies.delete('admin_session', { path: '/' });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An error occurred during logout' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also support GET for simple link-based logout
export const GET: APIRoute = async (context) => {
  await POST(context);
  return context.redirect('/admin/login');
};
