/* Verifie, SANS RIEN PUBLIER, ce que le bot a le droit de faire dans un salon.
   Calcule les permissions effectives comme Discord le fait : roles du membre,
   surcharges du salon (@everyone, roles, membre), administrateur.

     node bot/verifier-acces.js            (salon #site-alliance par defaut)
     node bot/verifier-acces.js <channelId>

   Lit DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_SITE_ALLIANCE_CHANNEL_ID
   dans l'environnement ou dans .env.local (jamais affiches). */

const fs = require('fs');
const path = require('path');

function chargerEnv() {
    const f = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(f)) return;
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach(function (l) {
        const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    });
}
chargerEnv();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD = process.env.DISCORD_GUILD_ID;
const CHANNEL = process.argv[2] || process.env.DISCORD_SITE_ALLIANCE_CHANNEL_ID;
if (!TOKEN || !GUILD || !CHANNEL) {
    console.error('Manque DISCORD_BOT_TOKEN, DISCORD_GUILD_ID ou l identifiant du salon.');
    process.exit(1);
}

const P = {
    ADMINISTRATOR: 1n << 3n,
    VIEW_CHANNEL: 1n << 10n,
    SEND_MESSAGES: 1n << 11n,
    EMBED_LINKS: 1n << 14n,
    ATTACH_FILES: 1n << 15n,
    READ_MESSAGE_HISTORY: 1n << 16n,
    MENTION_EVERYONE: 1n << 17n
};

async function api(p) {
    const r = await fetch('https://discord.com/api/v10' + p, { headers: { Authorization: 'Bot ' + TOKEN } });
    if (!r.ok) throw new Error('GET ' + p + ' -> HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
    return r.json();
}

(async () => {
    const moi = await api('/users/@me');
    const membre = await api('/guilds/' + GUILD + '/members/' + moi.id);
    const roles = await api('/guilds/' + GUILD + '/roles');
    const salon = await api('/channels/' + CHANNEL);

    const parId = {};
    roles.forEach(function (r) { parId[r.id] = r; });
    const mesRoles = roles.filter(function (r) { return r.id === GUILD || membre.roles.indexOf(r.id) !== -1; });

    /* 1. permissions de base = OR des roles (dont @everyone = role portant l id du serveur) */
    let base = 0n;
    mesRoles.forEach(function (r) { base |= BigInt(r.permissions); });
    const admin = (base & P.ADMINISTRATOR) === P.ADMINISTRATOR;

    /* 2. surcharges du salon : @everyone, puis roles, puis membre */
    let perms = base;
    if (!admin) {
        const ow = salon.permission_overwrites || [];
        const trouve = function (id) { return ow.find(function (o) { return o.id === id; }); };
        const ev = trouve(GUILD);
        if (ev) { perms &= ~BigInt(ev.deny); perms |= BigInt(ev.allow); }
        let allow = 0n, deny = 0n;
        membre.roles.forEach(function (rid) { const o = trouve(rid); if (o) { allow |= BigInt(o.allow); deny |= BigInt(o.deny); } });
        perms &= ~deny; perms |= allow;
        const me = trouve(moi.id);
        if (me) { perms &= ~BigInt(me.deny); perms |= BigInt(me.allow); }
    }

    const ok = function (bit) { return admin || (perms & bit) === bit; };
    console.log('Bot        : ' + moi.username + ' (' + moi.id + ')');
    console.log('Salon      : #' + salon.name + ' (' + salon.id + ')' + (salon.type === 0 ? '' : ' [type ' + salon.type + ']'));
    console.log('Roles      : ' + mesRoles.filter(function (r) { return r.id !== GUILD; }).map(function (r) { return r.name; }).join(', ') || '(aucun)');
    console.log('Admin      : ' + (admin ? 'oui (choix de Mathieu le 21/09 : le role [Bot-RDM] reste administrateur)' : 'non, bien'));
    console.log('');
    [['Voir le salon', P.VIEW_CHANNEL], ['Envoyer des messages', P.SEND_MESSAGES], ['Integrer des liens', P.EMBED_LINKS],
     ['Joindre des fichiers', P.ATTACH_FILES], ['Lire l historique', P.READ_MESSAGE_HISTORY], ['Mentionner @everyone', P.MENTION_EVERYONE]]
        .forEach(function (x) { console.log((ok(x[1]) ? '  [x] ' : '  [ ] ') + x[0]); });
    const pret = ok(P.VIEW_CHANNEL) && ok(P.SEND_MESSAGES) && ok(P.EMBED_LINKS) && ok(P.ATTACH_FILES);
    console.log('\nPret a publier une annonce avec image et lien : ' + (pret ? 'OUI' : 'NON'));
})().catch(function (e) { console.error('ERREUR : ' + e.message); process.exit(1); });
