import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, cookies, url }) => {
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

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const prefix = url.searchParams.get('prefix') || 'blog-images/';

    // List objects from R2
    const listResult = await bucket.list({
      prefix: prefix,
      limit: Math.min(limit, 1000), // Cap at 1000 for performance
    });

    // Transform the results into a more user-friendly format
    const images = await Promise.all(
      listResult.objects.map(async (object) => {
        try {
          // Extract filename from key
          const filename = object.key.split('/').pop() || object.key;
          
          // Generate public URL through our worker proxy
          const publicUrl = `${url.origin}/assets/${object.key}`;
          
          // Parse custom metadata if available
          let originalName = filename;
          let uploadedAt = object.uploaded;
          
          // Try to get additional metadata
          try {
            const headResult = await bucket.head(object.key);
            if (headResult?.customMetadata) {
              originalName = headResult.customMetadata.originalName || filename;
              uploadedAt = headResult.customMetadata.uploadedAt || object.uploaded;
            }
          } catch (metaError) {
            // If we can't get metadata, use defaults
            console.warn(`Could not get metadata for ${object.key}:`, metaError);
          }

          return {
            id: object.key.replace(/[^a-zA-Z0-9]/g, ''), // Generate simple ID
            key: object.key,
            filename: object.key,
            name: originalName,
            url: publicUrl,
            size: object.size,
            uploadDate: uploadedAt,
            etag: object.etag,
          };
        } catch (error) {
          console.error(`Error processing object ${object.key}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed objects
    const validImages = images.filter(image => image !== null);

    // Sort by upload date (newest first)
    validImages.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return new Response(JSON.stringify({ 
      success: true, 
      images: validImages,
      total: validImages.length,
      hasMore: listResult.truncated || false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing images:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};