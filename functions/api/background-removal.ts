/**
 * Cloudflare Pages Function for Background Removal Proxy
 * Forwards multipart/form-data request with file and model to Blitz backend.
 */

export async function onRequest(context: { request: Request }) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const externalUrl = 'https://background-removal.resizefiles.blitz.cloud/remove-background';

    // Parse incoming multipart form data from client
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('file');
    const model = incomingFormData.get('model') || 'u2netp';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided in request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build outgoing multipart form data for Blitz backend
    const blitzFormData = new FormData();
    blitzFormData.append('file', file);
    blitzFormData.append('model', model);

    const response = await fetch(externalUrl, {
      method: 'POST',
      body: blitzFormData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Backend error');
      return new Response(
        JSON.stringify({ error: `Background removal service error (${response.status}): ${errText}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const imageArrayBuffer = await response.arrayBuffer();
    const processingTime = response.headers.get('X-Processing-Time') || '0';

    return new Response(imageArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Processing-Time': processingTime,
      },
    });
  } catch (err: any) {
    console.error('Background removal Cloudflare function error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Background removal proxy failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
