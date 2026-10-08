/* Coeur de l'outil « Compo de simu » (sql/063) : lecture des annonces et des
   ✅ du salon #event, publication des equipes, et table simu_events.
   Partage par la route Vercel api/simu.js (en ligne) et par le serveur local
   dev/serveur-local.mjs (tests). Sans dependance : fetch uniquement.

   ctx = { env: { DISCORD_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY,
                  DISCORD_EVENT_CHANNEL_ID? },
           utilisateur: { id, username },
           aBlanc: true pour ne rien publier (serveur local) } */

const DISCORD = 'https://discord.com/api/v10';
const SERVEUR = '1548432166671753318'; /* serveur Discord Redemption */
const SALON_EVENT = '1548432167795695790'; /* 🧙‍♂️｜event */
const OUI = '✅';
const NON = '❌';

function salonEvent(ctx) {
    return ctx.env.DISCORD_EVENT_CHANNEL_ID || SALON_EVENT;
}

async function discord(ctx, chemin, options) {
    for (let essai = 0; essai < 4; essai++) {
        const r = await fetch(DISCORD + chemin, Object.assign({}, options || {}, {
            headers: Object.assign({
                Authorization: 'Bot ' + ctx.env.DISCORD_BOT_TOKEN,
                'User-Agent': 'DiscordBot (https://redemption-alliance.vercel.app, 1.0)'
            }, (options && options.headers) || {})
        }));
        if (r.status === 429) {
            const j = await r.json().catch(function () { return {}; });
            await new Promise(function (res) { setTimeout(res, (j.retry_after || 1) * 1000 + 150); });
            continue;
        }
        const t = await r.text();
        if (!r.ok) throw new Error('Discord ' + r.status + ' : ' + t.slice(0, 200));
        return t ? JSON.parse(t) : null;
    }
    throw new Error('Discord : trop de requêtes, réessaie dans un instant');
}

async function base(ctx, chemin, options) {
    const r = await fetch(ctx.env.SUPABASE_URL + '/rest/v1/' + chemin, Object.assign({}, options || {}, {
        headers: Object.assign({
            apikey: ctx.env.SUPABASE_SERVICE_KEY,
            Authorization: 'Bearer ' + ctx.env.SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
            'User-Agent': 'redemption-simu/1.0'
        }, (options && options.headers) || {})
    }));
    const t = await r.text();
    if (!r.ok) throw new Error('Base ' + r.status + ' : ' + t.slice(0, 200));
    return t ? JSON.parse(t) : null;
}

/* Heure de Paris -> instant UTC (gere l'heure d'ete) */
function parisVersIso(jour, heures, minutes) {
    const essai = new Date(jour + 'T' + String(heures).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':00Z');
    const paris = new Date(essai.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const utc = new Date(essai.toLocaleString('en-US', { timeZone: 'UTC' }));
    return new Date(essai.getTime() - (paris - utc)).toISOString();
}

function jourParis(iso, decalageJours) {
    const d = new Date(new Date(iso).getTime() + (decalageJours || 0) * 86400000);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
}

/* « SIMU CE SOIR 21h », « 21h30 », « demain 21h » : heure de lancement
   proposee, le jour de l'annonce (ou le lendemain si « demain ») */
export function lancementDepuisTexte(texte, annonceIso) {
    const m = String(texte || '').match(/(?:^|[^0-9])([01]?\d|2[0-3])\s*[hH]\s*([0-5]\d)?(?![0-9])/);
    if (!m) return null;
    const demain = /demain|tomorrow/i.test(texte) ? 1 : 0;
    let iso = parisVersIso(jourParis(annonceIso, demain), parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0);
    /* « 21h » annonce apres 21h sans « demain » : c'est pour le lendemain */
    if (!demain && new Date(iso).getTime() < new Date(annonceIso).getTime() - 3600000) {
        iso = parisVersIso(jourParis(annonceIso, 1), parseInt(m[1], 10), m[2] ? parseInt(m[2], 10) : 0);
    }
    return iso;
}

function compteReaction(m, emoji) {
    const r = (m.reactions || []).find(function (x) { return x.emoji && x.emoji.name === emoji; });
    return r ? r.count : 0;
}

function versAnnonce(m) {
    return {
        id: m.id,
        auteur_id: m.author.id,
        auteur_nom: m.author.global_name || m.author.username,
        texte: m.content || '',
        annonce_le: m.timestamp,
        oui: compteReaction(m, OUI),
        non: compteReaction(m, NON),
        lancement_propose: lancementDepuisTexte(m.content, m.timestamp)
    };
}

/* Les annonces recentes du salon qui ont des ✅, la plus recente d'abord */
async function annonces(ctx) {
    const msgs = await discord(ctx, '/channels/' + salonEvent(ctx) + '/messages?limit=50');
    const limite = Date.now() - 8 * 86400000;
    const liste = (msgs || [])
        .filter(function (m) { return compteReaction(m, OUI) > 0 && new Date(m.timestamp).getTime() > limite; })
        .map(versAnnonce);
    const ids = liste.map(function (a) { return a.id; });
    const lignes = ids.length
        ? await base(ctx, 'simu_events?select=id,discord_message_id,publie_le,compo&discord_message_id=in.(' + ids.join(',') + ')', { method: 'GET' })
        : [];
    const parId = {};
    (lignes || []).forEach(function (l) { parId[l.discord_message_id] = l; });
    liste.forEach(function (a) {
        const l = parId[a.id];
        a.simu_id = l ? l.id : null;
        a.compo_faite = !!(l && l.compo);
        a.publie = !!(l && l.publie_le);
    });
    return { annonces: liste };
}

async function inscritsDiscord(ctx, messageId) {
    let tous = [], apres = null;
    for (let page = 0; page < 10; page++) {
        const lot = await discord(ctx, '/channels/' + salonEvent(ctx) + '/messages/' + messageId + '/reactions/' + encodeURIComponent(OUI) + '?limit=100' + (apres ? '&after=' + apres : ''));
        tous = tous.concat(lot || []);
        if (!lot || lot.length < 100) break;
        apres = lot[lot.length - 1].id;
    }
    return tous.filter(function (u) { return !u.bot; }).map(function (u) {
        return { discord_id: u.id, nom: u.global_name || u.username };
    });
}

async function ligne(ctx, simuId) {
    const l = await base(ctx, 'simu_events?select=*&id=eq.' + encodeURIComponent(simuId), { method: 'GET' });
    if (!l || !l.length) throw new Error('Simu introuvable');
    return l[0];
}

/* Lit les ✅ ; a partir de l'heure de lecture, fige la liste une fois :
   ceux qui cochent ensuite sont les retardataires */
async function lire(ctx, params) {
    const l = await ligne(ctx, params.simu_id);
    const inscrits = await inscritsDiscord(ctx, l.discord_message_id);
    const maj = { inscrits: inscrits, lu_le: new Date().toISOString() };
    if (l.lancement && !l.inscrits_a_l_heure) {
        const cloture = new Date(l.lancement).getTime() - (l.lecture_avant_min || 0) * 60000;
        if (Date.now() >= cloture) {
            maj.inscrits_a_l_heure = inscrits.map(function (i) { return i.discord_id; });
            maj.cloture_le = maj.lu_le;
        }
    }
    const r = await base(ctx, 'simu_events?id=eq.' + l.id, { method: 'PATCH', body: JSON.stringify(maj) });
    return { simu: r[0] };
}

/* Ouvre (ou cree) la simu d'une annonce, puis lit les ✅ */
async function ouvrir(ctx, params) {
    const id = String(params.message_id || '');
    if (!/^\d{5,25}$/.test(id)) throw new Error('Annonce invalide');
    const existe = await base(ctx, 'simu_events?select=id&discord_message_id=eq.' + id, { method: 'GET' });
    let simuId = existe && existe.length ? existe[0].id : null;
    if (!simuId) {
        const m = await discord(ctx, '/channels/' + salonEvent(ctx) + '/messages/' + id);
        const a = versAnnonce(m);
        const reglage = await base(ctx, "site_config?select=valeur&cle=eq.simu_lecture_avant_min", { method: 'GET' });
        const avant = Math.max(0, Math.min(720, parseInt(reglage && reglage[0] && reglage[0].valeur, 10) || 30));
        const cree = await base(ctx, 'simu_events?on_conflict=discord_message_id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify({
                discord_message_id: a.id, discord_channel_id: salonEvent(ctx),
                auteur_discord_id: a.auteur_id, auteur_nom: a.auteur_nom, texte: a.texte,
                annonce_le: a.annonce_le, lancement: a.lancement_propose, lecture_avant_min: avant,
                maj_par: ctx.utilisateur && ctx.utilisateur.id || null
            })
        });
        simuId = cree[0].id;
    }
    return lire(ctx, { simu_id: simuId });
}

/* Publie les equipes dans #event (ou modifie le message deja publie).
   Seuls les joueurs listes dans mentions sont tagues. */
async function publier(ctx, params) {
    const l = await ligne(ctx, params.simu_id);
    const texte = String(params.texte || '').trim();
    if (!texte) throw new Error('Message vide');
    if (texte.length > 2000) throw new Error('Message trop long pour Discord (' + texte.length + ' caractères sur 2000)');
    const mentions = (params.mentions || []).filter(function (x) { return /^\d{5,25}$/.test(String(x)); }).slice(0, 100);
    const payload = { content: texte, allowed_mentions: { parse: [], users: mentions } };
    const modifier = !!l.publie_message_id && !params.nouveau;
    if (ctx.aBlanc) {
        return { aBlanc: true, modifier: modifier, payload: payload, simu: l };
    }
    const m = await discord(ctx, '/channels/' + salonEvent(ctx) + '/messages' + (modifier ? '/' + l.publie_message_id : ''), {
        method: modifier ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const r = await base(ctx, 'simu_events?id=eq.' + l.id, {
        method: 'PATCH',
        body: JSON.stringify({ publie_message_id: m.id, publie_le: new Date().toISOString(), maj_par: ctx.utilisateur && ctx.utilisateur.id || null })
    });
    return { modifier: modifier, message_id: m.id, simu: r[0] };
}

/* Membres du serveur Discord : pour ajouter a la main un joueur qui a
   confirme sa presence sans cocher ✅ */
async function membres(ctx) {
    let tous = [], apres = '0';
    for (let page = 0; page < 10; page++) {
        const lot = await discord(ctx, '/guilds/' + SERVEUR + '/members?limit=1000&after=' + apres);
        tous = tous.concat(lot || []);
        if (!lot || lot.length < 1000) break;
        apres = lot[lot.length - 1].user.id;
    }
    return {
        membres: tous.filter(function (m) { return m.user && !m.user.bot; }).map(function (m) {
            return { discord_id: m.user.id, nom: m.nick || m.user.global_name || m.user.username, pseudo: m.user.username };
        })
    };
}

/* Tache planifiee : fige les inscrits des simu dont l'heure de lecture est passee */
async function auto(ctx) {
    const maintenant = Date.now();
    const lignes = await base(ctx, 'simu_events?select=id,lancement,lecture_avant_min&inscrits_a_l_heure=is.null&lancement=gte.' + new Date(maintenant - 6 * 3600000).toISOString(), { method: 'GET' });
    const faites = [];
    for (const l of lignes || []) {
        if (maintenant >= new Date(l.lancement).getTime() - (l.lecture_avant_min || 0) * 60000) {
            await lire(ctx, { simu_id: l.id });
            faites.push(l.id);
        }
    }
    return { figees: faites };
}

const ACTIONS = { annonces: annonces, ouvrir: ouvrir, lire: lire, publier: publier, membres: membres, auto: auto };

export async function executer(action, params, ctx) {
    const f = ACTIONS[action];
    if (!f) throw new Error('Action inconnue');
    return f(ctx, params || {});
}
