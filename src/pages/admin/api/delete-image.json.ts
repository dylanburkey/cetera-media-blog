import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Check authentication
    const auth = await isAuthenticated({ locals, cookies });
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the R2 bucket
    const bucket = locals.runtime.env.ASSETS_BUCKET;
    if (!bucket) {
      throw new Error('R2 bucket not configured');
    }

    // Parse request body to get the filename
    const body = await request.json();
    const { filename } = body;
    
    if (!filename) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No filename provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate that the filename is in the blog-images directory
    if (!filename.startsWith('blog-images/')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid filename path' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if file exists before attempting to delete
    const existingObject = await bucket.head(filename);
    if (!existingObject) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'File not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from R2
    await bucket.delete(filename);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Image deleted successfully',
      filename
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};