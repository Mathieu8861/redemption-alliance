/* Audit, SANS RIEN MODIFIER, des droits effectifs d'un membre (bot ou joueur)
   dans tous les salons du serveur. Sert a verifier qu'un bot tiers (musique...)
   peut voir, rejoindre et parler dans les vocaux, et repondre dans les salons texte.

     node bot/acces-membre.js <idUtilisateur> [--role "Nom d un role"]

   --role ajoute, sur les salons texte, si ce role (donc les membres qui le
   portent) peut y utiliser les commandes /. Lit DISCORD_BOT_TOKEN et
   DISCORD_GUILD_ID dans l'environnement ou .env.local (jamais affiches). */

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

function arg(nom) { const i = process.argv.indexOf(nom); return i !== -1 ? process.argv[i + 1] : null; }
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD = process.env.DISCORD_GUILD_ID;
const USER = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const ROLE_MEMBRES = arg('--role');
if (!TOKEN || !GUILD || !USER) {
    console.error('Usage : node bot/acces-membre.js <idUtilisateur> [--role "Nom du role"]');
    process.exit(1);
}

const P = {
    ADMINISTRATOR: 1n << 3n, VIEW_CHANNEL: 1n << 10n, SEND_MESSAGES: 1n << 11n,
    EMBED_LINKS: 1n << 14n, CONNECT: 1n << 20n, SPEAK: 1n << 21n,
    USE_VAD: 1n << 25n, USE_APPLICATION_COMMANDS: 1n << 31n
};
const TYPES = { 0: 'texte', 2: 'vocal', 4: 'categorie', 5: 'annonces', 13: 'scene', 15: 'forum', 16: 'media' };

async function api(p) {
    const r = await fetch('https://discord.com/api/v10' + p, { headers: { Authorization: 'Bot ' + TOKEN } });
    if (!r.ok) throw new Error('GET ' + p + ' -> HTTP ' + r.status + ' ' + (await r.text()).slice(0, 160));
    return r.json();
}

/* Permissions effectives d'un "membre" decrit par ses roles (ids) et son id,
   calculees comme Discord : roles, puis surcharges @everyone, roles, membre. */
function effectives(salon, roleIds, memberId, parId) {
    let base = 0n;
    roleIds.forEach(function (rid) { if (parId[rid]) base |= BigInt(parId[rid].permissions); });
    if ((base & P.ADMINISTRATOR) === P.ADMINISTRATOR) return { admin: true, perms: ~0n };
    let perms = base;
    const ow = salon.permission_overwrites || [];
    const trouve = function (id) { return ow.find(function (o) { return o.id === id; }); };
    const ev = trouve(GUILD);
    if (ev) { perms &= ~BigInt(ev.deny); perms |= BigInt(ev.allow); }
    let allow = 0n, deny = 0n;
    roleIds.forEach(function (rid) { if (rid === GUILD) return; const o = trouve(rid); if (o) { allow |= BigInt(o.allow); deny |= BigInt(o.deny); } });
    perms &= ~deny; perms |= allow;
    if (memberId) { const me = trouve(memberId); if (me) { perms &= ~BigInt(me.deny); perms |= BigInt(me.allow); } }
    if ((perms & P.VIEW_CHANNEL) !== P.VIEW_CHANNEL) perms = 0n; /* sans "voir", rien du tout */
    return { admin: false, perms: perms };
}

(async () => {
    const membre = await api('/guilds/' + GUILD + '/members/' + USER);
    const roles = await api('/guilds/' + GUILD + '/roles');
    const salons = await api('/guilds/' + GUILD + '/channels');
    const parId = {};
    roles.forEach(function (r) { parId[r.id] = r; });

    const mesRoles = [GUILD].concat(membre.roles);
    const nomsRoles = membre.roles.map(function (id) { return parId[id] ? parId[id].name : id; });
    const u = membre.user || {};
    console.log('Membre : ' + (u.username || USER) + (u.bot ? ' [BOT]' : '') + ' (' + USER + ')');
    console.log('Roles  : ' + (nomsRoles.join(', ') || '(aucun, seulement @everyone)'));
    let baseTout = 0n; mesRoles.forEach(function (rid) { if (parId[rid]) baseTout |= BigInt(parId[rid].permissions); });
    console.log('Admin  : ' + (((baseTout & P.ADMINISTRATOR) === P.ADMINISTRATOR) ? 'OUI' : 'non'));

    let roleMembres = null;
    if (ROLE_MEMBRES) {
        roleMembres = roles.find(function (r) { return r.name.toLowerCase() === ROLE_MEMBRES.toLowerCase(); });
        console.log('Role compare pour les commandes des membres : ' + (roleMembres ? roleMembres.name : 'INTROUVABLE "' + ROLE_MEMBRES + '"'));
    }

    const cats = salons.filter(function (s) { return s.type === 4; }).sort(function (a, b) { return a.position - b.position; });
    const sansCat = { id: null, name: '(sans categorie)', position: -1 };
    const ok = function (e, bit) { return e.admin || (e.perms & bit) === bit; };
    const cell = function (b) { return b ? ' oui ' : ' NON '; };
    const bloques = { vocaux: [], textes: [] };

    [sansCat].concat(cats).forEach(function (cat) {
        const enfants = salons.filter(function (s) { return s.type !== 4 && (s.parent_id || null) === cat.id; })
            .sort(function (a, b) { return a.type - b.type || a.position - b.position; });
        if (!enfants.length) return;
        console.log('\n== ' + cat.name + ' ==');
        enfants.forEach(function (s) {
            const e = effectives(s, mesRoles, USER, parId);
            const type = TYPES[s.type] || ('type ' + s.type);
            const nom = ('#' + s.name).padEnd(34).slice(0, 34);
            if (s.type === 2 || s.type === 13) {
                const voir = ok(e, P.VIEW_CHANNEL), co = ok(e, P.CONNECT), sp = ok(e, P.SPEAK), vad = ok(e, P.USE_VAD);
                console.log('  ' + nom + ' ' + type.padEnd(7) + ' voir' + cell(voir) + 'rejoindre' + cell(co) + 'parler' + cell(sp) + 'voix-activee' + cell(vad));
                if (!(voir && co && sp)) bloques.vocaux.push(s);
            } else {
                const voir = ok(e, P.VIEW_CHANNEL), env = ok(e, P.SEND_MESSAGES), liens = ok(e, P.EMBED_LINKS), cmd = ok(e, P.USE_APPLICATION_COMMANDS);
                let membres = '';
                if (roleMembres) {
                    const em = effectives(s, [GUILD, roleMembres.id], null, parId);
                    membres = ' | membres(' + roleMembres.name + ') commandes /' + cell(ok(em, P.USE_APPLICATION_COMMANDS));
                }
                console.log('  ' + nom + ' ' + type.padEnd(7) + ' voir' + cell(voir) + 'ecrire' + cell(env) + 'liens' + cell(liens) + membres);
                if (!(voir && env && liens)) bloques.textes.push(s);
            }
        });
    });

    console.log('\nVocaux ou il ne peut PAS jouer (voir + rejoindre + parler) : ' + (bloques.vocaux.length ? bloques.vocaux.map(function (s) { return '#' + s.name; }).join(', ') : 'aucun'));
    console.log('Salons texte ou il ne peut PAS repondre (voir + ecrire + liens) : ' + (bloques.textes.length ? bloques.textes.map(function (s) { return '#' + s.name; }).join(', ') : 'aucun'));
})().catch(function (e) { console.error('ERREUR : ' + e.message); process.exit(1); });
