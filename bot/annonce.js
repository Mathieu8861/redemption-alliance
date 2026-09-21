/* Publie une annonce au nom du bot dans un salon Discord.

   REGLE : ne s'utilise que sur demande explicite de Mathieu, ou apres son
   accord sur le texte exact. Jamais de publication de test.

     node bot/annonce.js --message chemin/vers/message.txt [--image chemin.png] [--salon <id>] [--everyone] [--a-blanc]

   --a-blanc affiche ce qui serait envoye et s'arrete, sans rien poster.
   Les mentions @everyone / @here sont bloquees par defaut, meme si le texte
   en contient : il faut passer --everyone pour qu'elles sonnent vraiment.
   Le salon par defaut est #site-alliance (DISCORD_SITE_ALLIANCE_CHANNEL_ID).
   Le texte est envoye tel quel (Markdown Discord), l'image est jointe au
   message. Lit DISCORD_BOT_TOKEN dans l'environnement ou .env.local. */

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
const A_BLANC = process.argv.indexOf('--a-blanc') !== -1;
const EVERYONE = process.argv.indexOf('--everyone') !== -1;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SALON = arg('--salon') || process.env.DISCORD_SITE_ALLIANCE_CHANNEL_ID;
const FICHIER = arg('--message');
const IMAGE = arg('--image');

if (!TOKEN || !SALON || !FICHIER) {
    console.error('Usage : node bot/annonce.js --message fichier.txt [--image image.png] [--salon id] [--everyone] [--a-blanc]');
    process.exit(1);
}
const texte = fs.readFileSync(FICHIER, 'utf8').replace(/\r\n/g, '\n').trim();
if (!texte) { console.error('Message vide.'); process.exit(1); }
if (texte.length > 2000) { console.error('Message trop long pour Discord (' + texte.length + ' > 2000 caracteres).'); process.exit(1); }
if (IMAGE && !fs.existsSync(IMAGE)) { console.error('Image introuvable : ' + IMAGE); process.exit(1); }

console.log('Salon : ' + SALON + ' | @everyone : ' + (EVERYONE ? 'autorise' : 'bloque') + (IMAGE ? ' | image : ' + path.basename(IMAGE) + ' (' + Math.round(fs.statSync(IMAGE).size / 1024) + ' Ko)' : ' | sans image'));
console.log('----- message (' + texte.length + ' caracteres) -----\n' + texte + '\n----- fin -----');
if (A_BLANC) { console.log('\nMode a blanc : rien n a ete envoye.'); process.exit(0); }

(async () => {
    const payload = { content: texte, allowed_mentions: { parse: EVERYONE ? ['everyone'] : [] } };
    let body, headers = { Authorization: 'Bot ' + TOKEN };
    if (IMAGE) {
        body = new FormData();
        body.append('payload_json', JSON.stringify(payload));
        body.append('files[0]', new Blob([fs.readFileSync(IMAGE)], { type: 'image/png' }), path.basename(IMAGE));
    } else {
        body = JSON.stringify(payload);
        headers['Content-Type'] = 'application/json';
    }
    const r = await fetch('https://discord.com/api/v10/channels/' + SALON + '/messages', { method: 'POST', headers: headers, body: body });
    const t = await r.text();
    if (!r.ok) { console.error('ECHEC HTTP ' + r.status + ' : ' + t.slice(0, 300)); process.exit(1); }
    const m = JSON.parse(t);
    console.log('\nPublie : message ' + m.id + (m.attachments && m.attachments.length ? ' avec ' + m.attachments.length + ' piece(s) jointe(s)' : ''));
    console.log('Lien    : https://discord.com/channels/' + (process.env.DISCORD_GUILD_ID || '@me') + '/' + SALON + '/' + m.id);
})().catch(function (e) { console.error('ERREUR : ' + e.message); process.exit(1); });
