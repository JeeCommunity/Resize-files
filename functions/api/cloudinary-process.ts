/**
 * Cloudflare Pages Function for Cloudinary Processing
 * Supports environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({
        error: 'Cloudinary credentials not configured on Cloudflare Pages. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Cloudflare Dashboard -> Settings -> Environment Variables.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string || 'upload';
    const targetWidth = formData.get('width');
    const targetHeight = formData.get('height');
    const format = formData.get('format');
    const quality = formData.get('quality') || 'auto';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert file to array buffer and base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    const mimeType = file.type || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // Build Cloudinary upload request
    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', dataUri);
    uploadFormData.append('upload_preset', ''); // If unsigned, or use auth header

    const authHeader = 'Basic ' + btoa(`${apiKey}:${apiSecret}`);

    const uploadRes = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: uploadFormData,
    });

    const uploadResult = await uploadRes.json() as any;

    if (!uploadRes.ok || uploadResult.error) {
      throw new Error(uploadResult.error?.message || 'Cloudinary upload failed');
    }

    // Construct transformed URL if transformations requested
    let secureUrl = uploadResult.secure_url;
    let transformations: string[] = [];

    if (targetWidth) transformations.push(`w_${targetWidth}`);
    if (targetHeight) transformations.push(`h_${targetHeight}`);
    if (format && format !== 'auto') transformations.push(`f_${format}`);
    if (quality) transformations.push(`q_${quality}`);

    if (transformations.length > 0) {
      const parts = secureUrl.split('/upload/');
      if (parts.length === 2) {
        secureUrl = `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
      }
    }

    // Fetch final transformed image to return blob / bytes or JSON
    const finalRes = await fetch(secureUrl);
    const finalBuffer = await finalRes.arrayBuffer();

    // Basic usage counter logging (hook for monitoring free-tier limits)
    console.log(`[Cloudinary Usage] File processed: ${file.name}, Size: ${finalBuffer.byteLength} bytes, Operation: ${operation}`);

    return new Response(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': format ? `image/${format}` : mimeType,
        'X-Cloudinary-Url': secureUrl,
        'X-File-Size': finalBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error('Cloudinary processing error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Server processing error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
