import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies, url }) => {
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

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No image file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'File size too large. Maximum size is 10MB.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFilename = `blog-images/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await bucket.put(uniqueFilename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      }
    });

    // Generate public URL
    // For Cloudflare R2, the public URL format is typically:
    // https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/<object-key>
    // However, for production you'd typically use a custom domain
    const publicUrl = `${url.origin}/assets/${uniqueFilename}`;

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};