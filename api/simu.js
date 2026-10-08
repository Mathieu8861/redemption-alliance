/* Route en ligne de l'outil « Compo de simu » (sql/063). Le coeur est dans
   api/_simu-coeur.mjs, partage avec le serveur local de test.

   - Appel de la page simu.html : POST JSON { action, ... } avec le jeton
     Supabase du membre (Authorization: Bearer). Reserve aux admins et aux
     organisateurs (profiles.organisateur_event).
   - Tache planifiee (lecture des ✅ a l'heure reglee) : en-tete
     x-simu-secret = SIMU_CRON_SECRET, action auto.
   Variables Vercel : SUPABASE_URL, SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN,
   SIMU_CRON_SECRET, et DISCORD_EVENT_CHANNEL_ID (facultatif). */

import { executer } from './_simu-coeur.mjs';

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function json(corps, statut) {
    return new Response(JSON.stringify(corps), { status: statut || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* Le jeton de session du membre -> son profil (admin ou organisateur ?) */
async function organisateur(jeton) {
    const u = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + jeton, 'User-Agent': 'redemption-simu/1.0' } });
    if (!u.ok) return null;
    const user = await u.json();
    if (!user || !user.id) return null;
    const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=id,username,is_admin,organisateur_event&id=eq.' + encodeURIComponent(user.id), {
        headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'User-Agent': 'redemption-simu/1.0' }
    });
    const l = p.ok ? await p.json() : [];
    const profil = l && l[0];
    return profil && (profil.is_admin || profil.organisateur_event) ? profil : null;
}

export default async function handler(request) {
    const ctxEnv = {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_SERVICE_KEY: SERVICE_KEY,
        DISCORD_EVENT_CHANNEL_ID: process.env.DISCORD_EVENT_CHANNEL_ID
    };

    /* Tache planifiee */
    const secret = request.headers.get('x-simu-secret');
    if (secret) {
        if (!process.env.SIMU_CRON_SECRET || secret !== process.env.SIMU_CRON_SECRET) return json({ erreur: 'Secret invalide' }, 403);
        try { return json(await executer('auto', {}, { env: ctxEnv, utilisateur: null, aBlanc: false })); }
        catch (e) { return json({ erreur: e.message }, 500); }
    }

    if (request.method !== 'POST') return json({ erreur: 'POST attendu' }, 405);
    const jeton = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const profil = jeton ? await organisateur(jeton) : null;
    if (!profil) return json({ erreur: 'Réservé aux organisateurs des simu' }, 403);

    let corps;
    try { corps = await request.json(); } catch (e) { return json({ erreur: 'JSON invalide' }, 400); }
    try {
        return json(await executer(corps.action, corps, { env: ctxEnv, utilisateur: { id: profil.id, username: profil.username }, aBlanc: false }));
    } catch (e) {
        return json({ erreur: e.message }, 500);
    }
}
