import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const externalUrl = 'https://background-removal.resizefiles.blitz.cloud/remove-background';

    // Forward raw event headers and body (base64 encoded if binary/multipart)
    const headers: Record<string, string> = {};
    if (event.headers && event.headers['content-type']) {
      headers['Content-Type'] = event.headers['content-type'];
    }

    const bodyBuffer = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64') 
      : Buffer.from(event.body || '');

    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: headers,
      body: bodyBuffer,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Backend error');
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Background removal service error: ${errText}` }),
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const processingTime = response.headers.get('X-Processing-Time') || '0';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Processing-Time': processingTime,
      },
      body: base64Data,
      isBase64Encoded: true,
    };
  } catch (err: any) {
    console.error('Netlify function background-removal error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Background removal proxy failed' }),
    };
  }
};
