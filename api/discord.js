/* Endpoint des interactions Discord (commandes slash) pour le bot Redemption.
   Vercel Edge Function : corps brut via request.text() pour verifier la signature
   Ed25519, puis routage des commandes. Ecrit dans Supabase via l'API REST (cle service).

   Commandes : /ping (test), /t5 (declaration de combat). */

export const config = { runtime: 'edge' };

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '791b18f813d733abdccd8da38671a5eb03ac6aaa420a9d15c2c27475959c9f02';
const APP_ID = process.env.DISCORD_APP_ID || '1549725206128492605';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'preuves-recyclages';

/* ---------- Signature ---------- */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}
async function verifySignature(sig, timestamp, rawBody) {
    try {
        const key = await crypto.subtle.importKey('raw', hexToBytes(PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
        return await crypto.subtle.verify('Ed25519', key, hexToBytes(sig), new TextEncoder().encode(timestamp + rawBody));
    } catch (e) { return false; }
}

/* ---------- Helpers Supabase REST ---------- */
function sbHeaders(extra) {
    return Object.assign({
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'redemption-bot/1.0'
    }, extra || {});
}
async function sbGet(path) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: sbHeaders() });
    if (!r.ok) throw new Error('GET ' + path + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
}
async function sbInsert(table, body, returning) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
        method: 'POST',
        headers: sbHeaders(returning ? { 'Prefer': 'return=representation' } : { 'Prefer': 'return=minimal' }),
        body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('INSERT ' + table + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return returning ? r.json() : null;
}
async function sbRpc(fn, args) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: sbHeaders(), body: JSON.stringify(args) });
    if (!r.ok) throw new Error('RPC ' + fn + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
}
async function uploadScreen(url, ownerProfileId, n) {
    const dl = await fetch(url);
    if (!dl.ok) throw new Error('download screen ' + n + ' -> ' + dl.status);
    const bytes = await dl.arrayBuffer();
    const ct = dl.headers.get('content-type') || 'image/jpeg';
    const ext = ct.includes('png') ? 'png' : (ct.includes('webp') ? 'webp' : 'jpg');
    const path = 'combats/' + ownerProfileId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-s' + n + '.' + ext;
    const up = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + SERVICE_KEY, 'apikey': SERVICE_KEY, 'Content-Type': ct, 'User-Agent': 'redemption-bot/1.0' },
        body: bytes
    });
    if (!up.ok) throw new Error('upload screen ' + n + ' -> ' + up.status + ' ' + (await up.text()).slice(0, 150));
    return SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
}

/* ---------- Followup (message differe) ---------- */
async function editFollowup(token, content) {
    await fetch('https://discord.com/api/v10/webhooks/' + APP_ID + '/' + token + '/messages/@original', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content })
    });
}

/* ---------- /t5 ---------- */
function opt(options, name) {
    const o = (options || []).find(x => x.name === name);
    return o ? o.value : undefined;
}

async function processT5(body) {
    const data = body.data;
    const options = data.options || [];
    const resolved = data.resolved || {};
    const users = resolved.users || {};
    const attachments = resolved.attachments || {};

    /* Minuscules imposees : c'est ce qu'attendent bareme_points.type et les
       contraintes CHECK de combats (les libelles Discord sont capitalises). */
    const type = String(opt(options, 'type') || '').toLowerCase();
    const resultat = String(opt(options, 'resultat') || '').toLowerCase();
    const nbAllies = parseInt(opt(options, 'allies'), 10);
    const nbEnnemis = parseInt(opt(options, 'ennemis'), 10);
    const allianceInput = (opt(options, 'alliance') || '').trim();
    const butinIn = opt(options, 'butin');
    const zone = (opt(options, 'zone') || '').trim() || null;
    const invitesIn = (opt(options, 'invites') || '').trim();

    /* Auteur = celui qui lance la commande */
    const author = (body.member && body.member.user) || body.user;
    const authorDiscordId = author.id;

    /* Discord ids des allies tagges (joueur1..joueur5) + auteur */
    const taggedIds = [];
    for (let i = 1; i <= 5; i++) {
        const uid = opt(options, 'joueur' + i);
        if (uid) taggedIds.push(uid);
    }
    const allDiscordIds = Array.from(new Set([authorDiscordId].concat(taggedIds)));

    /* Resolution Discord id -> profil (valides uniquement) */
    const inList = allDiscordIds.map(id => '"' + id + '"').join(',');
    const profiles = await sbGet('profiles?discord_id=in.(' + inList + ')&is_validated=eq.true&select=id,username,discord_id');
    const byDiscord = {};
    profiles.forEach(p => { byDiscord[p.discord_id] = p; });

    const authorProfile = byDiscord[authorDiscordId];
    if (!authorProfile) {
        return 'Tu dois d\'abord te connecter au site (https://redemption-alliance.vercel.app) et choisir ton pseudo avant de declarer un combat.';
    }

    /* Participants = profils resolus (dedup), + liste des non trouves */
    const participantProfiles = [];
    const seen = {};
    allDiscordIds.forEach(did => {
        const p = byDiscord[did];
        if (p && !seen[p.id]) { seen[p.id] = true; participantProfiles.push(p); }
    });
    const notFound = taggedIds.filter(did => !byDiscord[did]).map(did => (users[did] ? users[did].username : did));

    /* Alliance : match par tag ou nom, sinon nom libre */
    let allianceId = null, allianceNom = null, allianceLabel = allianceInput || 'N/A';
    if (allianceInput) {
        const q = encodeURIComponent(allianceInput);
        const al = await sbGet('alliances?or=(tag.ilike.' + q + ',nom.ilike.' + q + ')&select=id,nom,tag&limit=1');
        if (al.length) { allianceId = al[0].id; allianceLabel = al[0].nom + (al[0].tag ? ' [' + al[0].tag + ']' : ''); }
        else { allianceNom = allianceInput; }
    }

    /* Points : meme RPC et donc meme bareme que le site (table bareme_points,
       reglee depuis l'admin). p_type est obligatoire, le bareme attaque et le
       bareme defense sont distincts, et sans lui PostgREST ne sait pas choisir
       entre les deux surcharges de la fonction (PGRST203). */
    const points = await sbRpc('calculer_points', {
        p_nb_allies: nbAllies,
        p_nb_ennemis: nbEnnemis,
        p_resultat: resultat,
        p_alliance_id: allianceId,
        p_type: type
    });
    const butin = resultat === 'victoire' ? (parseInt(butinIn, 10) || 0) : 0;

    /* Upload des 2 screens */
    const s1 = attachments[opt(options, 'screen1')];
    const s2 = attachments[opt(options, 'screen2')];
    const [url1, url2] = await Promise.all([
        uploadScreen(s1.url, authorProfile.id, 1),
        uploadScreen(s2.url, authorProfile.id, 2)
    ]);

    /* Invites hors site */
    const invites = invitesIn ? invitesIn.split(',').map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 30) : [];

    /* Insert combat */
    const combatRows = await sbInsert('combats', {
        type: type,
        auteur_id: authorProfile.id,
        alliance_ennemie_id: allianceId,
        alliance_ennemie_nom: allianceNom,
        nb_allies: nbAllies,
        nb_ennemis: nbEnnemis,
        resultat: resultat,
        butin_kamas: butin,
        points_gagnes: points,
        commentaire: zone,
        invites: invites.length ? invites : null,
        preuve_url_1: url1,
        preuve_url_2: url2
    }, true);
    const combatId = combatRows[0].id;

    /* Participants */
    await sbInsert('combat_participants', participantProfiles.map(p => ({ combat_id: combatId, user_id: p.id })), false);

    /* Message de confirmation */
    const noms = participantProfiles.map(p => p.username).join(', ');
    let msg = (resultat === 'victoire' ? '✅ **Victoire**' : '❌ **Defaite**') + ' enregistree !\n';
    msg += '**' + (type === 'attaque' ? 'Attaque' : 'Defense') + '** ' + nbAllies + 'v' + nbEnnemis + ' contre **' + allianceLabel + '**\n';
    msg += '**' + (points >= 0 ? '+' : '') + points + ' points** pour : ' + noms;
    if (butin > 0) msg += '\n💰 Butin : ' + butin.toLocaleString('fr-FR') + ' kamas';
    if (zone) msg += '\n📍 ' + zone;
    if (invites.length) msg += '\n👥 Invites hors site : ' + invites.join(', ');
    if (notFound.length) msg += '\n⚠️ Non comptes (pas de compte site) : ' + notFound.join(', ');
    return msg;
}

/* ---------- Handler ---------- */
export default async function handler(request, context) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const sig = request.headers.get('x-signature-ed25519');
    const ts = request.headers.get('x-signature-timestamp');
    const rawBody = await request.text();
    if (!sig || !ts || !(await verifySignature(sig, ts, rawBody))) {
        return new Response('invalid request signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    if (body.type === 1) return Response.json({ type: 1 });

    if (body.type === 2) {
        const name = body.data && body.data.name;
        if (name === 'ping') {
            return Response.json({ type: 4, data: { content: 'Pong ! Le bot Redemption est bien connecte au site. 🗡️' } });
        }
        if (name === 't5') {
            const token = body.token;
            const work = processT5(body)
                .then(msg => editFollowup(token, msg))
                .catch(err => editFollowup(token, '❌ Erreur : ' + (err.message || err)));
            if (context && typeof context.waitUntil === 'function') {
                context.waitUntil(work);
                return Response.json({ type: 5 }); /* differe : on repond ensuite */
            }
            /* pas de waitUntil : on attend puis reponse directe */
            await work;
            return Response.json({ type: 5 });
        }
        return Response.json({ type: 4, data: { content: 'Commande inconnue.' } });
    }

    return Response.json({ type: 4, data: { content: 'Interaction non geree.' } });
}
