/* Endpoint des interactions Discord (commandes slash) pour le bot Redemption.
   Vercel Edge Function : on recupere le corps brut (request.text()) pour verifier
   la signature Ed25519 envoyee par Discord, sans souci de body-parser.
   Etape 1 (plomberie) : PING/PONG + commande /ping. /t5 viendra ensuite. */

export const config = { runtime: 'edge' };

/* Public Key de l'application Discord (non secrete). Surchargeable par variable d'env. */
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '791b18f813d733abdccd8da38671a5eb03ac6aaa420a9d15c2c27475959c9f02';

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}

async function verifySignature(sig, timestamp, rawBody) {
    try {
        const key = await crypto.subtle.importKey('raw', hexToBytes(PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
        return await crypto.subtle.verify('Ed25519', key, hexToBytes(sig), new TextEncoder().encode(timestamp + rawBody));
    } catch (e) {
        return false;
    }
}

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const sig = req.headers.get('x-signature-ed25519');
    const ts = req.headers.get('x-signature-timestamp');
    const rawBody = await req.text();

    if (!sig || !ts || !(await verifySignature(sig, ts, rawBody))) {
        return new Response('invalid request signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);

    /* PING de verification Discord */
    if (body.type === 1) return Response.json({ type: 1 });

    /* Commande slash */
    if (body.type === 2) {
        const name = body.data && body.data.name;
        if (name === 'ping') {
            return Response.json({ type: 4, data: { content: 'Pong ! Le bot Redemption est bien connecte au site. 🗡️' } });
        }
        return Response.json({ type: 4, data: { content: 'Commande inconnue.' } });
    }

    return Response.json({ type: 4, data: { content: 'Interaction non geree.' } });
}
