/* Route en ligne du « Recensement » de l'admin (sql/081). Le coeur est dans
   api/_recensement-coeur.mjs, partagé avec le serveur local de test.

   - Appel de l'admin du site : POST avec le jeton Supabase du membre
     (Authorization: Bearer). Réservé aux admins (profiles.is_admin).
   - Renvoie les membres du serveur Discord et le nom de leurs rôles.
   Variables Vercel : SUPABASE_URL, SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN. */

import { membresDiscord } from './_recensement-coeur.mjs';

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function json(corps, statut) {
    return new Response(JSON.stringify(corps), { status: statut || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* Le jeton de session du membre -> son profil, s'il est admin */
async function admin(jeton) {
    const u = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + jeton, 'User-Agent': 'redemption-recensement/1.0' } });
    if (!u.ok) return null;
    const user = await u.json();
    if (!user || !user.id) return null;
    const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=id,is_admin&id=eq.' + encodeURIComponent(user.id), {
        headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'User-Agent': 'redemption-recensement/1.0' }
    });
    const l = p.ok ? await p.json() : [];
    return l && l[0] && l[0].is_admin ? l[0] : null;
}

export default async function handler(request) {
    if (request.method !== 'POST') return json({ erreur: 'POST attendu' }, 405);
    const jeton = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jeton || !(await admin(jeton))) return json({ erreur: 'Réservé aux admins' }, 403);
    try {
        return json(await membresDiscord(process.env.DISCORD_BOT_TOKEN));
    } catch (e) {
        return json({ erreur: e.message }, 500);
    }
}
