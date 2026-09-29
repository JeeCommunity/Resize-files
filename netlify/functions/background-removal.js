const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Netlify function securely proxies the request to your Blitz Cloud backend
        const blitzResponse = await fetch("https://bgr2-0.resizefiles.blitz.cloud/remove-background", {
            method: "POST",
            body: event.body,
            headers: event.headers
        });

        const buffer = await blitzResponse.buffer();

        return {
            statusCode: blitzResponse.status,
            headers: {
                "Content-Type": "image/png",
                "Access-Control-Allow-Origin": "*"
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
